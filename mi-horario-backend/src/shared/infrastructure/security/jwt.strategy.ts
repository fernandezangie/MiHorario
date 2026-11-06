import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

function decodeToken(raw: string): { header: any; payload: any } | null {
  try {
    const [h, p] = raw.split('.');
    return {
      header: JSON.parse(Buffer.from(h, 'base64url').toString('utf8')),
      payload: JSON.parse(Buffer.from(p, 'base64url').toString('utf8')),
    };
  } catch {
    return null;
  }
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const localSecret =
      config.get<string>('JWT_SECRET') ||
      config.get<string>('security.jwtSecret');
    if (!localSecret) {
      throw new Error('JWT_SECRET no está configurado');
    }

    // Keycloak es opcional: sin KEYCLOAK_ISSUER solo se aceptan tokens propios
    const keycloakIssuer = (process.env.KEYCLOAK_ISSUER || '').replace(
      /\/$/,
      '',
    );
    const jwks = keycloakIssuer
      ? passportJwtSecret({
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 5,
          jwksUri: `${keycloakIssuer}/protocol/openid-connect/certs`,
        })
      : null;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: keycloakIssuer ? ['HS256', 'RS256'] : ['HS256'],
      secretOrKeyProvider: (request: any, rawJwtToken: any, done: any) => {
        const decoded = decodeToken(rawJwtToken);
        const alg = decoded?.header?.alg;

        // Tokens emitidos por este backend
        if (alg === 'HS256') {
          return done(null, localSecret);
        }

        // Tokens de Keycloak: solo si está configurado y el emisor coincide
        if (
          alg === 'RS256' &&
          jwks &&
          decoded?.payload?.iss === keycloakIssuer
        ) {
          return (jwks as any)(request, rawJwtToken, done);
        }

        return done(
          new UnauthorizedException('Algoritmo o emisor no permitido'),
        );
      },
    });
  }

  async validate(payload: any) {
    if (!payload?.sub) {
      throw new UnauthorizedException();
    }
    const roles: string[] =
      payload.roles ??
      (payload.role ? [payload.role] : (payload.realm_access?.roles ?? []));

    // Se conservan los campos originales del token (role, code, employeeId...)
    return {
      ...payload,
      userId: payload.sub,
      username: payload.preferred_username ?? payload.email,
      email: payload.email,
      roles,
    };
  }
}
