import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('shifts')
export class ShiftOrmEntity {
  @PrimaryColumn('varchar')
  id: string;

  @Column({ name: 'employeeId', type: 'varchar' })
  employeeId: string;

  @Column({ name: 'startTime', type: 'timestamptz' })
  startTime: Date;

  @Column({ name: 'endTime', type: 'timestamptz' })
  endTime: Date;

  @CreateDateColumn({
    name: 'createdAt',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
