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
import { JwtTokenService } from '@shared/infrastructure/security/jwt.token.service';
import { Public } from '@shared/infrastructure/security/roles.decorator';
import { MessageCatalogService } from '@shared/infrastructure/messaging/message.catalog.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly authService: AuthService,
    private readonly messageCatalogService: MessageCatalogService,
  ) {}

  private attachSecureRefreshCookie(res: any, refreshToken: string): void {
    const cookieValue = [
      `mihorario_refresh_token=${refreshToken}`,
      'HttpOnly',
      'Secure',
      'SameSite=Strict',
      'Path=/auth',
      'Max-Age=604800',
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
  async loginWithGoogleOidc(
    @Body() body: GoogleOidcLoginDto,
    @Res({ passthrough: true }) res: any,
  ) {
    if (process.env.ENABLE_GOOGLE_LOGIN !== 'true') {
      const msg = await this.messageCatalogService.getMessage(
        'GOOGLE_LOGIN_DISABLED',
        'es',
      );
      throw new ForbiddenException(msg);
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

    const accessToken = this.jwtTokenService.sign(userProfile, 900);
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

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto);
    const successMsg = await this.messageCatalogService.getMessage(
      'REGISTER_SUCCESS',
      'es',
    );
    return {
      message: successMsg,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: any) {
    const user = await this.authService.validateCredentials(
      dto.email,
      dto.password,
    );
    const userProfile = this.authService.buildSessionProfile(user);

    const accessToken = this.jwtTokenService.sign(userProfile, 900);
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

  @Public()
  @Post('refresh')
  async refreshSession(
    @Req() req: any,
    @Body() body: RefreshTokenDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const incomingToken =
      this.extractRefreshTokenFromCookie(req) || body?.refreshToken;

    if (!incomingToken) {
      const errorMsg = await this.messageCatalogService.getMessage(
        'REFRESH_TOKEN_NOT_FOUND',
        'es',
      );
      throw new UnauthorizedException(errorMsg);
    }

    // 👈 AQUÍ ESTABA EL ERROR: Agregamos await porque rotateRefreshToken ahora es async
    const rotated =
      await this.jwtTokenService.rotateRefreshToken(incomingToken);
    this.attachSecureRefreshCookie(res, rotated.refreshToken);

    const refreshMsg = await this.messageCatalogService.getMessage(
      'SESSION_REFRESHED',
      'es',
    );

    return {
      message: refreshMsg,
      accessToken: rotated.accessToken,
      tokenType: 'Bearer',
      expiresIn: 900,
      refreshCookiePolicy:
        'HttpOnly; Secure; SameSite=Strict; Max-Age=604800 (7d)',
    };
  }

  @Public()
  @Post('logout')
  async logout(
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
    const logoutMsg = await this.messageCatalogService.getMessage(
      'LOGOUT_SUCCESS',
      'es',
    );
    return {
      message: logoutMsg,
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
