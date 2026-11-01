import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('jobs')
export class JobOrmEntity {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  title: string;

  @Column('varchar', { nullable: true })
  description: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}