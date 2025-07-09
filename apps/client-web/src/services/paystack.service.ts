import {
  PaymentProvider,
  PaymentStatus,
  PaymentRequest,
  PaymentResponse,
  PaymentMethod,
  CardType,
  generateTransactionId,
  generateMerchantReference,
  validateAmountForProvider,
  validateCardNumber,
  validateExpiryDate,
  validateCVV,
} from '@/lib/payments';

interface PaystackConfig {
  baseUrl: string;
  publicKey: string;
  secretKey: string;
  environment: 'sandbox' | 'production';
}

interface PaystackInitializeRequest {
  email: string;
  amount: number;
  currency: string;
  reference: string;
  callback_url: string;
  metadata: {
    order_id: string;
    order_number: string;
    customer_name: string;
    customer_phone: string;
  };
  channels: string[];
}

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    log: any;
    fees: number;
    fees_split: any;
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
    };
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string;
      metadata: any;
      risk_action: string;
    };
  };
}

interface PaystackChargeRequest {
  email: string;
  amount: number;
  card: {
    number: string;
    cvv: string;
    expiry_month: string;
    expiry_year: string;
  };
  pin?: string;
  metadata: {
    order_id: string;
    order_number: string;
  };
}

class PaystackService {
  private config: PaystackConfig;

  constructor() {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_PAYSTACK_BASE_URL || 'https://api.paystack.co',
      publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_your-public-key',
      secretKey: process.env.PAYSTACK_SECRET_KEY || 'sk_test_your-secret-key',
      environment: (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox') as 'sandbox' | 'production',
    };
  }

  /**
   * Initie un paiement Paystack standard (redirect)
   */
  async initiateStandardPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Validation du montant
      if (!validateAmountForProvider(request.amount, PaymentProvider.PAYSTACK)) {
        return {
          success: false,
          transactionId: '',
          status: PaymentStatus.FAILED,
          message: 'Montant invalide pour Paystack',
          error: {
            code: 'INVALID_AMOUNT',
            message: 'Le montant doit être entre 100 et 10,000,000 FCFA',
          },
        };
      }

      const transactionId = generateTransactionId();
      const reference = generateMerchantReference(request.orderId);

      // En mode développement, simuler la réponse
      if (process.env.NODE_ENV === 'development') {
        return this.simulateStandardPayment(transactionId, request);
      }

