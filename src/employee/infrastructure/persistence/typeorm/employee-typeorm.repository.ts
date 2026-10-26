import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeRepositoryPort } from '@employee/domain/ports/employee.repository.port';
import { EmployeeEntity } from '@employee/domain/model/entities/employee.entity';
import { EmployeeOrmEntity } from './employee.orm-entity';
import { EmployeeCode } from '@employee/domain/model/value-objects/employee-code.vo';
import { EmployeeName } from '@employee/domain/model/value-objects/employee-name.vo';
import { EmployeeEmail } from '@employee/domain/model/value-objects/employee-email.vo';
import { EmployeeStatus } from '@employee/domain/model/enums/employee-status.enum';

@Injectable()
export class EmployeeTypeOrmRepository implements EmployeeRepositoryPort {
  constructor(
    @InjectRepository(EmployeeOrmEntity)
    private readonly ormRepository: Repository<EmployeeOrmEntity>,
  ) {}

  private extractValue(prop: any): any {
    if (prop === null || prop === undefined) return prop;
    if (typeof prop.getValue === 'function') return prop.getValue();
    if (typeof prop.value !== 'undefined') return prop.value;
    return prop;
  }

  private toDomain(ormEntity: EmployeeOrmEntity): EmployeeEntity {
    return new EmployeeEntity(
      ormEntity.id,
      new EmployeeCode(ormEntity.jobId || 'DEFAULT'), // Mapeo de código desde jobId o similar
      new EmployeeName(ormEntity.name),
      new EmployeeEmail(ormEntity.email),
      EmployeeStatus.ACTIVE, // Estado por defecto si la base de datos no lo almacena
    );
  }

  async save(employee: EmployeeEntity): Promise<void> {
    const emp = employee as any;
    const ormEntity = new EmployeeOrmEntity();

    ormEntity.id = this.extractValue(emp.id);
    ormEntity.name = this.extractValue(emp.name);
    ormEntity.email = this.extractValue(emp.email);
    ormEntity.jobId = this.extractValue(emp.code); // Mapeando code a jobId según la BD

    await this.ormRepository.save(ormEntity);
  }

  async findById(id: any): Promise<EmployeeEntity | null> {
    const rawId = this.extractValue(id);
    const found = await this.ormRepository.findOne({ where: { id: rawId } });
    if (!found) return null;

    return this.toDomain(found);
  }

  async findByEmail(email: any): Promise<EmployeeEntity | null> {
    const rawEmail = this.extractValue(email);
    const found = await this.ormRepository.findOne({ where: { email: rawEmail } });
    if (!found) return null;

    return this.toDomain(found);
  }

  async findAll(): Promise<EmployeeEntity[]> {
    const list = await this.ormRepository.find();
    return list.map((item) => this.toDomain(item));
  }
}