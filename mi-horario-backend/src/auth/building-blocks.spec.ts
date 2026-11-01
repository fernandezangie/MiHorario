import { ConfigService } from '@nestjs/config';
import { JwtTokenService } from '@shared/infrastructure/security/jwt-token.service';
import { AuditService } from '../audit/application/audit.service';
import { HealthController } from '../health/infrastructure/controllers/health.controller';
import { validationSchema } from '@shared/infrastructure/config/environment.validation';

describe('Verificación de Building Blocks Arquitectónicos (ADR-0001 a ADR-0011)', () => {
  let jwtService: JwtTokenService;
  let auditService: AuditService;
  let healthController: HealthController;

  beforeEach(() => {
    const configService = new ConfigService({
      JWT_SECRET: 'comfama-mihorario-jwt-secret-key-2026-adr0006',
    });
    jwtService = new JwtTokenService(configService);
    auditService = new AuditService();
    healthController = new HealthController();
  });

  it('Bloque 1 (Identity Provider JWT & RBAC): emite y verifica tokens firmados para ADMIN y EMPLOYEE', () => {
    const token = jwtService.sign({
      sub: 'ADM-001',
      code: 'SUP-0100',
      name: 'Daniela Gómez',
      email: 'daniela.gomez@comfama.com',
      role: 'ADMIN',
      title: 'Supervisora de Operaciones',
      department: 'Dirección Parque Rionegro',
    });

    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const decoded = jwtService.verify(token);
    expect(decoded.code).toBe('SUP-0100');
    expect(decoded.role).toBe('ADMIN');
    expect(decoded.aud).toBe(
      '407688951595-jhjhvthvriskj3c8q3goaamihg8q3a2o.apps.googleusercontent.com',
    );
  });

  it('Bloque 2 (Secret Manager Validation): valida variables de entorno y asigna valores seguros', () => {
    const { error, value } = validationSchema.validate({
      PORT: 3000,
      DB_HOST: 'localhost',
    });

    expect(error).toBeUndefined();
    expect(value.JWT_SECRET).toBeDefined();
    expect(value.RATE_LIMIT_MAX_REQUESTS).toBe(120);
  });

  it('Bloque 3 (HealthCheck & Auditoría Habeas Data): reporta salud activa y guarda bitácora inmutable', () => {
    const health = healthController.checkHealth();
    expect(health.status).toBe('ok');
    expect(health.buildingBlocks.identityProviderJwt).toBe('UP');

    auditService.record({
      traceId: 'TEST-TRACE-001',
      actorId: 'ADM-001',
      actorCode: 'SUP-0100',
      actorName: 'Daniela Gómez',
      actorRole: 'ADMIN',
      action: 'POST /shifts',
      resource: '/shifts',
      statusCode: 201,
      durationMs: 12,
      ipAddress: '127.0.0.1',
      summary: 'Creación de turno de prueba',
    });

    const logs = auditService.findAll();
    expect(logs.length).toBeGreaterThanOrEqual(2);
    expect(logs[0].traceId).toBe('TEST-TRACE-001');
  });

  it('Bloque 4 (API Gateway OpenAPI Contract): genera especificación OpenAPI 3.0.3 válida', () => {
    const spec = healthController.getOpenApiSpec();
    expect(spec.openapi).toBe('3.0.3');
    expect(spec.paths['/auth/login']).toBeDefined();
    expect(spec.paths['/audit-logs']).toBeDefined();
  });
});

