import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('shifts')
export class ShiftOrmEntity {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  employeeId: string;

  @Column('timestamptz')
  startTime: Date;

  @Column('timestamptz')
  endTime: Date;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}