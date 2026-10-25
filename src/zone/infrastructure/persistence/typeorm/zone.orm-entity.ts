import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('zones')
export class ZoneOrmEntity {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  name: string;

  @Column('varchar', { nullable: true })
  description: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}