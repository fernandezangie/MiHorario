import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/**
 * Cuenta de acceso al sistema (tabla "users").
 * - Supervisor (ADMIN): se registra con la clave de registro del servidor.
 * - Colaborador (EMPLOYEE): se vincula a un empleado ya existente en la tabla "employees".
 */
@Entity('users')
export class UserOrmEntity {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar', { unique: true })
  email: string;

  @Column('varchar')
  passwordHash: string;

  @Column('varchar')
  name: string;

  @Column('varchar')
  role: string; // 'ADMIN' | 'EMPLOYEE'

  @Column('varchar', { nullable: true })
  code: string | null;

  @Column('varchar', { nullable: true })
  employeeId: string | null;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
