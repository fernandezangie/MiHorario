import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('shifts')
export class ShiftOrmEntity {
  @PrimaryColumn()
  id: string;

  @Column({ name: 'employeeId' })
  employeeId: string;

  @Column({ type: 'timestamptz', nullable: true })
  startTime: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endTime: Date | null;

  @Column({ nullable: true })
  status: string;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamptz', nullable: true })
  createdAt: Date;

  @Column({ type: 'boolean', default: false })
  acknowledged: boolean;

  @Column({ type: 'boolean', default: false, name: 'isRest' })
  isRest: boolean; // 👈 Agregado para soportar la Opción 2
}
