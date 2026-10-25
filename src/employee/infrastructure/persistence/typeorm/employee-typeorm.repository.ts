import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeRepositoryPort } from '@employee/domain/ports/employee.repository.port';
import { EmployeeEntity } from '@employee/domain/model/entities/employee.entity';
import { EmployeeOrmEntity } from './employee.orm-entity';

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

  async save(employee: EmployeeEntity): Promise<void> {
    const emp = employee as any;
    const ormEntity = new EmployeeOrmEntity();

    ormEntity.id = this.extractValue(emp.id);
    ormEntity.name = this.extractValue(emp.name);
    ormEntity.email = this.extractValue(emp.email);
    ormEntity.jobId = this.extractValue(emp.jobId);

    await this.ormRepository.save(ormEntity);
  }

  async findById(id: any): Promise<EmployeeEntity | null> {
    const rawId = this.extractValue(id);
    const found = await this.ormRepository.findOne({ where: { id: rawId } });
    if (!found) return null;

    return new EmployeeEntity(found.id as any, found.name as any, found.email as any, found.jobId as any);
  }

  async findByEmail(email: any): Promise<EmployeeEntity | null> {
    const rawEmail = this.extractValue(email);
    const found = await this.ormRepository.findOne({ where: { email: rawEmail } });
    if (!found) return null;

    return new EmployeeEntity(found.id as any, found.name as any, found.email as any, found.jobId as any);
  }

  async findAll(): Promise<EmployeeEntity[]> {
    const list = await this.ormRepository.find();
    return list.map(
      (item) => new EmployeeEntity(item.id as any, item.name as any, item.email as any, item.jobId as any),
    );
  }
}