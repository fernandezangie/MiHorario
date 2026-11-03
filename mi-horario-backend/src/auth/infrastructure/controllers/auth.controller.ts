import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';
import { AuthService } from '../../application/auth.service';
import { GoogleOidcLoginDto, RefreshTokenDto } from '../dtos/google-oidc.dto';
import { JwtTokenService } from '@shared/infrastructure/security/jwt-token.service';
import { Public } from '@shared/infrastructure/security/roles.decorator';

/**
 * Building Block: Identity Provider - OpenID Connect (Google Cloud) + OAuth2 + JWT
 * Implementa Paso 1 y Paso 2 de ADR-0005:
 * - Paso 1: Access Token de 15 min (900s) con sub, email, roles, employeeId, areaId.
 * - Paso 2: Refresh Token de 7 días (604800s) en cookie HttpOnly, Secure, SameSite=Strict
 *   con Rotación Obligatoria de Tokens (Refresh Token Rotation - RTR) en POST /auth/refresh.
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Configura la cookie sellada HttpOnly + Secure + SameSite=Strict exigida por ADR-0005 Línea 45
   * para proteger el Refresh Token frente a ataques XSS y CSRF.
   */
  private attachSecureRefreshCookie(res: any, refreshToken: string): void {
    const cookieValue = [
      `mihorario_refresh_token=${refreshToken}`,
      'HttpOnly',
      'Secure',
      'SameSite=Strict',
      'Path=/auth',
      'Max-Age=604800', // 7 días en segundos (ADR-0005 Línea 45)
    ].join('; ');
    res.setHeader('Set-Cookie', cookieValue);
  }

  private extractRefreshTokenFromCookie(req: any): string | null {
    const cookieHeader: string | undefined = req.headers?.cookie;
    if (!cookieHeader) return null;
    const match = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('mihorario_refresh_token='));
    return match ? match.split('=')[1] : null;
  }

  @Public()
  @Get('.well-known/openid-configuration')
  getOidcDiscovery() {
    return {
      issuer: 'https://accounts.google.com',
      client_id: this.jwtTokenService.getGoogleClientId(),
      authorization_endpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      token_endpoint: 'http://localhost:3000/auth/oidc/google',
      refresh_endpoint: 'http://localhost:3000/auth/refresh',
      userinfo_endpoint: 'http://localhost:3000/auth/userinfo',
      jwks_uri: 'https://www.googleapis.com/oauth2/v3/certs',
      response_types_supported: ['code', 'id_token', 'token id_token'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256', 'HS256'],
      scopes_supported: ['openid', 'email', 'profile'],
      claims_supported: [
        'sub',
        'email',
        'roles',
        'employeeId',
        'areaId',
        'iss',
        'aud',
        'exp',
        'iat',
      ],
    };
  }

  @Public()
  @Post('oidc/google')
  loginWithGoogleOidc(
    @Body() body: GoogleOidcLoginDto,
    @Res({ passthrough: true }) res: any,
  ) {
    // SEGURIDAD: verifyGoogleIdToken solo decodifica el token, NO comprueba la firma
    // de Google, así que cualquiera podría fabricar uno. Se mantiene apagado hasta
    // verificar la firma (p. ej. con google-auth-library) y exigir usuario registrado.
    if (process.env.ENABLE_GOOGLE_LOGIN !== 'true') {
      throw new ForbiddenException(
        'El inicio de sesión con Google está deshabilitado.',
      );
    }
    const googleClaims = this.jwtTokenService.verifyGoogleIdToken(body.idToken);
    const targetRole = body.role === 'EMPLOYEE' ? 'EMPLOYEE' : 'ADMIN';

    const userProfile =
      targetRole === 'EMPLOYEE'
        ? {
            sub: `GOOGLE-${googleClaims.sub}`,
            email: googleClaims.email,
            roles: ['EMPLOYEE' as const],
            role: 'EMPLOYEE' as const,
            employeeId: 'EMP-1001',
            areaId: 'AREA-PARQUE-01',
            code: 'COM-2000',
            name: googleClaims.name || 'Carlos Rodríguez',
            title: 'Operador de Atracciones (Google OIDC)',
            department: 'Operaciones Parque',
            authProvider: 'GOOGLE_OIDC' as const,
          }
        : {
            sub: `GOOGLE-${googleClaims.sub}`,
            email: googleClaims.email,
            roles: ['ADMIN' as const],
            role: 'ADMIN' as const,
            employeeId: 'ADM-001',
            areaId: 'AREA-DIRECCION-01',
            code: 'SUP-0100',
            name: googleClaims.name || 'Daniela Gómez',
            title: 'Supervisora de Operaciones (Google OIDC)',
            department: 'Dirección Parque Rionegro',
            authProvider: 'GOOGLE_OIDC' as const,
          };

    // Paso 1: Access Token de 15 minutos (900s)
    const accessToken = this.jwtTokenService.sign(userProfile, 900);
    // Paso 2: Refresh Token de 7 días (604800s) en cookie HttpOnly + Secure + SameSite=Strict
    const refreshToken = this.jwtTokenService.signRefreshToken(
      userProfile,
      604800,
    );
    this.attachSecureRefreshCookie(res, refreshToken);

    return {
      protocol: 'OpenID Connect 1.0 (Google Cloud) - ADR-0005',
      idToken: body.idToken,
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 900,
      refreshCookiePolicy:
        'HttpOnly; Secure; SameSite=Strict; Max-Age=604800 (7d)',
      oidcClaims: {
        sub: userProfile.sub,
        email: userProfile.email,
        roles: userProfile.roles,
        employeeId: userProfile.employeeId,
        areaId: userProfile.areaId,
      },
      user: {
        id: userProfile.employeeId,
        code: userProfile.code,
        name: userProfile.name,
        email: userProfile.email,
        role: userProfile.role,
        title: userProfile.title,
        department: userProfile.department,
        token: accessToken,
      },
    };
  }

  /**
   * Registro de cuentas nuevas (Supervisor o Colaborador).
   */
  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto);
    return {
      message: 'Registro exitoso. Ya puedes iniciar sesión.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  /**
   * Login contra la base de datos: solo entra quien esté registrado y escriba
   * su contraseña correcta. El perfil (ADMIN/EMPLOYEE) lo define la base, no el cliente.
   */
  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: any) {
    const user = await this.authService.validateCredentials(
      dto.email,
      dto.password,
    );
    const userProfile = this.authService.buildSessionProfile(user);

    // Paso 1: Access Token de 15 minutos (900s)
    const accessToken = this.jwtTokenService.sign(userProfile, 900);
    // Paso 2: Refresh Token de 7 días (604800s) en cookie HttpOnly + Secure + SameSite=Strict
    const refreshToken = this.jwtTokenService.signRefreshToken(
      userProfile,
      604800,
    );
    this.attachSecureRefreshCookie(res, refreshToken);

    return {
      protocol: 'OAuth 2.0 + JWT Stateless (ADR-0005)',
      accessToken,
      idToken: accessToken,
      tokenType: 'Bearer',
      expiresIn: 900,
      refreshCookiePolicy:
        'HttpOnly; Secure; SameSite=Strict; Max-Age=604800 (7d)',
      claims: {
        sub: userProfile.sub,
        email: userProfile.email,
        roles: userProfile.roles,
        employeeId: userProfile.employeeId,
        areaId: userProfile.areaId,
      },
      user: {
        id: userProfile.employeeId,
        code: userProfile.code,
        name: userProfile.name,
        email: userProfile.email,
        role: userProfile.role,
        title: userProfile.title,
        department: userProfile.department,
        token: accessToken,
      },
    };
  }

  /**
   * Paso 2 de ADR-0005 (Línea 45): Renovación y Rotación de Refresh Token (RTR).
   * Lee el Refresh Token de la cookie HttpOnly (o del body en pruebas), invalida el
   * token anterior para que nunca pueda reutilizarse y emite un nuevo par de tokens.
   */
  @Public()
  @Post('refresh')
  refreshSession(
    @Req() req: any,
    @Body() body: RefreshTokenDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const incomingToken =
      this.extractRefreshTokenFromCookie(req) || body?.refreshToken;

    if (!incomingToken) {
      throw new UnauthorizedException(
        'No se encontró cookie HttpOnly mihorario_refresh_token para renovar la sesión.',
      );
    }

    const rotated = this.jwtTokenService.rotateRefreshToken(incomingToken);
    this.attachSecureRefreshCookie(res, rotated.refreshToken);

    return {
      message:
        'Sesión renovada mediante Refresh Token Rotation (RTR - ADR-0005)',
      accessToken: rotated.accessToken,
      tokenType: 'Bearer',
      expiresIn: 900,
      refreshCookiePolicy:
        'HttpOnly; Secure; SameSite=Strict; Max-Age=604800 (7d)',
    };
  }

  /**
   * Cierre de sesión seguro: revoca el Refresh Token activo y limpia la cookie HttpOnly.
   */
  @Public()
  @Post('logout')
  logout(
    @Req() req: any,
    @Body() body: RefreshTokenDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const incomingToken =
      this.extractRefreshTokenFromCookie(req) || body?.refreshToken;
    if (incomingToken) {
      this.jwtTokenService.revokeToken(incomingToken);
    }
    res.setHeader(
      'Set-Cookie',
      'mihorario_refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/auth; Max-Age=0',
    );
    return {
      message: 'Sesión cerrada y Refresh Token revocado correctamente.',
    };
  }

  @Get('userinfo')
  getOidcUserInfo(@Req() req: any) {
    const u = req.user;
    return {
      sub: u.sub,
      email: u.email,
      roles: u.roles || [u.role],
      employeeId: u.employeeId || u.sub,
      areaId: u.areaId || 'AREA-PARQUE-01',
      name: u.name,
      employee_code: u.code,
      department: u.department,
      auth_provider: u.authProvider || 'LOCAL_JWT',
    };
  }

  @Get('me')
  getProfile(@Req() req: any) {
    return {
      authenticated: true,
      user: req.user,
    };
  }
}
