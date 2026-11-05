import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            // Extraer el token de la cabecera 'Authorization: Bearer <token>'
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,

            // Validar contra el emisor exacto de tu Realm
            issuer: 'https://keycloak-production-e61c.up.railway.app/realms/mihorarioapp',
            algorithms: ['RS256'],

            // Descargar dinámicamente la clave pública para verificar la firma
            secretOrKeyProvider: passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: 'https://keycloak-production-e61c.up.railway.app/realms/mihorarioapp/protocol/openid-connect/certs',
            }),
        });
    }

    // Se ejecuta automáticamente si el token es válido
    async validate(payload: any) {
        if (!payload) {
            throw new UnauthorizedException();
        }
        // Lo que retornes aquí quedará inyectado en req.user
        return {
            userId: payload.sub,
            username: payload.preferred_username,
            email: payload.email,
            roles: payload.realm_access?.roles || [],
        };
    }
}