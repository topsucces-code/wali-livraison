import {
  PaymentProvider,
  PaymentStatus,
  PaymentRequest,
  PaymentResponse,
  generateTransactionId,
  generateMerchantReference,
  validatePhoneForProvider,
  validateAmountForProvider,
} from '@/lib/payments';

interface MTNMoMoConfig {
  baseUrl: string;
  subscriptionKey: string;
  userId: string;
  apiKey: string;
  environment: 'sandbox' | 'production';
  targetEnvironment: string;
}

interface MTNTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface MTNPaymentRequest {
  amount: string;
  currency: string;
  externalId: string;
  payer: {
    partyIdType: string;
    partyId: string;
  };
  payerMessage: string;
  payeeNote: string;
}

interface MTNPaymentResponse {
  status: string;
  reason?: string;
}

class MTNMoMoService {
  private config: MTNMoMoConfig;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_MTN_MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com',
      subscriptionKey: process.env.MTN_MOMO_SUBSCRIPTION_KEY || 'your_subscription_key',
      userId: process.env.MTN_MOMO_USER_ID || 'your_user_id',
      apiKey: process.env.MTN_MOMO_API_KEY || 'your_api_key',
      environment: (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox') as 'sandbox' | 'production',
      targetEnvironment: process.env.MTN_MOMO_TARGET_ENVIRONMENT || 'sandbox',
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
        this.accessToken = 'mock_mtn_momo_token_' + Date.now();
        this.tokenExpiresAt = Date.now() + (3600 * 1000); // 1 heure
        return this.accessToken;
      }

      const response = await fetch(`${this.config.baseUrl}/collection/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
          'Authorization': `Basic ${btoa(`${this.config.userId}:${this.config.apiKey}`)}`,
          'X-Target-Environment': this.config.targetEnvironment,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur d'authentification MTN MoMo: ${response.status}`);
      }

      const tokenData: MTNTokenResponse = await response.json();
      
      this.accessToken = tokenData.access_token;
      this.tokenExpiresAt = Date.now() + (tokenData.expires_in * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('Erreur lors de l\'obtention du token MTN MoMo:', error);
      throw new Error('Impossible de s\'authentifier avec MTN Mobile Money');
    }
  }

  /**
   * Initie un paiement MTN Mobile Money
   */
  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Validation des données
      if (!validatePhoneForProvider(request.customerPhone, PaymentProvider.MTN_MOMO)) {
        return {
          success: false,
          transactionId: '',
          status: PaymentStatus.FAILED,
          message: 'Numéro de téléphone invalide pour MTN Mobile Money',
          error: {
            code: 'INVALID_PHONE',
            message: 'Le numéro doit être un numéro MTN (05, 06)',
          },
        };
      }

      if (!validateAmountForProvider(request.amount, PaymentProvider.MTN_MOMO)) {
        return {
          success: false,
          transactionId: '',
          status: PaymentStatus.FAILED,
          message: 'Montant invalide pour MTN Mobile Money',
          error: {
            code: 'INVALID_AMOUNT',
            message: 'Le montant doit être entre 100 et 500,000 FCFA',
          },
        };
      }

      const transactionId = generateTransactionId();
      const externalId = generateMerchantReference(request.orderId);

      // En mode développement, simuler la réponse
      if (process.env.NODE_ENV === 'development') {
        return this.simulatePayment(transactionId, request);
      }

      // Obtenir le token d'accès
      const accessToken = await this.getAccessToken();

      // Préparer la requête de paiement
      const paymentRequest: MTNPaymentRequest = {
        amount: request.amount.toString(),
        currency: 'EUR', // MTN utilise EUR pour XOF en sandbox
        externalId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: this.formatPhoneForMTN(request.customerPhone),
        },
        payerMessage: `Paiement WALI Livraison - ${request.description}`,
        payeeNote: `Commande ${request.orderId}`,
      };

      // Générer un UUID pour la requête
      const requestId = this.generateUUID();

      // Envoyer la requête de paiement
      const response = await fetch(`${this.config.baseUrl}/collection/v1_0/requesttopay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Reference-Id': requestId,
          'X-Target-Environment': this.config.targetEnvironment,
          'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
        },
        body: JSON.stringify(paymentRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erreur MTN MoMo: ${response.status} - ${errorData.message || 'Erreur inconnue'}`);
      }

      // MTN MoMo retourne 202 Accepted pour une requête réussie
      if (response.status === 202) {
        return {
          success: true,
          transactionId,
          providerTransactionId: requestId,
          status: PaymentStatus.PENDING,
          message: 'Demande de paiement envoyée avec succès',
          ussdCode: '*133#',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
        };
      }

      throw new Error('Réponse inattendue de MTN MoMo');

    } catch (error: any) {
      console.error('Erreur lors de l\'initiation du paiement MTN MoMo:', error);
      
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

      const response = await fetch(`${this.config.baseUrl}/collection/v1_0/requesttopay/${providerTransactionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Target-Environment': this.config.targetEnvironment,
          'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de la vérification du statut: ${response.status}`);
      }

      const statusData = await response.json();
      return this.mapMTNStatusToPaymentStatus(statusData.status);

    } catch (error) {
      console.error('Erreur lors de la vérification du statut MTN MoMo:', error);
      return PaymentStatus.FAILED;
    }
  }

  /**
   * Formate le numéro de téléphone pour MTN MoMo
   */
  private formatPhoneForMTN(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('225')) {
      return cleaned.substring(3); // MTN veut juste les 10 chiffres
    } else if (cleaned.startsWith('0')) {
      return cleaned.substring(1);
    } else if (cleaned.length === 10) {
      return cleaned;
    }
    
    return phone;
  }

  /**
   * Mappe les statuts MTN vers nos statuts
   */
  private mapMTNStatusToPaymentStatus(mtnStatus: string): PaymentStatus {
    switch (mtnStatus?.toLowerCase()) {
      case 'pending':
        return PaymentStatus.PENDING;
      case 'successful':
        return PaymentStatus.COMPLETED;
      case 'failed':
        return PaymentStatus.FAILED;
      case 'timeout':
        return PaymentStatus.EXPIRED;
      default:
        return PaymentStatus.PENDING;
    }
  }

  /**
   * Génère un UUID v4
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Simulation pour le développement
   */
  private async simulatePayment(transactionId: string, request: PaymentRequest): Promise<PaymentResponse> {
    // Simuler un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 800));

    // Simuler différents scénarios
    const scenarios = [
      { success: true, status: PaymentStatus.PENDING, probability: 0.8 },
      { success: false, status: PaymentStatus.FAILED, probability: 0.2 },
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
            providerTransactionId: this.generateUUID(),
            status: scenario.status,
            message: 'Demande de paiement envoyée avec succès',
            ussdCode: '*133#',
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
      providerTransactionId: this.generateUUID(),
      status: PaymentStatus.PENDING,
      message: 'Demande de paiement envoyée avec succès',
      ussdCode: '*133#',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  /**
   * Simulation du statut de paiement
   */
  private simulatePaymentStatus(): PaymentStatus {
    const statuses = [
      PaymentStatus.PENDING,
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
      name: 'MTN Mobile Money',
      environment: this.config.environment,
      userId: this.config.userId,
      isConfigured: !!(this.config.subscriptionKey && this.config.apiKey),
    };
  }
}

export const mtnMoMoService = new MTNMoMoService();
