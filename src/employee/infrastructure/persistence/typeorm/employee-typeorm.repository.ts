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

  async save(employee: EmployeeEntity): Promise<void> {
    const emp = employee as any;
    const ormEntity = new EmployeeOrmEntity();

    // Extrae el valor primitivo ya sea si es un objeto con .value o un string directo
    ormEntity.id = emp.id?.value ?? emp.id;
    ormEntity.name = emp.name?.value ?? emp.name;
    ormEntity.email = emp.email?.value ?? emp.email;
    ormEntity.jobId = emp.jobId?.value ?? emp.jobId;

    await this.ormRepository.save(ormEntity);
  }

  async findById(id: any): Promise<EmployeeEntity | null> {
    const rawId = typeof id === 'object' && id !== null && 'value' in id ? id.value : id;
    const found = await this.ormRepository.findOne({ where: { id: rawId } });
    if (!found) return null;

    return new EmployeeEntity(found.id as any, found.name as any, found.email as any, found.jobId as any);
  }

  async findByEmail(email: any): Promise<EmployeeEntity | null> {
    const rawEmail = typeof email === 'object' && email !== null && 'value' in email ? email.value : email;
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