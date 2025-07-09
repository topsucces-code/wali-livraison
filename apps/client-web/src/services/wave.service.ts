import {
  PaymentProvider,
  PaymentStatus,
  PaymentRequest,
  PaymentResponse,
  generateTransactionId,
  generateMerchantReference,
  validateAmountForProvider,
} from '@/lib/payments';

interface WaveConfig {
  baseUrl: string;
  apiKey: string;
  merchantId: string;
  environment: 'sandbox' | 'production';
}

interface WavePaymentRequest {
  amount: number;
  currency: string;
  merchant_reference: string;
  customer_phone: string;
  customer_name: string;
  description: string;
  callback_url?: string;
  return_url?: string;
}

interface WavePaymentResponse {
  id: string;
  status: string;
  payment_url: string;
  qr_code: string;
  wave_launch_url: string;
  checkout_session_id: string;
}

interface WaveStatusResponse {
  id: string;
  status: string;
  amount: number;
  currency: string;
  merchant_reference: string;
  wave_transaction_id?: string;
  created_at: string;
  updated_at: string;
}

class WaveService {
  private config: WaveConfig;

  constructor() {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_WAVE_BASE_URL || 'https://api.wave.com/v1',
      apiKey: process.env.WAVE_API_KEY || 'your_wave_api_key',
      merchantId: process.env.WAVE_MERCHANT_ID || 'your_merchant_id',
      environment: (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox') as 'sandbox' | 'production',
    };
  }

  /**
   * Initie un paiement Wave
   */
  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Validation du montant
      if (!validateAmountForProvider(request.amount, PaymentProvider.WAVE)) {
        return {
          success: false,
          transactionId: '',
          status: PaymentStatus.FAILED,
          message: 'Montant invalide pour Wave',
          error: {
            code: 'INVALID_AMOUNT',
            message: 'Le montant doit être entre 50 et 2,000,000 FCFA',
          },
        };
      }

      const transactionId = generateTransactionId();
      const merchantReference = generateMerchantReference(request.orderId);

      // En mode développement, simuler la réponse
      if (process.env.NODE_ENV === 'development') {
        return this.simulatePayment(transactionId, request);
      }

      // Préparer la requête de paiement
      const paymentRequest: WavePaymentRequest = {
        amount: request.amount,
        currency: 'XOF',
        merchant_reference: merchantReference,
        customer_phone: this.formatPhoneForWave(request.customerPhone),
        customer_name: request.customerName,
        description: request.description,
        callback_url: request.callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/wave/callback`,
        return_url: request.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/order/${request.orderId}`,
      };

      // Envoyer la requête de paiement
      const response = await fetch(`${this.config.baseUrl}/checkout/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Merchant-Id': this.config.merchantId,
        },
        body: JSON.stringify(paymentRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erreur Wave: ${response.status} - ${errorData.message || 'Erreur inconnue'}`);
      }

      const paymentData: WavePaymentResponse = await response.json();

      return {
        success: true,
        transactionId,
        providerTransactionId: paymentData.id,
        status: this.mapWaveStatusToPaymentStatus(paymentData.status),
        message: 'Session de paiement créée avec succès',
        paymentUrl: paymentData.payment_url,
        qrCode: paymentData.qr_code,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      };

    } catch (error: any) {
      console.error('Erreur lors de l\'initiation du paiement Wave:', error);
      
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

      const response = await fetch(`${this.config.baseUrl}/checkout/sessions/${providerTransactionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Merchant-Id': this.config.merchantId,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de la vérification du statut: ${response.status}`);
      }

      const statusData: WaveStatusResponse = await response.json();
      return this.mapWaveStatusToPaymentStatus(statusData.status);

    } catch (error) {
      console.error('Erreur lors de la vérification du statut Wave:', error);
      return PaymentStatus.FAILED;
    }
  }

  /**
   * Traite un callback webhook de Wave
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

      const status = this.mapWaveStatusToPaymentStatus(callbackData.status);
      
      return {
        success: true,
        status,
      };

    } catch (error) {
      console.error('Erreur lors du traitement du callback Wave:', error);
      return {
        success: false,
        status: PaymentStatus.FAILED,
      };
    }
  }

  /**
   * Annule un paiement en cours
   */
  async cancelPayment(providerTransactionId: string): Promise<boolean> {
    try {
      // En mode développement, simuler l'annulation
      if (process.env.NODE_ENV === 'development') {
        return true;
      }

      const response = await fetch(`${this.config.baseUrl}/checkout/sessions/${providerTransactionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Merchant-Id': this.config.merchantId,
        },
      });

      return response.ok;

    } catch (error) {
      console.error('Erreur lors de l\'annulation du paiement Wave:', error);
      return false;
    }
  }

  /**
   * Formate le numéro de téléphone pour Wave
   */
  private formatPhoneForWave(phone: string): string {
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
   * Mappe les statuts Wave vers nos statuts
   */
  private mapWaveStatusToPaymentStatus(waveStatus: string): PaymentStatus {
    switch (waveStatus?.toLowerCase()) {
      case 'pending':
      case 'created':
        return PaymentStatus.PENDING;
      case 'processing':
      case 'in_progress':
        return PaymentStatus.PROCESSING;
      case 'completed':
      case 'success':
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
   * Génère un QR code pour le paiement
   */
  generateQRCode(paymentUrl: string): string {
    // En production, utiliser une vraie API de génération de QR code
    // Pour le développement, retourner une URL de QR code simulée
    const qrData = encodeURIComponent(paymentUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;
  }

  /**
   * Simulation pour le développement
   */
  private async simulatePayment(transactionId: string, request: PaymentRequest): Promise<PaymentResponse> {
    // Simuler un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 500));

    // Wave a généralement un taux de succès élevé
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
          const mockPaymentUrl = `https://checkout.wave.com/session/${transactionId}`;
          return {
            success: true,
            transactionId,
            providerTransactionId: `wave_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            status: scenario.status,
            message: 'Session de paiement créée avec succès',
            paymentUrl: mockPaymentUrl,
            qrCode: this.generateQRCode(mockPaymentUrl),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          };
        } else {
          return {
            success: false,
            transactionId,
            status: scenario.status,
            message: 'Échec de la création de session',
            error: {
              code: 'SIMULATION_FAILED',
              message: 'Échec simulé pour les tests',
            },
          };
        }
      }
    }

    // Fallback
    const mockPaymentUrl = `https://checkout.wave.com/session/${transactionId}`;
    return {
      success: true,
      transactionId,
      providerTransactionId: `wave_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      status: PaymentStatus.PENDING,
      message: 'Session de paiement créée avec succès',
      paymentUrl: mockPaymentUrl,
      qrCode: this.generateQRCode(mockPaymentUrl),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
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
      name: 'Wave',
      environment: this.config.environment,
      merchantId: this.config.merchantId,
      isConfigured: !!(this.config.apiKey && this.config.merchantId),
    };
  }
}

export const waveService = new WaveService();
