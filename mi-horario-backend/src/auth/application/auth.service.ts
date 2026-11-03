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
import { MessageCatalogService } from '../../shared/infrastructure/messaging/message.catalog.service';

const DUMMY_HASH = hashPassword('HASH_PASSWORD');

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly users: Repository<UserOrmEntity>,
    @InjectRepository(EmployeeOrmEntity)
    private readonly employees: Repository<EmployeeOrmEntity>,
    private readonly config: ConfigService,
    private readonly messageCatalogService: MessageCatalogService,
  ) {}

  async register(dto: RegisterDto): Promise<UserOrmEntity> {
    const email = dto.email.toLowerCase().trim();

    if (await this.users.findOne({ where: { email } })) {
      const msg = await this.messageCatalogService.getMessage(
        'EMAIL_EXIST',
        'es',
      );
      throw new ConflictException(msg);
    }

    let name = (dto.name ?? '').trim();
    let code: string | null = null;
    let employeeId: string | null = null;

    if (dto.role === 'ADMIN') {
      await this.assertSupervisorKey(dto.registrationKey); // 👈 Ahora es await
      code = `SUP-${randomUUID().slice(0, 6).toUpperCase()}`;
    } else {
      const employee = await this.employees.findOne({
        where: { id: dto.code },
      });
      if (!employee || employee.email.toLowerCase().trim() !== email) {
        const msg = await this.messageCatalogService.getMessage(
          'USER_NOT_REGISTER',
          'es',
        );
        throw new ForbiddenException(msg);
      }
      if (await this.users.findOne({ where: { employeeId: employee.id } })) {
        const msg = await this.messageCatalogService.getMessage(
          'EMPLOYEE_EXIST',
          'es',
        );
        throw new ConflictException(msg);
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
        const msg = await this.messageCatalogService.getMessage(
          'EXIST_EMAIL_ACCOUNT',
          'es',
        );
        throw new ConflictException(msg);
      }
      throw err;
    }
  }

  async validateCredentials(
    emailRaw: string,
    password: string,
  ): Promise<UserOrmEntity> {
    const email = (emailRaw || '').toLowerCase().trim();
    const user = await this.users.findOne({ where: { email } });

    if (!user) {
      await verifyPassword(password, await DUMMY_HASH);
      const errorMsg = await this.messageCatalogService.getMessage(
        'EMPLOYEE_NOT_SYSYEM',
        'es',
      );
      throw new NotFoundException(errorMsg);
    }

    const passwordOk = await verifyPassword(password, user.passwordHash);
    if (!passwordOk) {
      const errorMsg = await this.messageCatalogService.getMessage(
        'PASSWORD_INCORRECT',
        'es',
      );
      throw new UnauthorizedException(errorMsg);
    }

    return user;
  }

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

  private async assertSupervisorKey(provided?: string): Promise<void> {
    const expected = this.config.get<string>('SUPERVISOR_REGISTRATION_KEY');
    if (!expected) {
      const msg = await this.messageCatalogService.getMessage(
        'SUPERVISOR_REGISTRATION_DISABLED',
        'es',
      );
      throw new ForbiddenException(msg);
    }
    const a = Buffer.from(provided ?? '');
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      const msg = await this.messageCatalogService.getMessage(
        'SUPERVISOR_KEY_INVALID',
        'es',
      );
      throw new ForbiddenException(msg);
    }
  }
}
