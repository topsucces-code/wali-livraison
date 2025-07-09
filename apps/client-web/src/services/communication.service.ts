// Service de communication Email/SMS pour WALI Livraison

export interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

export interface SMSTemplate {
  message: string;
  maxLength: number;
}

export interface CommunicationData {
  orderId?: string;
  orderNumber?: string;
  clientName?: string;
  driverName?: string;
  amount?: number;
  pickupAddress?: string;
  deliveryAddress?: string;
  estimatedTime?: string;
  trackingUrl?: string;
}

// Templates d'emails en français pour le marché ivoirien
export const EMAIL_TEMPLATES = {
  ORDER_CONFIRMATION: {
    subject: 'Confirmation de commande WALI - {orderNumber}',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #3B82F6; color: white; padding: 20px; text-align: center;">
          <h1>WALI Livraison</h1>
          <h2>Confirmation de commande</h2>
        </div>
        
        <div style="padding: 20px;">
          <p>Bonjour {clientName},</p>
          
          <p>Votre commande <strong>{orderNumber}</strong> a été confirmée avec succès !</p>
          
          <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Détails de la commande</h3>
            <p><strong>Récupération :</strong> {pickupAddress}</p>
            <p><strong>Livraison :</strong> {deliveryAddress}</p>
            <p><strong>Montant :</strong> {amount} FCFA</p>
            <p><strong>Temps estimé :</strong> {estimatedTime}</p>
          </div>
          
          <p>Vous recevrez une notification dès qu'un livreur sera assigné à votre commande.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{trackingUrl}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Suivre ma commande
            </a>
          </div>
          
          <p>Merci d'avoir choisi WALI Livraison !</p>
          
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #6B7280;">
            WALI Livraison - Service de livraison rapide en Côte d'Ivoire<br>
            Pour toute question, contactez-nous au +225 XX XX XX XX XX
          </p>
        </div>
      </div>
    `,
    textBody: `
WALI Livraison - Confirmation de commande

Bonjour {clientName},

Votre commande {orderNumber} a été confirmée avec succès !

Détails :
- Récupération : {pickupAddress}
- Livraison : {deliveryAddress}
- Montant : {amount} FCFA
- Temps estimé : {estimatedTime}

Suivez votre commande : {trackingUrl}

Merci d'avoir choisi WALI Livraison !
    `,
  },

  DRIVER_ASSIGNED: {
    subject: 'Livreur assigné - {orderNumber}',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #10B981; color: white; padding: 20px; text-align: center;">
          <h1>WALI Livraison</h1>
          <h2>Livreur assigné</h2>
        </div>
        
        <div style="padding: 20px;">
          <p>Bonjour {clientName},</p>
          
          <p>Bonne nouvelle ! Un livreur a été assigné à votre commande <strong>{orderNumber}</strong>.</p>
          
          <div style="background: #ECFDF5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Votre livreur</h3>
            <p><strong>Nom :</strong> {driverName}</p>
            <p><strong>Arrivée estimée :</strong> {estimatedTime}</p>
          </div>
          
          <p>Vous pouvez maintenant suivre votre commande en temps réel et communiquer directement avec votre livreur.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{trackingUrl}" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Suivre en temps réel
            </a>
          </div>
        </div>
      </div>
    `,
    textBody: `
WALI Livraison - Livreur assigné

Bonjour {clientName},

Un livreur a été assigné à votre commande {orderNumber}.

Livreur : {driverName}
Arrivée estimée : {estimatedTime}

Suivez en temps réel : {trackingUrl}
    `,
  },

  DELIVERY_COMPLETED: {
    subject: 'Livraison terminée - {orderNumber}',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #059669; color: white; padding: 20px; text-align: center;">
          <h1>WALI Livraison</h1>
          <h2>🎉 Livraison terminée !</h2>
        </div>
        
        <div style="padding: 20px;">
          <p>Bonjour {clientName},</p>
          
          <p>Votre commande <strong>{orderNumber}</strong> a été livrée avec succès !</p>
          
          <p>Nous espérons que vous êtes satisfait de notre service. N'hésitez pas à nous faire part de vos commentaires.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px;">
              Évaluer le service
            </a>
            <a href="#" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Nouvelle commande
            </a>
          </div>
          
          <p>Merci d'avoir choisi WALI Livraison !</p>
        </div>
      </div>
    `,
    textBody: `
WALI Livraison - Livraison terminée

Bonjour {clientName},

Votre commande {orderNumber} a été livrée avec succès !

Merci d'avoir choisi WALI Livraison !
    `,
  },
};

// Templates SMS adaptés au marché ivoirien
export const SMS_TEMPLATES = {
  ORDER_CONFIRMATION: {
    message: 'WALI: Commande {orderNumber} confirmée. Montant: {amount} FCFA. Suivi: {trackingUrl}',
    maxLength: 160,
  },

  DRIVER_ASSIGNED: {
    message: 'WALI: Livreur {driverName} assigné à votre commande {orderNumber}. Arrivée: {estimatedTime}',
    maxLength: 160,
  },

  DRIVER_ARRIVED: {
    message: 'WALI: Votre livreur {driverName} est arrivé au point de récupération. Commande {orderNumber}',
    maxLength: 160,
  },

  PICKUP_COMPLETED: {
    message: 'WALI: Colis récupéré par {driverName}. Livraison en cours. Commande {orderNumber}',
    maxLength: 160,
  },

  DELIVERY_COMPLETED: {
    message: 'WALI: Livraison terminée pour la commande {orderNumber}. Merci d\'avoir choisi WALI !',
    maxLength: 160,
  },

  PAYMENT_REMINDER: {
    message: 'WALI: Paiement de {amount} FCFA requis pour la commande {orderNumber}. Payez maintenant.',
    maxLength: 160,
  },
};

class CommunicationService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  }

  /**
   * Envoie un email
   */
  async sendEmail(
    to: string,
    templateKey: keyof typeof EMAIL_TEMPLATES,
    data: CommunicationData
  ): Promise<boolean> {
    try {
      const template = EMAIL_TEMPLATES[templateKey];
      const processedTemplate = this.processEmailTemplate(template, data);

      // En mode développement, on simule l'envoi
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email simulé:', {
          to,
          subject: processedTemplate.subject,
          preview: processedTemplate.textBody.substring(0, 100) + '...',
        });
        return true;
      }

      // En production, appeler l'API d'envoi d'email
      const response = await fetch(`${this.apiBaseUrl}/communications/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject: processedTemplate.subject,
          htmlBody: processedTemplate.htmlBody,
          textBody: processedTemplate.textBody,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Erreur envoi email:', error);
      return false;
    }
  }

  /**
   * Envoie un SMS
   */
  async sendSMS(
    to: string,
    templateKey: keyof typeof SMS_TEMPLATES,
    data: CommunicationData
  ): Promise<boolean> {
    try {
      const template = SMS_TEMPLATES[templateKey];
      const message = this.processSMSTemplate(template, data);

      // Validation de la longueur
      if (message.length > template.maxLength) {
        console.warn(`SMS trop long: ${message.length}/${template.maxLength} caractères`);
        return false;
      }

      // En mode développement, on simule l'envoi
      if (process.env.NODE_ENV === 'development') {
        console.log('📱 SMS simulé:', {
          to: this.formatIvoirianPhone(to),
          message,
          length: message.length,
        });
        return true;
      }

      // En production, appeler l'API SMS (Orange SMS API, MTN, etc.)
      const response = await fetch(`${this.apiBaseUrl}/communications/sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: this.formatIvoirianPhone(to),
          message,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Erreur envoi SMS:', error);
      return false;
    }
  }

  /**
   * Envoie une notification complète (Email + SMS)
   */
  async sendOrderNotification(
    email: string,
    phone: string,
    type: 'confirmation' | 'driver_assigned' | 'delivery_completed',
    data: CommunicationData
  ): Promise<{ email: boolean; sms: boolean }> {
    const templateMap = {
      confirmation: { email: 'ORDER_CONFIRMATION', sms: 'ORDER_CONFIRMATION' },
      driver_assigned: { email: 'DRIVER_ASSIGNED', sms: 'DRIVER_ASSIGNED' },
      delivery_completed: { email: 'DELIVERY_COMPLETED', sms: 'DELIVERY_COMPLETED' },
    };

    const templates = templateMap[type];
    
    const [emailResult, smsResult] = await Promise.all([
      this.sendEmail(email, templates.email as keyof typeof EMAIL_TEMPLATES, data),
      this.sendSMS(phone, templates.sms as keyof typeof SMS_TEMPLATES, data),
    ]);

    return { email: emailResult, sms: smsResult };
  }

  /**
   * Traite un template d'email
   */
  private processEmailTemplate(template: EmailTemplate, data: CommunicationData): EmailTemplate {
    const processText = (text: string): string => {
      return Object.entries(data).reduce((result, [key, value]) => {
        const placeholder = `{${key}}`;
        return result.replace(new RegExp(placeholder, 'g'), String(value || ''));
      }, text);
    };

    return {
      subject: processText(template.subject),
      htmlBody: processText(template.htmlBody),
      textBody: processText(template.textBody),
    };
  }

  /**
   * Traite un template SMS
   */
  private processSMSTemplate(template: SMSTemplate, data: CommunicationData): string {
    return Object.entries(data).reduce((result, [key, value]) => {
      const placeholder = `{${key}}`;
      return result.replace(new RegExp(placeholder, 'g'), String(value || ''));
    }, template.message);
  }

  /**
   * Formate un numéro de téléphone ivoirien
   */
  private formatIvoirianPhone(phone: string): string {
    // Supprimer tous les caractères non numériques
    const cleaned = phone.replace(/\D/g, '');
    
    // Ajouter le préfixe +225 si nécessaire
    if (cleaned.startsWith('225')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0') && cleaned.length === 10) {
      return `+225${cleaned.substring(1)}`;
    } else if (cleaned.length === 10) {
      return `+225${cleaned}`;
    }
    
    return phone; // Retourner tel quel si format non reconnu
  }

  /**
   * Valide un email
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valide un numéro de téléphone ivoirien
   */
  isValidIvoirianPhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    return (
      cleaned.startsWith('225') && cleaned.length === 13 ||
      cleaned.startsWith('0') && cleaned.length === 10 ||
      cleaned.length === 10
    );
  }

  /**
   * Génère une URL de tracking
   */
  generateTrackingUrl(orderId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';
    return `${baseUrl}/order/${orderId}`;
  }

  /**
   * Envoie un rappel de paiement
   */
  async sendPaymentReminder(
    email: string,
    phone: string,
    data: CommunicationData
  ): Promise<{ email: boolean; sms: boolean }> {
    const [smsResult] = await Promise.all([
      this.sendSMS(phone, 'PAYMENT_REMINDER', data),
    ]);

    // Pour les rappels de paiement, on privilégie le SMS
    return { email: true, sms: smsResult };
  }
}

export const communicationService = new CommunicationService();
