import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { EmployeeOrmEntity } from '../../employee/infrastructure/persistence/typeorm/employee.orm.entity';
import { UserOrmEntity } from '../infrastructure/persistence/typeorm/user.orm.entity';
import { RegisterDto } from '../infrastructure/dtos/register.dto';
import { hashPassword, verifyPassword } from './password.hasher';

// Hash de relleno: se usa cuando el correo no existe para mitigar diferencias de tiempo extremos.
const DUMMY_HASH = hashPassword('contraseña-de-relleno-no-valida');

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly users: Repository<UserOrmEntity>,
    @InjectRepository(EmployeeOrmEntity)
    private readonly employees: Repository<EmployeeOrmEntity>,
    private readonly config: ConfigService,
  ) {}

  /** Registra una cuenta nueva. Solo entra quien cumpla las reglas de su perfil. */
  async register(dto: RegisterDto): Promise<UserOrmEntity> {
    const email = dto.email.toLowerCase().trim();

    if (await this.users.findOne({ where: { email } })) {
      throw new ConflictException(
        'Ya existe una cuenta registrada con ese correo.',
      );
    }

    let name = (dto.name ?? '').trim();
    let code: string | null = null;
    let employeeId: string | null = null;

    if (dto.role === 'ADMIN') {
      this.assertSupervisorKey(dto.registrationKey);
      code = `SUP-${randomUUID().slice(0, 6).toUpperCase()}`;
    } else {
      // Colaborador: debe existir en "employees" con ese código Y ese correo.
      const employee = await this.employees.findOne({
        where: { id: dto.code },
      });
      if (!employee || employee.email.toLowerCase().trim() !== email) {
        throw new ForbiddenException(
          'No encontramos un colaborador registrado con ese código y correo. ' +
            'Pide a tu supervisor que te registre primero.',
        );
      }
      if (await this.users.findOne({ where: { employeeId: employee.id } })) {
        throw new ConflictException(
          'Este colaborador ya tiene una cuenta creada.',
        );
      }
      code = employee.id;
      employeeId = employee.id;
      name = employee.name;
    }

    const user = this.users.create({
      id: randomUUID(),
      email,
      passwordHash: await hashPassword(dto.password),
      name,
      role: dto.role,
      code,
      employeeId,
    });

    try {
      return await this.users.save(user);
    } catch (err: any) {
      if (err?.code === '23505') {
        throw new ConflictException(
          'Ya existe una cuenta registrada con ese correo.',
        );
      }
      throw err;
    }
  }

  /** Valida correo + contraseña devolviendo mensajes explícitos para cada caso. */
  async validateCredentials(
    emailRaw: string,
    password: string,
  ): Promise<UserOrmEntity> {
    const email = (emailRaw || '').toLowerCase().trim();
    const user = await this.users.findOne({ where: { email } });

    // 1. Si el correo no existe en la base de datos
    if (!user) {
      await verifyPassword(password, await DUMMY_HASH); // consumo de tiempo uniforme
      throw new NotFoundException(
        'El usuario no está registrado en el sistema.',
      );
    }

    // 2. Si el correo existe pero la contraseña no coincide
    const passwordOk = await verifyPassword(password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('La contraseña es incorrecta.');
    }

    return user;
  }

  /** Datos que viajan dentro del token JWT. */
  buildSessionProfile(user: UserOrmEntity) {
    const role = user.role as 'ADMIN' | 'EMPLOYEE';
    const isAdmin = role === 'ADMIN';
    return {
      sub: user.id,
      email: user.email,
      roles: [role],
      role,
      employeeId: user.employeeId ?? user.id,
      areaId: isAdmin ? 'AREA-DIRECCION-01' : 'AREA-PARQUE-01',
      code: user.code ?? '',
      name: user.name,
      title: isAdmin ? 'Supervisor de Operaciones' : 'Colaborador',
      department: isAdmin ? 'Dirección Parque Rionegro' : 'Operaciones Parque',
      authProvider: 'LOCAL_JWT' as const,
    };
  }

  private assertSupervisorKey(provided?: string): void {
    const expected = this.config.get<string>('SUPERVISOR_REGISTRATION_KEY');
    if (!expected) {
      throw new ForbiddenException(
        'El registro de supervisores no está habilitado en el servidor.',
      );
    }
    const a = Buffer.from(provided ?? '');
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new ForbiddenException(
        'La clave de registro de supervisor no es válida.',
      );
    }
  }
}
