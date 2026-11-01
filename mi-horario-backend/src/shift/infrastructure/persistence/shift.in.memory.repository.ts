import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ShiftRepositoryPort } from '@shift/domain/ports/shift.repository.port';
import { ShiftEntity } from '@shift/domain/model/entities/shift.entity';
import { ShiftOrmEntity } from '@shift/infrastructure/persistence/typeorm/shift.orm.entity';

@Injectable()
export class ShiftTypeormRepository implements ShiftRepositoryPort {
  constructor(
    @InjectRepository(ShiftOrmEntity)
    private readonly ormRepository: Repository<ShiftOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private extractValue(prop: any): any {
    if (prop === null || prop === undefined) return prop;
    if (typeof prop.getValue === 'function') return prop.getValue();
    if (typeof prop.value !== 'undefined') return prop.value;
    return prop;
  }

  private parseDate(dateProp: any): Date {
    const val = this.extractValue(dateProp);
    if (val instanceof Date) return val;
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  async save(shift: ShiftEntity): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;

    const shiftId = this.extractValue(shift.getId());
    const employeeId = this.extractValue(shift.getEmployeeId());

    // Fechas limpias convertidas a ISO string para la base de datos
    const startTimeObj = this.parseDate(shift.getStartTime());
    const endTimeObj = this.parseDate(shift.getEndTime());

    const startTimeIso = startTimeObj.toISOString();
    const endTimeIso = endTimeObj.toISOString();

    while (attempt < maxRetries) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction('SERIALIZABLE');

      try {
        // 1. Validación de solapamiento mediante SQL nativo seguro (Evita errores de parseo del ORM con timestamptz)
        const overlapping = await queryRunner.manager.query(
          `SELECT id FROM shifts 
           WHERE "employeeId" = $1 
             AND "startTime" <= $2 
             AND "endTime" >= $3 
           LIMIT 1`,
          [employeeId, endTimeIso, startTimeIso],
        );

        if (overlapping && overlapping.length > 0) {
          throw new ConflictException(
            'El empleado ya cuenta con un turno asignado que se solapa en este horario.',
          );
        }

        // 2. Preparar entidad ORM para guardar
        const ormEntity = new ShiftOrmEntity();
        ormEntity.id = shiftId;
        ormEntity.employeeId = employeeId;
        ormEntity.startTime = startTimeObj;
        ormEntity.endTime = endTimeObj;

        await queryRunner.manager.save(ormEntity);
        await queryRunner.commitTransaction();
        return;
      } catch (error) {
        await queryRunner.rollbackTransaction();

        // Manejo de reintentos CockroachDB (error 40001)
        if (error.code === '40001' && attempt < maxRetries - 1) {
          attempt++;
          await new Promise((resolve) =>
            setTimeout(resolve, 50 * Math.pow(2, attempt)),
          );
          continue;
        }

        throw error;
      } finally {
        await queryRunner.release();
      }
    }

    throw new ConflictException(
      'No se pudo procesar la transacción debido a alta concurrencia. Intente de nuevo.',
    );
  }

  async findById(id: any): Promise<ShiftEntity | null> {
    const rawId = this.extractValue(id);
    const found = await this.ormRepository.findOne({ where: { id: rawId } });
    if (!found) return null;

    return new ShiftEntity(
      found.id,
      found.employeeId,
      new Date(found.startTime),
      new Date(found.endTime),
    );
  }

  async findAll(): Promise<ShiftEntity[]> {
    const list = await this.ormRepository.find();
    return list.map((item) => {
      return new ShiftEntity(
        item.id,
        item.employeeId,
        new Date(item.startTime),
        new Date(item.endTime),
      );
    });
  }
}
