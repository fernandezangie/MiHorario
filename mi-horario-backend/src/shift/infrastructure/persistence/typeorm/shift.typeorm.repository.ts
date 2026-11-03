import { Injectable, ConflictException, Inject } from '@nestjs/common';
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
import { MessageCatalogService } from '@shared/infrastructure/messaging/message.catalog.service'; // 👈 Importamos el servicio

@Injectable()
export class ShiftTypeormRepository implements ShiftRepositoryPort {
  constructor(
    @InjectRepository(ShiftOrmEntity)
    private readonly ormRepository: Repository<ShiftOrmEntity>,
    private readonly dataSource: DataSource,
    private readonly messageCatalogService: MessageCatalogService,
  ) {}

  private extractValue(prop: any): any {
    if (prop === null || prop === undefined) return prop;
    if (typeof prop.getValue === 'function') return prop.getValue();
    if (typeof prop.value !== 'undefined') return prop.value;
    return prop;
  }

  private parseDate(dateProp: any): Date | null {
    const val = this.extractValue(dateProp);
    if (!val) return null;
    return val instanceof Date ? val : new Date(val);
  }

  async save(shift: ShiftEntity): Promise<void> {
    const s = shift as any;
    const maxRetries = 3;
    let attempt = 0;

    const shiftId = this.extractValue(s.id);
    const employeeId = this.extractValue(s.employeeId);
    const startTime = this.parseDate(s.startTime);
    const endTime = this.parseDate(s.endTime);
    const status = this.extractValue(s.status);

    const acknowledged =
      typeof s.isAcknowledged === 'function'
        ? s.isAcknowledged()
        : (this.extractValue(s.acknowledged) ?? false);

    const isRest =
      typeof s.getIsRest === 'function'
        ? s.getIsRest()
        : (this.extractValue(s.isRest) ?? false);

    const zone =
      typeof s.getZone === 'function'
        ? s.getZone()
        : (this.extractValue(s.zone) ?? null);

    const job =
      typeof s.getJob === 'function'
        ? s.getJob()
        : (this.extractValue(s.job) ?? null);

    while (attempt < maxRetries) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction('SERIALIZABLE');

      try {
        if (!isRest && startTime && endTime) {
          const overlapping = await queryRunner.manager.findOne(
            ShiftOrmEntity,
            {
              where: {
                employeeId,
                startTime: LessThanOrEqual(endTime),
                endTime: MoreThanOrEqual(startTime),
              },
            },
          );

          if (overlapping && overlapping.id !== shiftId) {
            const msg = await this.messageCatalogService.getMessage(
              'SHIFT_OVERLAP_CONFLICT',
              'es',
            );
            throw new ConflictException(msg);
          }
        }

        const ormEntity = new ShiftOrmEntity();
        ormEntity.id = shiftId;
        ormEntity.employeeId = employeeId;
        ormEntity.startTime = startTime;
        ormEntity.endTime = endTime;
        ormEntity.status = status;
        ormEntity.acknowledged = acknowledged;
        ormEntity.isRest = isRest;
        ormEntity.zoneId = zone;
        ormEntity.jobId = job;

        await queryRunner.manager.save(ormEntity);
        await queryRunner.commitTransaction();
        return;
      } catch (error) {
        await queryRunner.rollbackTransaction();

        if (error.code === '40001' && attempt < maxRetries) {
          attempt++;
          await new Promise(
            (resolve) => setTimeout(resolve, 50 * Math.pow(2, attempt)), // 👈 Sintaxis corregida con el operador *
          );
          continue;
        }

        throw error;
      } finally {
        await queryRunner.release();
      }
    }

    const concurrencyMsg = await this.messageCatalogService.getMessage(
      'SHIFT_CONCURRENCY_ERROR',
      'es',
    );
    throw new ConflictException(concurrencyMsg);
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
      status: found.status,
      acknowledged: found.acknowledged ?? false,
      isRest: found.isRest ?? false,
      zone: found.zoneId ?? null,
      job: found.jobId ?? null,
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
        status: item.status,
        acknowledged: item.acknowledged ?? false,
        isRest: item.isRest ?? false,
        zone: item.zoneId ?? null,
        job: item.jobId ?? null,
      });
    });
  }
}
