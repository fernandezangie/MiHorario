import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BrevoMailService {
  private readonly logger = new Logger(BrevoMailService.name);
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('mail.brevoApiKey') || '';
    this.fromEmail = this.config.get<string>('mail.fromEmail') || '';
    this.fromName = this.config.get<string>('mail.fromName') || 'Mi Horario';

    if (!this.apiKey || !this.fromEmail) {
      this.logger.warn(
        'Brevo no configurado (BREVO_API_KEY o MAIL_FROM_EMAIL faltan). Los correos no se enviarán.',
      );
    }
  }

  /** Devuelve true si Brevo aceptó el correo */
  async send(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.apiKey || !this.fromEmail) return false;

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': this.apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: this.fromEmail, name: this.fromName },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Brevo respondió ${res.status}: ${detail}`);
    }
    return true;
  }
}
