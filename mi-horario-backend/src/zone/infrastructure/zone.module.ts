import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZoneController } from './controllers/zone.controller';
import { ZoneOrmEntity } from './persistence/typeorm/zone.orm.entity';
import { ZoneTypeormRepository } from './persistence/typeorm/zone.typeorm.repository';
import { CreateZoneUseCase } from '@zone/application/usecases/create.zone.use.case';
import { ListZonesUseCase } from '@zone/application/usecases/list.zones.use.case';
import { SharedModule } from '@shared/infrastructure/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([ZoneOrmEntity]), SharedModule],
  controllers: [ZoneController],
  providers: [
    CreateZoneUseCase,
    ListZonesUseCase,
    {
      provide: 'ZoneRepositoryPort',
      useClass: ZoneTypeormRepository,
    },
  ],
  exports: [CreateZoneUseCase, ListZonesUseCase],
})
export class ZoneModule { }