      // Préparer la requête de paiement
      const paymentRequest: PaystackInitializeRequest = {
        email: request.customerEmail || `${request.customerPhone}@wali-livraison.ci`,
        amount: request.amount * 100, // Paystack utilise les kobo/centimes
        currency: request.currency,
        reference,
        callback_url: request.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payments/paystack/callback`,
        metadata: {
          order_id: request.orderId,
          order_number: `WAL-${request.orderId}`,
          customer_name: request.customerName,
          customer_phone: request.customerPhone,
        },
        channels: ['card', 'bank', 'ussd', 'mobile_money'],
      };

      // Envoyer la requête de paiement
      const response = await fetch(`${this.config.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.secretKey}`,
        },
        body: JSON.stringify(paymentRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erreur Paystack: ${response.status} - ${errorData.message || 'Erreur inconnue'}`);
      }

      const paymentData: PaystackInitializeResponse = await response.json();

      if (!paymentData.status) {
        throw new Error(paymentData.message || 'Erreur lors de la création du paiement');
      }

      return {
        success: true,
        transactionId,
        providerTransactionId: paymentData.data.reference,
        status: PaymentStatus.PENDING,
        message: 'Paiement initié avec succès',
        paymentUrl: paymentData.data.authorization_url,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      };

    } catch (error: any) {
      console.error('Erreur lors de l\'initiation du paiement Paystack:', error);
      
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
   * Initie un paiement par carte directement
   */
  async initiateCardPayment(
    request: PaymentRequest,
    cardDetails: {
      cardNumber: string;
      cvv: string;
      expiryMonth: string;
      expiryYear: string;
      pin?: string;
    }
  ): Promise<PaymentResponse> {
    try {
      // Validation de la carte
      const cardValidation = validateCardNumber(cardDetails.cardNumber);
      if (!cardValidation.isValid) {
        return {
          success: false,
          transactionId: '',
          status: PaymentStatus.FAILED,
          message: 'Numéro de carte invalide',
          error: {
            code: 'INVALID_CARD',
            message: 'Le numéro de carte n\'est pas valide',
          },
        };
      }

      if (!validateExpiryDate(cardDetails.expiryMonth, cardDetails.expiryYear)) {
        return {
          success: false,
          transactionId: '',
          status: PaymentStatus.FAILED,
          message: 'Date d\'expiration invalide',
          error: {
            code: 'INVALID_EXPIRY',
            message: 'La date d\'expiration est invalide ou expirée',
          },
        };
      }

      if (!validateCVV(cardDetails.cvv, cardValidation.cardType!)) {
        return {
          success: false,
          transactionId: '',
          status: PaymentStatus.FAILED,
          message: 'CVV invalide',
          error: {
            code: 'INVALID_CVV',
            message: 'Le code CVV n\'est pas valide',
          },
        };
      }

      const transactionId = generateTransactionId();

      // En mode développement, simuler la réponse
      if (process.env.NODE_ENV === 'development') {
        return this.simulateCardPayment(transactionId, request, cardValidation.cardType!);
      }

      // Préparer la requête de paiement par carte
      const chargeRequest: PaystackChargeRequest = {
        email: request.customerEmail || `${request.customerPhone}@wali-livraison.ci`,
        amount: request.amount * 100, // Paystack utilise les kobo/centimes
        card: {
          number: cardDetails.cardNumber,
          cvv: cardDetails.cvv,
          expiry_month: cardDetails.expiryMonth,
          expiry_year: cardDetails.expiryYear,
        },
        pin: cardDetails.pin,
        metadata: {
          order_id: request.orderId,
          order_number: `WAL-${request.orderId}`,
        },
      };

      // Envoyer la requête de paiement par carte
      const response = await fetch(`${this.config.baseUrl}/charge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.secretKey}`,
        },
        body: JSON.stringify(chargeRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erreur Paystack: ${response.status} - ${errorData.message || 'Erreur inconnue'}`);
      }

      const paymentData = await response.json();

      return {
        success: paymentData.status,
        transactionId,
        providerTransactionId: paymentData.data?.reference || transactionId,
        status: this.mapPaystackStatusToPaymentStatus(paymentData.data?.status),
        message: paymentData.message || 'Paiement par carte initié',
        paymentUrl: paymentData.data?.display_text,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      };

    } catch (error: any) {
      console.error('Erreur lors du paiement par carte Paystack:', error);
      
      return {
        success: false,
        transactionId: generateTransactionId(),
        status: PaymentStatus.FAILED,
        message: 'Erreur lors du paiement par carte',
        error: {
          code: 'CARD_PAYMENT_FAILED',
          message: error.message || 'Erreur inconnue',
        },
      };
    }
  }

  /**
   * Vérifie le statut d'un paiement
   */
  async verifyPayment(transactionId: string, reference: string): Promise<PaymentStatus> {
    try {
      // En mode développement, simuler le statut
      if (process.env.NODE_ENV === 'development') {
        return this.simulatePaymentStatus();
      }

      const response = await fetch(`${this.config.baseUrl}/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de la vérification: ${response.status}`);
      }

      const verificationData: PaystackVerifyResponse = await response.json();
      
      if (verificationData.status) {
        return this.mapPaystackStatusToPaymentStatus(verificationData.data.status);
      }

      return PaymentStatus.FAILED;

    } catch (error) {
      console.error('Erreur lors de la vérification Paystack:', error);
      return PaymentStatus.FAILED;
    }
  }

  /**
   * Traite un webhook de Paystack
   */
  async handleWebhook(webhookData: any, signature: string): Promise<{ success: boolean; status: PaymentStatus }> {
    try {
      // Valider la signature du webhook (en production)
      if (this.config.environment === 'production') {
        const isValid = this.validateWebhookSignature(webhookData, signature);
        if (!isValid) {
          throw new Error('Signature webhook invalide');
        }
      }

      const status = this.mapPaystackStatusToPaymentStatus(webhookData.data?.status);
      
      return {
        success: true,
        status,
      };

    } catch (error) {
      console.error('Erreur lors du traitement du webhook Paystack:', error);
      return {
        success: false,
        status: PaymentStatus.FAILED,
      };
    }
  }

  /**
   * Mappe les statuts Paystack vers nos statuts
   */
  private mapPaystackStatusToPaymentStatus(paystackStatus: string): PaymentStatus {
    switch (paystackStatus?.toLowerCase()) {
      case 'success':
      case 'successful':
        return PaymentStatus.COMPLETED;
      case 'pending':
        return PaymentStatus.PENDING;
      case 'failed':
      case 'error':
        return PaymentStatus.FAILED;
      case 'abandoned':
        return PaymentStatus.CANCELLED;
      default:
        return PaymentStatus.PENDING;
    }
  }

  /**
   * Valide la signature du webhook
   */
  private validateWebhookSignature(data: any, signature: string): boolean {
    // En mode développement, toujours valide
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    // En production, implémenter la validation de signature
    // Utiliser le secret key pour valider la signature HMAC
    const crypto = require('crypto');
    const hash = crypto.createHmac('sha512', this.config.secretKey).update(JSON.stringify(data)).digest('hex');
    return hash === signature;
  }

  /**
   * Simulation pour le développement
   */
  private async simulateStandardPayment(transactionId: string, request: PaymentRequest): Promise<PaymentResponse> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const scenarios = [
      { success: true, status: PaymentStatus.PENDING, probability: 0.9 },
      { success: false, status: PaymentStatus.FAILED, probability: 0.1 },
    ];

    const random = Math.random();
    let cumulative = 0;
    
    for (const scenario of scenarios) {
      cumulative += scenario.probability;
      if (random <= cumulative) {
        if (scenario.success) {
          const mockPaymentUrl = `https://checkout.paystack.com/pay/${transactionId}`;
          return {
            success: true,
            transactionId,
            providerTransactionId: `ps_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            status: scenario.status,
            message: 'Paiement initié avec succès',
            paymentUrl: mockPaymentUrl,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
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
    const mockPaymentUrl = `https://checkout.paystack.com/pay/${transactionId}`;
    return {
      success: true,
      transactionId,
      providerTransactionId: `ps_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      status: PaymentStatus.PENDING,
      message: 'Paiement initié avec succès',
      paymentUrl: mockPaymentUrl,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  }

  /**
   * Simulation du paiement par carte
   */
  private async simulateCardPayment(transactionId: string, request: PaymentRequest, cardType: CardType): Promise<PaymentResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Taux de succès élevé pour Paystack
    const scenarios = [
      { success: true, status: PaymentStatus.COMPLETED, probability: 0.8 },
      { success: true, status: PaymentStatus.PENDING, probability: 0.15 },
      { success: false, status: PaymentStatus.FAILED, probability: 0.05 },
    ];

    const random = Math.random();
    let cumulative = 0;
    
    for (const scenario of scenarios) {
      cumulative += scenario.probability;
      if (random <= cumulative) {
        return {
          success: scenario.success,
          transactionId,
          providerTransactionId: `ps_card_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: scenario.status,
          message: scenario.success ? 'Paiement par carte traité' : 'Échec du paiement par carte',
          error: !scenario.success ? {
            code: 'CARD_DECLINED',
            message: 'Carte déclinée par la banque',
          } : undefined,
        };
      }
    }

    // Fallback
    return {
      success: true,
      transactionId,
      providerTransactionId: `ps_card_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      status: PaymentStatus.COMPLETED,
      message: 'Paiement par carte traité',
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
      name: 'Paystack',
      environment: this.config.environment,
      publicKey: this.config.publicKey,
      isConfigured: !!(this.config.secretKey && this.config.publicKey),
    };
  }
}

export const paystackService = new PaystackService();
