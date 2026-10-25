import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('employees')
export class EmployeeOrmEntity {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  name: string;

  @Column('varchar')
  email: string;

  @Column('varchar')
  jobId: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}