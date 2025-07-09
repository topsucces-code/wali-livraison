import {
  PaymentProvider,
  PaymentStatus,
  PaymentRequest,
  PaymentResponse,
  PaymentTransaction,
  generateTransactionId,
  generateMerchantReference,
  validatePhoneForProvider,
  validateAmountForProvider,
} from '@/lib/payments';

interface OrangeMoneyConfig {
  baseUrl: string;
  merchantId: string;
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
}

interface OrangeMoneyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface OrangeMoneyPaymentRequest {
  merchant: {
    id: string;
  };
  customer: {
    msisdn: string;
    name: string;
  };
  transaction: {
    amount: number;
    currency: string;
    reference: string;
    description: string;
  };
  callback: {
    url: string;
    method: string;
  };
}

interface OrangeMoneyPaymentResponse {
  transaction_id: string;
  status: string;
  message: string;
  payment_url?: string;
  ussd_code?: string;
}

class OrangeMoneyService {
  private config: OrangeMoneyConfig;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_ORANGE_MONEY_BASE_URL || 'https://api.orange.com/orange-money-webpay/dev/v1',
      merchantId: process.env.ORANGE_MONEY_MERCHANT_ID || 'WALI_MERCHANT_ID',
      clientId: process.env.ORANGE_MONEY_CLIENT_ID || 'your_client_id',
      clientSecret: process.env.ORANGE_MONEY_CLIENT_SECRET || 'your_client_secret',
      environment: (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox') as 'sandbox' | 'production',
    };
  }

  /**
   * Obtient un token d'accès OAuth2
   */
  private async getAccessToken(): Promise<string> {
    // Vérifier si le token actuel est encore valide
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    try {
      // En mode développement, simuler le token
      if (process.env.NODE_ENV === 'development') {
        this.accessToken = 'mock_orange_money_token_' + Date.now();
        this.tokenExpiresAt = Date.now() + (3600 * 1000); // 1 heure
        return this.accessToken;
      }

      const response = await fetch(`${this.config.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${this.config.clientId}:${this.config.clientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur d'authentification Orange Money: ${response.status}`);
      }

      const tokenData: OrangeMoneyTokenResponse = await response.json();
      
      this.accessToken = tokenData.access_token;
      this.tokenExpiresAt = Date.now() + (tokenData.expires_in * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('Erreur lors de l\'obtention du token Orange Money:', error);
      throw new Error('Impossible de s\'authentifier avec Orange Money');
    }
  }

  /**
   * Initie un paiement Orange Money
   */
  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Validation des données
      if (!validatePhoneForProvider(request.customerPhone, PaymentProvider.ORANGE_MONEY)) {
        return {
          success: false,
          transactionId: '',
          status: PaymentStatus.FAILED,
          message: 'Numéro de téléphone invalide pour Orange Money',
          error: {
            code: 'INVALID_PHONE',
            message: 'Le numéro doit être un numéro Orange (07, 08, 09)',
          },
        };
      }

      if (!validateAmountForProvider(request.amount, PaymentProvider.ORANGE_MONEY)) {
        return {
          success: false,
          transactionId: '',
          status: PaymentStatus.FAILED,
          message: 'Montant invalide pour Orange Money',
          error: {
            code: 'INVALID_AMOUNT',
            message: 'Le montant doit être entre 100 et 1,000,000 FCFA',
          },
        };
      }

      const transactionId = generateTransactionId();
      const merchantReference = generateMerchantReference(request.orderId);

      // En mode développement, simuler la réponse
      if (process.env.NODE_ENV === 'development') {
        return this.simulatePayment(transactionId, request);
      }

      // Obtenir le token d'accès
      const accessToken = await this.getAccessToken();

      // Préparer la requête de paiement
      const paymentRequest: OrangeMoneyPaymentRequest = {
        merchant: {
          id: this.config.merchantId,
        },
        customer: {
          msisdn: this.formatPhoneForOrange(request.customerPhone),
          name: request.customerName,
        },
        transaction: {
          amount: request.amount,
          currency: 'XOF',
          reference: merchantReference,
          description: request.description,
        },
        callback: {
          url: request.callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/orange-money/callback`,
          method: 'POST',
        },
      };

      // Envoyer la requête de paiement
      const response = await fetch(`${this.config.baseUrl}/webpayment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Callback-URL': paymentRequest.callback.url,
        },
        body: JSON.stringify(paymentRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erreur Orange Money: ${response.status} - ${errorData.message || 'Erreur inconnue'}`);
      }

      const paymentData: OrangeMoneyPaymentResponse = await response.json();

      return {
        success: true,
        transactionId,
        providerTransactionId: paymentData.transaction_id,
        status: this.mapOrangeStatusToPaymentStatus(paymentData.status),
        message: paymentData.message,
        paymentUrl: paymentData.payment_url,
        ussdCode: paymentData.ussd_code,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      };

    } catch (error: any) {
      console.error('Erreur lors de l\'initiation du paiement Orange Money:', error);
      
      return {
        success: false,
        transactionId: generateTransactionId(),
        status: PaymentStatus.FAILED,
        message: 'Erreur lors de l\'initiation du paiement',
        error: {
          code: 'PAYMENT_INITIATION_FAILED',
          message: error.message || 'Erreur inconnue',
        },
      };
    }
  }

  /**
   * Vérifie le statut d'un paiement
   */
  async checkPaymentStatus(transactionId: string, providerTransactionId: string): Promise<PaymentStatus> {
    try {
      // En mode développement, simuler le statut
      if (process.env.NODE_ENV === 'development') {
        return this.simulatePaymentStatus();
      }

      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.config.baseUrl}/webpayment/${providerTransactionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de la vérification du statut: ${response.status}`);
      }

      const statusData = await response.json();
      return this.mapOrangeStatusToPaymentStatus(statusData.status);

    } catch (error) {
      console.error('Erreur lors de la vérification du statut Orange Money:', error);
      return PaymentStatus.FAILED;
    }
  }

  /**
   * Traite un callback webhook d'Orange Money
   */
  async handleCallback(callbackData: any): Promise<{ success: boolean; status: PaymentStatus }> {
    try {
      // Valider la signature du webhook (en production)
      if (this.config.environment === 'production') {
        // Implémenter la validation de signature
        // const isValid = this.validateWebhookSignature(callbackData);
        // if (!isValid) {
        //   throw new Error('Signature webhook invalide');
        // }
      }

      const status = this.mapOrangeStatusToPaymentStatus(callbackData.status);
      
      return {
        success: true,
        status,
      };

    } catch (error) {
      console.error('Erreur lors du traitement du callback Orange Money:', error);
      return {
        success: false,
        status: PaymentStatus.FAILED,
      };
    }
  }

  /**
   * Formate le numéro de téléphone pour Orange Money
   */
  private formatPhoneForOrange(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('225')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      return `+225${cleaned.substring(1)}`;
    } else if (cleaned.length === 10) {
      return `+225${cleaned}`;
    }
    
    return phone;
  }

  /**
   * Mappe les statuts Orange Money vers nos statuts
   */
  private mapOrangeStatusToPaymentStatus(orangeStatus: string): PaymentStatus {
    switch (orangeStatus?.toLowerCase()) {
      case 'pending':
      case 'initiated':
        return PaymentStatus.PENDING;
      case 'processing':
      case 'in_progress':
        return PaymentStatus.PROCESSING;
      case 'success':
      case 'completed':
      case 'successful':
        return PaymentStatus.COMPLETED;
      case 'failed':
      case 'error':
        return PaymentStatus.FAILED;
      case 'cancelled':
      case 'canceled':
        return PaymentStatus.CANCELLED;
      case 'expired':
        return PaymentStatus.EXPIRED;
      default:
        return PaymentStatus.PENDING;
    }
  }

  /**
   * Simulation pour le développement
   */
  private async simulatePayment(transactionId: string, request: PaymentRequest): Promise<PaymentResponse> {
    // Simuler un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simuler différents scénarios
    const scenarios = [
      { success: true, status: PaymentStatus.PENDING, probability: 0.7 },
      { success: false, status: PaymentStatus.FAILED, probability: 0.2 },
      { success: true, status: PaymentStatus.PROCESSING, probability: 0.1 },
    ];

    const random = Math.random();
    let cumulative = 0;
    
    for (const scenario of scenarios) {
      cumulative += scenario.probability;
      if (random <= cumulative) {
        if (scenario.success) {
          return {
            success: true,
            transactionId,
            providerTransactionId: `OM_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            status: scenario.status,
            message: 'Paiement initié avec succès',
            ussdCode: '#144#',
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          };
        } else {
          return {
            success: false,
            transactionId,
            status: scenario.status,
            message: 'Échec de l\'initiation du paiement',
            error: {
              code: 'SIMULATION_FAILED',
              message: 'Échec simulé pour les tests',
            },
          };
        }
      }
    }

    // Fallback
    return {
      success: true,
      transactionId,
      providerTransactionId: `OM_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      status: PaymentStatus.PENDING,
      message: 'Paiement initié avec succès',
      ussdCode: '#144#',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  /**
   * Simulation du statut de paiement
   */
  private simulatePaymentStatus(): PaymentStatus {
    const statuses = [
      PaymentStatus.PENDING,
      PaymentStatus.PROCESSING,
      PaymentStatus.COMPLETED,
      PaymentStatus.FAILED,
    ];
    
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  /**
   * Obtient les informations de configuration
   */
  getProviderInfo() {
    return {
      name: 'Orange Money',
      environment: this.config.environment,
      merchantId: this.config.merchantId,
      isConfigured: !!(this.config.clientId && this.config.clientSecret),
    };
  }
}

export const orangeMoneyService = new OrangeMoneyService();
