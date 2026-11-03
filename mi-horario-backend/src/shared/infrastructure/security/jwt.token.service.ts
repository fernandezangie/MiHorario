import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID } from 'crypto';
import { MessageCatalogService } from '@shared/infrastructure/messaging/message.catalog.service'; // 👈 Importamos el catálogo

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

@Injectable()
export class JwtTokenService {
  private readonly consumedRefreshJtis = new Set<string>();

  constructor(
    private readonly configService: ConfigService,
    private readonly messageCatalogService: MessageCatalogService, // 👈 Inyectamos el servicio de Redis
  ) { }

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
    // 👈 Corregido el error tipográfico de sintaxis en el cálculo del padding
    const padLength = (4 - (input.length % 4)) % 4;
    const padded =
      input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLength);
    return Buffer.from(padded, 'base64').toString('utf8');
  }

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

  signRefreshToken(
    payload: Omit<
      JwtPayload,
      'iat' | 'exp' | 'iss' | 'aud' | 'jti' | 'tokenUse'
    >,
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

  async rotateRefreshToken(oldRefreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    payload: JwtPayload;
  }> {
    const decoded = this.verify(oldRefreshToken);

    if (decoded.tokenUse && decoded.tokenUse !== 'refresh') {
      const msg = await this.messageCatalogService.getMessage(
        'JWT_REFRESH_INVALID',
        'es',
      );
      throw new UnauthorizedException(msg);
    }

    if (decoded.jti && this.consumedRefreshJtis.has(decoded.jti)) {
      const msg = await this.messageCatalogService.getMessage(
        'JWT_REFRESH_REVOKED',
        'es',
      );
      throw new UnauthorizedException(msg);
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
    } catch { }
  }

  verify(token: string): JwtPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('JWT_FORMAT_INVALID');
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
      throw new UnauthorizedException('JWT_SIGNATURE_INVALID');
    }

    const payload: JwtPayload = JSON.parse(
      this.base64UrlDecode(encodedPayload),
    );
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new UnauthorizedException('JWT_EXPIRED');
    }

    return payload;
  }

  verifyGoogleIdToken(idToken: string): GoogleOidcClaims {
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('GOOGLE_OIDC_FORMAT_INVALID');
    }

    let claims: GoogleOidcClaims;
    try {
      claims = JSON.parse(this.base64UrlDecode(parts[1]));
    } catch {
      throw new UnauthorizedException('GOOGLE_OIDC_DECODE_ERROR');
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
      throw new UnauthorizedException('GOOGLE_OIDC_EXPIRED');
    }

    return claims;
  }
}
