import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('restrictions')
export class RestrictionOrmEntity {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  type: string;

  @Column('varchar', { nullable: true })
  description: string;

  @Column('varchar', { nullable: true })
  employeeId: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}