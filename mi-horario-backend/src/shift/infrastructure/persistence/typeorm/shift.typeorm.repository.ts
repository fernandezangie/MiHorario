import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  Repository,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';
import { ShiftRepositoryPort } from '@shift/domain/ports/shift.repository.port';
import { ShiftEntity } from '@shift/domain/model/entities/shift.entity';
import { ShiftOrmEntity } from './shift.orm.entity';

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
    return val instanceof Date ? val : new Date(val);
  }

  async save(shift: ShiftEntity): Promise<void> {
    const s = shift as any;
    const maxRetries = 3;
    let attempt = 0;

    const employeeId = this.extractValue(s.employeeId);
    const startTime = this.parseDate(s.startTime);
    const endTime = this.parseDate(s.endTime);

    while (attempt < maxRetries) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction('SERIALIZABLE');

      try {
        // 1. Validación de solapamiento
        const overlapping = await queryRunner.manager.findOne(ShiftOrmEntity, {
          where: {
            employeeId,
            startTime: LessThanOrEqual(endTime),
            endTime: MoreThanOrEqual(startTime),
          },
        });

        if (overlapping) {
          throw new ConflictException(
            'El empleado ya cuenta con un turno asignado que se solapa en este horario.',
          );
        }

        // 2. Preparar entidad ORM
        const ormEntity = new ShiftOrmEntity();
        ormEntity.id = this.extractValue(s.id);
        ormEntity.employeeId = employeeId;
        ormEntity.startTime = startTime;
        ormEntity.endTime = endTime;

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

    const entity = Object.create(ShiftEntity.prototype);
    return Object.assign(entity, {
      id: found.id,
      employeeId: found.employeeId,
      startTime: found.startTime,
      endTime: found.endTime,
    });
  }

  async findAll(): Promise<ShiftEntity[]> {
    const list = await this.ormRepository.find();
    return list.map((item) => {
      const entity = Object.create(ShiftEntity.prototype);
      return Object.assign(entity, {
        id: item.id,
        employeeId: item.employeeId,
        startTime: item.startTime,
        endTime: item.endTime,
      });
    });
  }
}
