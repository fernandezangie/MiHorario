import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConfigTestService {
  constructor(private readonly configService: ConfigService) {
    const dbPassword = this.configService.get<string>('database.password');
    const redisPassword = this.configService.get<string>('redis.password');

    // Usamos console.log o console.warn correctamente
    console.log('Contraseña DB leída correctamente:', dbPassword ? 'Sí' : 'No');
    console.warn(
      'Contraseña Redis leída correctamente:', redisPassword ? 'Sí' : 'No',
    );
  }
}
