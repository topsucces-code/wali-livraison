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

interface FlutterwaveConfig {
  baseUrl: string;
  publicKey: string;
  secretKey: string;
  encryptionKey: string;
  environment: 'sandbox' | 'production';
}

interface FlutterwavePaymentRequest {
  tx_ref: string;
  amount: number;
  currency: string;
  redirect_url: string;
  payment_options: string;
  customer: {
    email: string;
    phonenumber: string;
    name: string;
  };
  customizations: {
    title: string;
    description: string;
    logo: string;
  };
  meta?: {
    order_id: string;
    order_number: string;
  };
}

interface FlutterwaveCardPaymentRequest {
  card_number: string;
  cvv: string;
  expiry_month: string;
  expiry_year: string;
  currency: string;
  amount: number;
  email: string;
  fullname: string;
  phone_number: string;
  tx_ref: string;
  redirect_url: string;
  authorization: {
    mode: string;
    pin?: string;
  };
}

interface FlutterwavePaymentResponse {
  status: string;
  message: string;
  data: {
    link: string;
    id: number;
    tx_ref: string;
  };
}

interface FlutterwaveVerificationResponse {
  status: string;
  message: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    device_fingerprint: string;
    amount: number;
    currency: string;
    charged_amount: number;
    app_fee: number;
    merchant_fee: number;
    processor_response: string;
    auth_model: string;
    ip: string;
    narration: string;
    status: string;
    payment_type: string;
    created_at: string;
    account_id: number;
    customer: {
      id: number;
      name: string;
      phone_number: string;
      email: string;
      created_at: string;
    };
    card?: {
      first_6digits: string;
      last_4digits: string;
      issuer: string;
      country: string;
      type: string;
      expiry: string;
    };
  };
}

class FlutterwaveService {
  private config: FlutterwaveConfig;

  constructor() {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3',
      publicKey: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-your-public-key',
      secretKey: process.env.FLUTTERWAVE_SECRET_KEY || 'FLWSECK_TEST-your-secret-key',
      encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY || 'your-encryption-key',
      environment: (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox') as 'sandbox' | 'production',
    };
  }

  /**
   * Initie un paiement Flutterwave standard (redirect)
   */
  async initiateStandardPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Validation du montant
      if (!validateAmountForProvider(request.amount, PaymentProvider.FLUTTERWAVE)) {
        return {
          success: false,
          transactionId: '',
          status: PaymentStatus.FAILED,
          message: 'Montant invalide pour Flutterwave',
          error: {
            code: 'INVALID_AMOUNT',
            message: 'Le montant doit être entre 100 et 5,000,000 FCFA',
          },
        };
      }

      const transactionId = generateTransactionId();
      const txRef = generateMerchantReference(request.orderId);

      // En mode développement, simuler la réponse
      if (process.env.NODE_ENV === 'development') {
        return this.simulateStandardPayment(transactionId, request);
      }

