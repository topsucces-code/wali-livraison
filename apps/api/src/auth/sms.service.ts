import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { authenticator } from 'otplib';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly twilioClient: Twilio;
  private readonly otpSecret: string;

  constructor(private configService: ConfigService) {
    // Configuration Twilio
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    
    if (accountSid && authToken) {
      this.twilioClient = new Twilio(accountSid, authToken);
    }

    // Secret pour la génération d'OTP
    this.otpSecret = this.configService.get<string>('OTP_SECRET') || 'WALI_LIVRAISON_SECRET';
  }

  /**
   * Génère un code OTP à 6 chiffres
   */
  generateOtp(phone: string): string {
    // Utilise le numéro de téléphone comme token unique
    const token = `${this.otpSecret}_${phone}_${Date.now()}`;
    
    // Configure OTP avec 6 chiffres et validité de 5 minutes
    authenticator.options = {
      digits: 6,
      step: 300, // 5 minutes
      window: 1
    };

    return authenticator.generate(token);
  }

  /**
   * Vérifie un code OTP
   */
  verifyOtp(phone: string, otp: string): boolean {
    try {
      // En mode développement, accepte le code 123456
      if (this.configService.get<string>('NODE_ENV') === 'development' && otp === '123456') {
        this.logger.debug(`Code OTP de développement utilisé pour ${phone}`);
        return true;
      }

      // Génère le token pour ce numéro
      const token = `${this.otpSecret}_${phone}`;
      
      authenticator.options = {
        digits: 6,
        step: 300, // 5 minutes
        window: 1
      };

      const isValid = authenticator.check(otp, token);
      
      if (isValid) {
        this.logger.log(`Code OTP vérifié avec succès pour ${phone}`);
      } else {
        this.logger.warn(`Code OTP invalide pour ${phone}`);
      }

      return isValid;
    } catch (error) {
      this.logger.error(`Erreur lors de la vérification OTP pour ${phone}:`, error);
      return false;
    }
  }

  /**
   * Envoie un SMS avec le code OTP
   */
  async sendOtp(phone: string, otp: string): Promise<boolean> {
    try {
      const message = `Votre code de vérification WALI Livraison est: ${otp}. Ce code expire dans 5 minutes.`;

      // En mode développement, log le code au lieu d'envoyer le SMS
      if (this.configService.get<string>('NODE_ENV') === 'development') {
        this.logger.debug(`[DEV] Code OTP pour ${phone}: ${otp}`);
        return true;
      }

      // Vérification de la configuration Twilio
      if (!this.twilioClient) {
        this.logger.error('Twilio n\'est pas configuré. Vérifiez TWILIO_ACCOUNT_SID et TWILIO_AUTH_TOKEN');
        return false;
      }

      const fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');
      if (!fromNumber) {
        this.logger.error('TWILIO_PHONE_NUMBER n\'est pas configuré');
        return false;
      }

      // Envoi du SMS via Twilio
      const result = await this.twilioClient.messages.create({
        body: message,
        from: fromNumber,
        to: phone
      });

      this.logger.log(`SMS envoyé avec succès à ${phone}. SID: ${result.sid}`);
      return true;

    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi du SMS à ${phone}:`, error);
      return false;
    }
  }

  /**
   * Envoie un SMS de bienvenue
   */
  async sendWelcomeSms(phone: string, firstName: string): Promise<boolean> {
    try {
      const message = `Bienvenue sur WALI Livraison, ${firstName}! Votre compte a été créé avec succès. Commandez maintenant et faites-vous livrer partout en Côte d'Ivoire.`;

      // En mode développement, log le message
      if (this.configService.get<string>('NODE_ENV') === 'development') {
        this.logger.debug(`[DEV] SMS de bienvenue pour ${phone}: ${message}`);
        return true;
      }

      if (!this.twilioClient) {
        this.logger.warn('Twilio non configuré - SMS de bienvenue non envoyé');
        return false;
      }

      const fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');
      const result = await this.twilioClient.messages.create({
        body: message,
        from: fromNumber,
        to: phone
      });

      this.logger.log(`SMS de bienvenue envoyé à ${phone}. SID: ${result.sid}`);
      return true;

    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi du SMS de bienvenue à ${phone}:`, error);
      return false;
    }
  }
}
