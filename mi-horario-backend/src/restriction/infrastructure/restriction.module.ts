import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestrictionController } from './controllers/restriction.controller';
import { RestrictionOrmEntity } from './persistence/typeorm/restriction.orm.entity';
import { RestrictionTypeormRepository } from './persistence/typeorm/restriction.typeorm.repository';
import { CreateRestrictionUseCase } from '@restriction/application/usecases/create.restriction.use.case';
import { ListRestrictionsUseCase } from '@restriction/application/usecases/list.restrictions.use.case';
import { FindRestrictionsByEmployeeUseCase } from '@restriction/application/usecases/find.restrictions.by.employee.use.case';

@Module({
  imports: [TypeOrmModule.forFeature([RestrictionOrmEntity])],
  controllers: [RestrictionController],
  providers: [
    CreateRestrictionUseCase,
    ListRestrictionsUseCase,
    FindRestrictionsByEmployeeUseCase,
    {
      provide: 'RestrictionRepositoryPort',
      useClass: RestrictionTypeormRepository,
    },
  ],
  exports: [
    CreateRestrictionUseCase,
    ListRestrictionsUseCase,
    FindRestrictionsByEmployeeUseCase,
  ],
})
export class RestrictionModule {}