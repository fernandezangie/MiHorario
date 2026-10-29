import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestrictionController } from './controllers/restriction.controller';
import { RestrictionOrmEntity } from './persistence/typeorm/restriction.orm-entity';
import { RestrictionTypeOrmRepository } from './persistence/typeorm/restriction-typeorm.repository';
import { CreateRestrictionUseCase } from '@restriction/application/use-cases/create-restriction.use-case';
import { ListRestrictionsUseCase } from '@restriction/application/use-cases/list-restrictions.use-case';
import { FindRestrictionsByEmployeeUseCase } from '@restriction/application/use-cases/find-restrictions-by-employee.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([RestrictionOrmEntity])],
  controllers: [RestrictionController],
  providers: [
    CreateRestrictionUseCase,
    ListRestrictionsUseCase,
    FindRestrictionsByEmployeeUseCase, // <-- ¡Registrado aquí!
    {
      provide: 'RestrictionRepositoryPort',
      useClass: RestrictionTypeOrmRepository,
    },
  ],
  exports: [
    CreateRestrictionUseCase,
    ListRestrictionsUseCase,
    FindRestrictionsByEmployeeUseCase,
  ],
})
export class RestrictionModule {}