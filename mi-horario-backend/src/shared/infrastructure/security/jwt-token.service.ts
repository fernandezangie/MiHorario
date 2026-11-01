import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID } from 'crypto';

/**
 * Claims exactos exigidos por ADR-0005 (Líneas 44-45):
 * - Access Token (15 min = 900s): sub, email, roles, employeeId, areaId
 * - Refresh Token (7 días = 604800s): incluye jti único para Refresh Token Rotation (RTR)
 */
export interface JwtPayload {
  iss?: string;
  aud?: string;
  jti?: string;
  tokenUse?: 'access' | 'refresh';
  sub: string;
  email: string;
  roles: ('ADMIN' | 'EMPLOYEE')[];
  role: 'ADMIN' | 'EMPLOYEE';
  employeeId: string;
  areaId: string;
  code: string;
  name: string;
  title: string;
  department: string;
  authProvider?: 'GOOGLE_OIDC' | 'LOCAL_JWT';
  iat?: number;
  exp?: number;
}

export interface GoogleOidcClaims {
  iss: string;
  aud: string;
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  iat: number;
  exp: number;
}

/**
 * Building Block: Paso 1 y Paso 2 de ADR-0005
 * - Paso 1: Access Token Stateless de 15 minutos (900s) validado en memoria (<1ms).
 * - Paso 2: Refresh Token de 7 días (604800s) con Rotación Obligatoria (RTR) y revocación.
 */
@Injectable()
export class JwtTokenService {
  // Registro en memoria de Refresh Tokens consumidos/revocados para cumplir RTR (ADR-0005 Línea 45 y 67)
  private readonly consumedRefreshJtis = new Set<string>();

  constructor(private readonly configService: ConfigService) {}

  private getSecret(): string {
    return (
      this.configService.get<string>('JWT_SECRET') ||
      this.configService.get<string>('security.jwtSecret') ||
      'comfama-mihorario-jwt-secret-key-2026-adr0006'
    );
  }

  getGoogleClientId(): string {
    return (
      this.configService.get<string>('GOOGLE_CLIENT_ID') ||
      this.configService.get<string>('security.googleClientId') ||
      '407688951595-jhjhvthvriskj3c8q3goaamihg8q3a2o.apps.googleusercontent.com'
    );
  }

  private base64UrlEncode(input: string): string {
    return Buffer.from(input)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  private base64UrlDecode(input: string): string {
    const padLength = (4 - (input.length % 4)) % 4;
    const padded =
      input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLength);
    return Buffer.from(padded, 'base64').toString('utf8');
  }

  /**
   * Paso 1 (ADR-0005): Firma el Access Token con vigencia corta de 15 minutos (900 segundos).
   */
  sign(
    payload: Omit<JwtPayload, 'iat' | 'exp' | 'iss' | 'aud'>,
    expiresInSeconds = 900,
  ): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const fullPayload: JwtPayload = {
      iss: 'https://mihorario.comfama.com/oidc',
      aud: this.getGoogleClientId(),
      jti: payload.jti || randomUUID(),
      tokenUse: payload.tokenUse || 'access',
      ...payload,
      iat: now,
      exp: now + expiresInSeconds,
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(fullPayload));
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    const signature = createHmac('sha256', this.getSecret())
      .update(signingInput)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return `${signingInput}.${signature}`;
  }

  /**
   * Paso 2 (ADR-0005 Línea 45): Emite un Refresh Token de 7 días (604800 segundos)
   * con un identificador único (jti) para controlar la Rotación de Refresh Tokens (RTR).
   */
  signRefreshToken(
    payload: Omit<JwtPayload, 'iat' | 'exp' | 'iss' | 'aud' | 'jti' | 'tokenUse'>,
    expiresInSeconds = 604800,
  ): string {
    return this.sign(
      {
        ...payload,
        jti: randomUUID(),
        tokenUse: 'refresh',
      },
      expiresInSeconds,
    );
  }

  /**
   * Paso 2 (ADR-0005 Línea 45): Rotación Obligatoria de Refresh Token (RTR).
   * Invalida el Refresh Token anterior para que nunca pueda reutilizarse y emite
   * un nuevo par (Access Token de 15 min + Nuevo Refresh Token de 7 días).
   */
  rotateRefreshToken(oldRefreshToken: string): {
    accessToken: string;
    refreshToken: string;
    payload: JwtPayload;
  } {
    const decoded = this.verify(oldRefreshToken);

    if (decoded.tokenUse && decoded.tokenUse !== 'refresh') {
      throw new UnauthorizedException(
        'El token proporcionado no es un Refresh Token válido.',
      );
    }

    if (decoded.jti && this.consumedRefreshJtis.has(decoded.jti)) {
      throw new UnauthorizedException(
        'Alerta de seguridad (RTR - ADR-0005): Este Refresh Token ya fue utilizado o revocado.',
      );
    }

    if (decoded.jti) {
      this.consumedRefreshJtis.add(decoded.jti);
    }

    const cleanProfile: Omit<
      JwtPayload,
      'iat' | 'exp' | 'iss' | 'aud' | 'jti' | 'tokenUse'
    > = {
      sub: decoded.sub,
      email: decoded.email,
      roles: decoded.roles,
      role: decoded.role,
      employeeId: decoded.employeeId,
      areaId: decoded.areaId,
      code: decoded.code,
      name: decoded.name,
      title: decoded.title,
      department: decoded.department,
      authProvider: decoded.authProvider,
    };

    const accessToken = this.sign(cleanProfile, 900);
    const refreshToken = this.signRefreshToken(cleanProfile, 604800);

    return { accessToken, refreshToken, payload: decoded };
  }

  revokeToken(token: string): void {
    try {
      const decoded = this.verify(token);
      if (decoded.jti) {
        this.consumedRefreshJtis.add(decoded.jti);
      }
    } catch {
      // Si ya expiró no requiere acción adicional
    }
  }

  /**
   * Verifica la firma criptográfica y expiración en memoria (<1ms) sin consultar CockroachDB.
   */
  verify(token: string): JwtPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Formato de token JWT inválido.');
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = createHmac('sha256', this.getSecret())
      .update(signingInput)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (signature !== expectedSignature) {
      throw new UnauthorizedException('Firma de token JWT no válida.');
    }

    const payload: JwtPayload = JSON.parse(this.base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new UnauthorizedException(
        'El token JWT ha expirado. Usa /auth/refresh o inicia sesión nuevamente.',
      );
    }

    return payload;
  }

  verifyGoogleIdToken(idToken: string): GoogleOidcClaims {
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException(
        'El id_token de Google OpenID Connect no tiene un formato JWT válido.',
      );
    }

    let claims: GoogleOidcClaims;
    try {
      claims = JSON.parse(this.base64UrlDecode(parts[1]));
    } catch {
      throw new UnauthorizedException(
        'No se pudo decodificar el payload del id_token de Google OIDC.',
      );
    }

    const validIssuers = ['https://accounts.google.com', 'accounts.google.com'];
    if (!validIssuers.includes(claims.iss)) {
      throw new UnauthorizedException(
        `Emisor OIDC inválido (${claims.iss}). Se esperaba Google Cloud.`,
      );
    }

    const expectedClientId = this.getGoogleClientId();
    if (claims.aud !== expectedClientId) {
      throw new UnauthorizedException(
        `El Client ID del token (${claims.aud}) no coincide con el configurado en Google Cloud.`,
      );
    }

    const now = Math.floor(Date.now() / 1000);
    if (claims.exp && claims.exp < now) {
      throw new UnauthorizedException(
        'El id_token de Google OpenID Connect ha expirado.',
      );
    }

    return claims;
  }
}
