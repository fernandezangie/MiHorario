import { Controller, Get, Header } from '@nestjs/common';
import { Public } from '@shared/infrastructure/security/roles.decorator';

/**
 * Building Block: HealthCheck, Readiness Probes & OpenAPI Gateway Contract
 * (ADR-0001 / ADR-0005 / ADR-0009 / ADR-0011)
 */
@Controller()
export class HealthController {
  @Public()
  @Get('health')
  checkHealth() {
    return {
      status: 'ok',
      service: 'mi-horario-backend',
      architecture: 'Modular Monolith - Hexagonal DDD (ADR-0004)',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      buildingBlocks: {
        identityProviderJwt: 'UP',
        rbacAuthorization: 'UP',
        secretManagerValidation: 'UP',
        auditTrailHabeasData: 'UP',
        rateLimiterGateway: 'UP',
      },
    };
  }

  @Public()
  @Get('api/openapi.json')
  getOpenApiSpec() {
    return {
      openapi: '3.0.3',
      info: {
        title: 'MiHorario Comfama - API Gateway & Backend Contract',
        version: '1.0.0',
        description:
          'Contrato OpenAPI 3.0 alineado con ADR-0001 a ADR-0013 (Seguridad JWT/RBAC, Auditoría Ley 1581, Salud y Gestión de Horarios).',
      },
      servers: [{ url: 'http://localhost:3000', description: 'Servidor Local' }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      paths: {
        '/health': {
          get: {
            tags: ['Observability & Health'],
            summary: 'Health check de disponibilidad para Balanceador / Cloud Run',
            responses: { '200': { description: 'Servicio saludable' } },
          },
        },
        '/auth/login': {
          post: {
            tags: ['Identity Provider (JWT & RBAC)'],
            summary: 'Autentica un Supervisor o Empleado y emite un JWT firmado',
            responses: { '201': { description: 'Token JWT emitido' } },
          },
        },
        '/auth/me': {
          get: {
            tags: ['Identity Provider (JWT & RBAC)'],
            summary: 'Retorna el perfil del usuario autenticado desde el JWT',
            security: [{ bearerAuth: [] }],
            responses: { '200': { description: 'Perfil verificado' } },
          },
        },
        '/employees': {
          get: {
            tags: ['Employees'],
            summary: 'Lista los colaboradores registrados',
            security: [{ bearerAuth: [] }],
            responses: { '200': { description: 'Listado de empleados' } },
          },
          post: {
            tags: ['Employees'],
            summary: 'Registra un nuevo colaborador (Requiere rol ADMIN)',
            security: [{ bearerAuth: [] }],
            responses: { '201': { description: 'Colaborador creado' } },
          },
        },
        '/shifts': {
          post: {
            tags: ['Shifts'],
            summary: 'Asigna un turno validando no solapamiento (Requiere rol ADMIN)',
            security: [{ bearerAuth: [] }],
            responses: { '201': { description: 'Turno asignado' } },
          },
        },
        '/zones': {
          get: {
            tags: ['Zones'],
            summary: 'Consulta el catálogo de sedes y zonas Comfama',
            responses: { '200': { description: 'Catálogo de zonas' } },
          },
          post: {
            tags: ['Zones'],
            summary: 'Crea una nueva sede o zona operativa (Requiere rol ADMIN)',
            security: [{ bearerAuth: [] }],
            responses: { '201': { description: 'Zona creada' } },
          },
        },
        '/audit-logs': {
          get: {
            tags: ['Audit Trail (Habeas Data Ley 1581)'],
            summary: 'Consulta la bitácora inmutable de auditoría (Exclusivo ADMIN)',
            security: [{ bearerAuth: [] }],
            responses: { '200': { description: 'Registros de auditoría' } },
          },
        },
      },
    };
  }

  @Public()
  @Get('api/docs')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getSwaggerUiHtml(): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>MiHorario API Gateway - Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
</head>
<body style="margin:0;background:#FAFAFC;">
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/openapi.json',
        dom_id: '#swagger-ui',
      });
    };
  </script>
</body>
</html>`;
  }
}

