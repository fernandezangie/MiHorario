import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZoneController } from './controllers/zone.controller';
import { ZoneOrmEntity } from './persistence/typeorm/zone.orm-entity';
import { ZoneTypeOrmRepository } from './persistence/typeorm/zone-typeorm.repository';
import { CreateZoneUseCase } from '@zone/application/use-cases/create-zone.use-case';
import { ListZonesUseCase } from '@zone/application/use-cases/list-zones.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([ZoneOrmEntity])],
  controllers: [ZoneController],
  providers: [
    CreateZoneUseCase,
    ListZonesUseCase,
    {
      provide: 'ZoneRepositoryPort',
      useClass: ZoneTypeOrmRepository,
    },
  ],
  exports: [CreateZoneUseCase, ListZonesUseCase],
})
export class ZoneModule {}