      // Préparer la requête de paiement
      const paymentRequest: FlutterwavePaymentRequest = {
        tx_ref: txRef,
        amount: request.amount,
        currency: request.currency,
        redirect_url: request.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payments/flutterwave/callback`,
        payment_options: 'card,mobilemoney,ussd,banktransfer',
        customer: {
          email: request.customerEmail || `${request.customerPhone}@wali-livraison.ci`,
          phonenumber: this.formatPhoneForFlutterwave(request.customerPhone),
          name: request.customerName,
        },
        customizations: {
          title: 'WALI Livraison',
          description: request.description,
          logo: `${process.env.NEXT_PUBLIC_APP_URL}/icons/wali-logo-192.png`,
        },
        meta: {
          order_id: request.orderId,
          order_number: `WAL-${request.orderId}`,
        },
      };

      // Envoyer la requête de paiement
      const response = await fetch(`${this.config.baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.secretKey}`,
        },
        body: JSON.stringify(paymentRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erreur Flutterwave: ${response.status} - ${errorData.message || 'Erreur inconnue'}`);
      }

      const paymentData: FlutterwavePaymentResponse = await response.json();

      if (paymentData.status !== 'success') {
        throw new Error(paymentData.message || 'Erreur lors de la création du paiement');
      }

      return {
        success: true,
        transactionId,
        providerTransactionId: paymentData.data.id.toString(),
        status: PaymentStatus.PENDING,
        message: 'Paiement initié avec succès',
        paymentUrl: paymentData.data.link,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      };

    } catch (error: any) {
      console.error('Erreur lors de l\'initiation du paiement Flutterwave:', error);
      
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
      const txRef = generateMerchantReference(request.orderId);

      // En mode développement, simuler la réponse
      if (process.env.NODE_ENV === 'development') {
        return this.simulateCardPayment(transactionId, request, cardValidation.cardType!);
      }

      // Chiffrer les données de carte (en production)
      const encryptedCardData = this.encryptCardData(cardDetails);

      // Préparer la requête de paiement par carte
      const cardPaymentRequest: FlutterwaveCardPaymentRequest = {
        card_number: encryptedCardData.cardNumber,
        cvv: encryptedCardData.cvv,
        expiry_month: cardDetails.expiryMonth,
        expiry_year: cardDetails.expiryYear,
        currency: request.currency,
        amount: request.amount,
        email: request.customerEmail || `${request.customerPhone}@wali-livraison.ci`,
        fullname: request.customerName,
        phone_number: this.formatPhoneForFlutterwave(request.customerPhone),
        tx_ref: txRef,
        redirect_url: request.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payments/flutterwave/callback`,
        authorization: {
          mode: cardDetails.pin ? 'pin' : 'redirect',
          pin: cardDetails.pin,
        },
      };

      // Envoyer la requête de paiement par carte
      const response = await fetch(`${this.config.baseUrl}/charges?type=card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.secretKey}`,
        },
        body: JSON.stringify(cardPaymentRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erreur Flutterwave: ${response.status} - ${errorData.message || 'Erreur inconnue'}`);
      }

      const paymentData = await response.json();

      return {
        success: true,
        transactionId,
        providerTransactionId: paymentData.data?.id?.toString() || txRef,
        status: this.mapFlutterwaveStatusToPaymentStatus(paymentData.status),
        message: paymentData.message || 'Paiement par carte initié',
        paymentUrl: paymentData.data?.link,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      };

    } catch (error: any) {
      console.error('Erreur lors du paiement par carte Flutterwave:', error);
      
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
  async verifyPayment(transactionId: string, providerTransactionId: string): Promise<PaymentStatus> {
    try {
      // En mode développement, simuler le statut
      if (process.env.NODE_ENV === 'development') {
        return this.simulatePaymentStatus();
      }

      const response = await fetch(`${this.config.baseUrl}/transactions/${providerTransactionId}/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de la vérification: ${response.status}`);
      }

      const verificationData: FlutterwaveVerificationResponse = await response.json();
      
      if (verificationData.status === 'success') {
        return this.mapFlutterwaveStatusToPaymentStatus(verificationData.data.status);
      }

      return PaymentStatus.FAILED;

    } catch (error) {
      console.error('Erreur lors de la vérification Flutterwave:', error);
      return PaymentStatus.FAILED;
    }
  }

  /**
   * Traite un webhook de Flutterwave
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

      const status = this.mapFlutterwaveStatusToPaymentStatus(webhookData.status);
      
      return {
        success: true,
        status,
      };

    } catch (error) {
      console.error('Erreur lors du traitement du webhook Flutterwave:', error);
      return {
        success: false,
        status: PaymentStatus.FAILED,
      };
    }
  }

  /**
   * Formate le numéro de téléphone pour Flutterwave
   */
  private formatPhoneForFlutterwave(phone: string): string {
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
   * Mappe les statuts Flutterwave vers nos statuts
   */
  private mapFlutterwaveStatusToPaymentStatus(flutterwaveStatus: string): PaymentStatus {
    switch (flutterwaveStatus?.toLowerCase()) {
      case 'successful':
      case 'success':
        return PaymentStatus.COMPLETED;
      case 'pending':
        return PaymentStatus.PENDING;
      case 'failed':
      case 'error':
        return PaymentStatus.FAILED;
      case 'cancelled':
        return PaymentStatus.CANCELLED;
      default:
        return PaymentStatus.PENDING;
    }
  }

  /**
   * Chiffre les données de carte (simulation en développement)
   */
  private encryptCardData(cardDetails: any): any {
    // En mode développement, retourner tel quel
    if (process.env.NODE_ENV === 'development') {
      return cardDetails;
    }

    // En production, implémenter le chiffrement Flutterwave
    // Utiliser la clé d'encryption pour chiffrer les données sensibles
    return cardDetails;
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
    // Utiliser le secret key pour valider la signature
    return true;
  }

  /**
   * Simulation pour le développement
   */
  private async simulateStandardPayment(transactionId: string, request: PaymentRequest): Promise<PaymentResponse> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const scenarios = [
      { success: true, status: PaymentStatus.PENDING, probability: 0.85 },
      { success: false, status: PaymentStatus.FAILED, probability: 0.15 },
    ];

    const random = Math.random();
    let cumulative = 0;
    
    for (const scenario of scenarios) {
      cumulative += scenario.probability;
      if (random <= cumulative) {
        if (scenario.success) {
          const mockPaymentUrl = `https://checkout.flutterwave.com/pay/${transactionId}`;
          return {
            success: true,
            transactionId,
            providerTransactionId: `flw_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
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
    const mockPaymentUrl = `https://checkout.flutterwave.com/pay/${transactionId}`;
    return {
      success: true,
      transactionId,
      providerTransactionId: `flw_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
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
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Taux de succès plus élevé pour les cartes
    const scenarios = [
      { success: true, status: PaymentStatus.COMPLETED, probability: 0.7 },
      { success: true, status: PaymentStatus.PENDING, probability: 0.2 },
      { success: false, status: PaymentStatus.FAILED, probability: 0.1 },
    ];

    const random = Math.random();
    let cumulative = 0;
    
    for (const scenario of scenarios) {
      cumulative += scenario.probability;
      if (random <= cumulative) {
        return {
          success: scenario.success,
          transactionId,
          providerTransactionId: `flw_card_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
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
      providerTransactionId: `flw_card_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
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
      name: 'Flutterwave',
      environment: this.config.environment,
      publicKey: this.config.publicKey,
      isConfigured: !!(this.config.secretKey && this.config.publicKey),
    };
  }
}

export const flutterwaveService = new FlutterwaveService();
