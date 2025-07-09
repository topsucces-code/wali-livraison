import {
  PaymentProvider,
  PaymentStatus,
  PaymentRequest,
  PaymentResponse,
  PaymentTransaction,
  WaliPaymentMethod,
  generateTransactionId,
  detectProviderFromPhone,
  PAYMENT_PROVIDERS,
} from '@/lib/payments';
import { orangeMoneyService } from './orange-money.service';
import { mtnMoMoService } from './mtn-momo.service';
import { waveService } from './wave.service';
import { flutterwaveService } from './flutterwave.service';
import { paystackService } from './paystack.service';
import { notificationService } from './notification.service';
import { NotificationType } from '@/lib/notifications';

interface PaymentServiceEvents {
  'payment:initiated': (transaction: PaymentTransaction) => void;
  'payment:completed': (transaction: PaymentTransaction) => void;
  'payment:failed': (transaction: PaymentTransaction) => void;
  'payment:cancelled': (transaction: PaymentTransaction) => void;
}

class PaymentService {
  private transactions: Map<string, PaymentTransaction> = new Map();
  private paymentMethods: Map<string, WaliPaymentMethod[]> = new Map();
  private eventListeners: Map<keyof PaymentServiceEvents, Function[]> = new Map();
  private statusCheckIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeMockData();
  }

  /**
   * Initie un paiement avec le provider approprié
   */
  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Récupérer la méthode de paiement
      const paymentMethod = await this.getPaymentMethod(request.paymentMethodId);
      if (!paymentMethod) {
        throw new Error('Méthode de paiement non trouvée');
      }

      // Créer la transaction
      const transaction: PaymentTransaction = {
        id: generateTransactionId(),
        orderId: request.orderId,
        orderNumber: `WAL-${request.orderId}`,
        userId: 'current_user_id', // À récupérer du contexte
        paymentMethodId: request.paymentMethodId,
        provider: paymentMethod.provider,
        type: 'ORDER_PAYMENT',
        amount: request.amount,
        currency: request.currency,
        status: PaymentStatus.PENDING,
        description: request.description,
        metadata: {
          phoneNumber: request.customerPhone,
          customerName: request.customerName,
          callbackUrl: request.callbackUrl,
          returnUrl: request.returnUrl,
        },
        initiatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      };

      // Sauvegarder la transaction
      this.transactions.set(transaction.id, transaction);

      // Initier le paiement selon le provider
      let response: PaymentResponse;

      switch (paymentMethod.provider) {
        case PaymentProvider.ORANGE_MONEY:
          response = await orangeMoneyService.initiatePayment(request);
          break;
        case PaymentProvider.MTN_MOMO:
          response = await mtnMoMoService.initiatePayment(request);
          break;
        case PaymentProvider.WAVE:
          response = await waveService.initiatePayment(request);
          break;
        case PaymentProvider.FLUTTERWAVE:
          response = await flutterwaveService.initiateStandardPayment(request);
          break;
        case PaymentProvider.PAYSTACK:
          response = await paystackService.initiateStandardPayment(request);
          break;
        case PaymentProvider.CASH:
          response = this.handleCashPayment(request);
          break;
        default:
          throw new Error(`Provider non supporté: ${paymentMethod.provider}`);
      }

      // Mettre à jour la transaction avec la réponse
      transaction.status = response.status;
      transaction.providerTransactionId = response.providerTransactionId;
      transaction.providerData = {
        paymentUrl: response.paymentUrl,
        qrCode: response.qrCode,
        ussdCode: response.ussdCode,
      };

      if (!response.success) {
        transaction.errorCode = response.error?.code;
        transaction.errorMessage = response.error?.message;
      }

      this.transactions.set(transaction.id, transaction);

      // Émettre l'événement
      this.emit('payment:initiated', transaction);

      // Envoyer une notification
      await this.sendPaymentNotification(transaction, 'initiated');

      // Démarrer le suivi du statut pour les paiements non-cash
      if (paymentMethod.provider !== PaymentProvider.CASH && response.success) {
        this.startStatusTracking(transaction);
      }

      return {
        ...response,
        transactionId: transaction.id,
      };

    } catch (error: any) {
      console.error('Erreur lors de l\'initiation du paiement:', error);
      
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
  async checkPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new Error('Transaction non trouvée');
    }

    if (!transaction.providerTransactionId) {
      return transaction.status;
    }

    try {
      let status: PaymentStatus;

      switch (transaction.provider) {
        case PaymentProvider.ORANGE_MONEY:
          status = await orangeMoneyService.checkPaymentStatus(transactionId, transaction.providerTransactionId);
          break;
        case PaymentProvider.MTN_MOMO:
          status = await mtnMoMoService.checkPaymentStatus(transactionId, transaction.providerTransactionId);
          break;
        case PaymentProvider.WAVE:
          status = await waveService.checkPaymentStatus(transactionId, transaction.providerTransactionId);
          break;
        case PaymentProvider.FLUTTERWAVE:
          status = await flutterwaveService.verifyPayment(transactionId, transaction.providerTransactionId);
          break;
        case PaymentProvider.PAYSTACK:
          status = await paystackService.verifyPayment(transactionId, transaction.providerTransactionId);
          break;
        case PaymentProvider.CASH:
          return transaction.status; // Le statut cash est géré manuellement
        default:
          return transaction.status;
      }

      // Mettre à jour si le statut a changé
      if (status !== transaction.status) {
        await this.updateTransactionStatus(transactionId, status);
      }

      return status;

    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error);
      return transaction.status;
    }
  }

  /**
   * Met à jour le statut d'une transaction
   */
  async updateTransactionStatus(transactionId: string, status: PaymentStatus): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) return;

    const oldStatus = transaction.status;
    transaction.status = status;

    if (status === PaymentStatus.COMPLETED) {
      transaction.completedAt = new Date().toISOString();
      this.stopStatusTracking(transactionId);
      this.emit('payment:completed', transaction);
      await this.sendPaymentNotification(transaction, 'completed');
    } else if (status === PaymentStatus.FAILED) {
      this.stopStatusTracking(transactionId);
      this.emit('payment:failed', transaction);
      await this.sendPaymentNotification(transaction, 'failed');
    } else if (status === PaymentStatus.CANCELLED) {
      this.stopStatusTracking(transactionId);
      this.emit('payment:cancelled', transaction);
    }

    this.transactions.set(transactionId, transaction);
  }

  /**
   * Gère le paiement en espèces
   */
  private handleCashPayment(request: PaymentRequest): PaymentResponse {
    return {
      success: true,
      transactionId: generateTransactionId(),
      status: PaymentStatus.PENDING,
      message: 'Paiement en espèces configuré - À payer à la livraison',
    };
  }

  /**
   * Démarre le suivi automatique du statut
   */
  private startStatusTracking(transaction: PaymentTransaction): void {
    const interval = setInterval(async () => {
      try {
        await this.checkPaymentStatus(transaction.id);
      } catch (error) {
        console.error('Erreur lors du suivi du statut:', error);
      }
    }, 30000); // Vérifier toutes les 30 secondes

    this.statusCheckIntervals.set(transaction.id, interval);

    // Arrêter après 30 minutes
    setTimeout(() => {
      this.stopStatusTracking(transaction.id);
    }, 30 * 60 * 1000);
  }

  /**
   * Arrête le suivi du statut
   */
  private stopStatusTracking(transactionId: string): void {
    const interval = this.statusCheckIntervals.get(transactionId);
    if (interval) {
      clearInterval(interval);
      this.statusCheckIntervals.delete(transactionId);
    }
  }

  /**
   * Envoie une notification de paiement
   */
  private async sendPaymentNotification(transaction: PaymentTransaction, event: string): Promise<void> {
    try {
      let notificationType: NotificationType;
      let data: any = {
        orderId: transaction.orderId,
        orderNumber: transaction.orderNumber,
        amount: transaction.amount,
        provider: PAYMENT_PROVIDERS[transaction.provider].displayName,
      };

      switch (event) {
        case 'initiated':
          notificationType = NotificationType.PAYMENT_REQUIRED;
          break;
        case 'completed':
          notificationType = NotificationType.PAYMENT_CONFIRMED;
          break;
        case 'failed':
          notificationType = NotificationType.SYSTEM_ALERT;
          data.message = 'Échec du paiement - Veuillez réessayer';
          break;
        default:
          return;
      }

      await notificationService.sendNotification(transaction.userId, notificationType, data);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de notification de paiement:', error);
    }
  }

  /**
   * Obtient une méthode de paiement
   */
  async getPaymentMethod(paymentMethodId: string): Promise<WaliPaymentMethod | null> {
    // En mode développement, créer une méthode simulée
    if (process.env.NODE_ENV === 'development') {
      return {
        id: paymentMethodId,
        provider: PaymentProvider.ORANGE_MONEY,
        paymentMethod: 'MOBILE_MONEY' as any,
        displayName: 'Orange Money - 07 XX XX XX XX',
        phoneNumber: '+225 07 12 34 56 78',
        isDefault: true,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
    }

    // En production, récupérer depuis la base de données
    // return await this.paymentMethodRepository.findById(paymentMethodId);
    return null;
  }

  /**
   * Obtient les méthodes de paiement d'un utilisateur
   */
  async getUserPaymentMethods(userId: string): Promise<WaliPaymentMethod[]> {
    if (this.paymentMethods.has(userId)) {
      return this.paymentMethods.get(userId)!;
    }

    // En mode développement, retourner des méthodes simulées
    if (process.env.NODE_ENV === 'development') {
      const mockMethods: WaliPaymentMethod[] = [
        {
          id: 'om_1',
          provider: PaymentProvider.ORANGE_MONEY,
          paymentMethod: 'MOBILE_MONEY' as any,
          displayName: 'Orange Money',
          phoneNumber: '+225 07 12 34 56 78',
          isDefault: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'mtn_1',
          provider: PaymentProvider.MTN_MOMO,
          paymentMethod: 'MOBILE_MONEY' as any,
          displayName: 'MTN Mobile Money',
          phoneNumber: '+225 05 12 34 56 78',
          isDefault: false,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'wave_1',
          provider: PaymentProvider.WAVE,
          paymentMethod: 'MOBILE_MONEY' as any,
          displayName: 'Wave',
          phoneNumber: '+225 01 12 34 56 78',
          isDefault: false,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'flw_1',
          provider: PaymentProvider.FLUTTERWAVE,
          paymentMethod: 'BANK_CARD' as any,
          displayName: 'Flutterwave',
          cardDetails: {
            last4: '1234',
            cardType: 'VISA' as any,
            expiryMonth: '12',
            expiryYear: '25',
            bank: 'Banque Atlantique',
          },
          isDefault: false,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'ps_1',
          provider: PaymentProvider.PAYSTACK,
          paymentMethod: 'BANK_CARD' as any,
          displayName: 'Paystack',
          cardDetails: {
            last4: '5678',
            cardType: 'MASTERCARD' as any,
            expiryMonth: '06',
            expiryYear: '26',
            bank: 'Ecobank',
          },
          isDefault: false,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'cash_1',
          provider: PaymentProvider.CASH,
          paymentMethod: 'CASH' as any,
          displayName: 'Paiement en espèces',
          isDefault: false,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ];

      this.paymentMethods.set(userId, mockMethods);
      return mockMethods;
    }

    return [];
  }

  /**
   * Ajoute une méthode de paiement
   */
  async addPaymentMethod(userId: string, phoneNumber: string, provider?: PaymentProvider): Promise<WaliPaymentMethod> {
    const detectedProvider = provider || detectProviderFromPhone(phoneNumber);
    if (!detectedProvider) {
      throw new Error('Impossible de détecter le provider pour ce numéro');
    }

    const paymentMethod: WaliPaymentMethod = {
      id: `${detectedProvider.toLowerCase()}_${Date.now()}`,
      provider: detectedProvider,
      paymentMethod: 'MOBILE_MONEY' as any,
      displayName: PAYMENT_PROVIDERS[detectedProvider].displayName,
      phoneNumber,
      isDefault: false,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const userMethods = await this.getUserPaymentMethods(userId);
    userMethods.push(paymentMethod);
    this.paymentMethods.set(userId, userMethods);

    return paymentMethod;
  }

  /**
   * Initie un paiement par carte avec Flutterwave ou Paystack
   */
  async initiateCardPayment(
    request: PaymentRequest,
    cardDetails: {
      cardNumber: string;
      cvv: string;
      expiryMonth: string;
      expiryYear: string;
      pin?: string;
    },
    provider: PaymentProvider.FLUTTERWAVE | PaymentProvider.PAYSTACK
  ): Promise<PaymentResponse> {
    try {
      let response: PaymentResponse;

      switch (provider) {
        case PaymentProvider.FLUTTERWAVE:
          response = await flutterwaveService.initiateCardPayment(request, cardDetails);
          break;
        case PaymentProvider.PAYSTACK:
          response = await paystackService.initiateCardPayment(request, cardDetails);
          break;
        default:
          throw new Error(`Provider non supporté pour paiement par carte: ${provider}`);
      }

      // Créer la transaction si succès
      if (response.success) {
        const transaction: PaymentTransaction = {
          id: response.transactionId,
          orderId: request.orderId,
          orderNumber: `WAL-${request.orderId}`,
          userId: 'current_user_id', // À récupérer du contexte
          paymentMethodId: 'card_payment',
          provider,
          type: 'ORDER_PAYMENT',
          amount: request.amount,
          currency: request.currency,
          status: response.status,
          description: request.description,
          providerTransactionId: response.providerTransactionId,
          metadata: {
            phoneNumber: request.customerPhone,
            customerName: request.customerName,
            cardLast4: cardDetails.cardNumber.slice(-4),
          },
          initiatedAt: new Date().toISOString(),
          expiresAt: response.expiresAt,
        };

        this.transactions.set(transaction.id, transaction);
        this.emit('payment:initiated', transaction);
        await this.sendPaymentNotification(transaction, 'initiated');

        if (response.status === PaymentStatus.COMPLETED) {
          this.emit('payment:completed', transaction);
          await this.sendPaymentNotification(transaction, 'completed');
        }
      }

      return response;
    } catch (error: any) {
      console.error('Erreur lors du paiement par carte:', error);
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
   * Ajoute une méthode de paiement par carte
   */
  async addCardPaymentMethod(
    userId: string,
    cardDetails: {
      cardNumber: string;
      cvv: string;
      expiryMonth: string;
      expiryYear: string;
      cardholderName: string;
    },
    provider: PaymentProvider.FLUTTERWAVE | PaymentProvider.PAYSTACK
  ): Promise<WaliPaymentMethod> {
    const cardValidation = require('@/lib/payments').validateCardNumber(cardDetails.cardNumber);

    if (!cardValidation.isValid) {
      throw new Error('Numéro de carte invalide');
    }

    const paymentMethod: WaliPaymentMethod = {
      id: `${provider.toLowerCase()}_card_${Date.now()}`,
      provider,
      paymentMethod: 'BANK_CARD' as any,
      displayName: `${PAYMENT_PROVIDERS[provider].displayName} - **** ${cardDetails.cardNumber.slice(-4)}`,
      cardDetails: {
        last4: cardDetails.cardNumber.slice(-4),
        cardType: cardValidation.cardType!,
        expiryMonth: cardDetails.expiryMonth,
        expiryYear: cardDetails.expiryYear,
      },
      accountName: cardDetails.cardholderName,
      isDefault: false,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const userMethods = await this.getUserPaymentMethods(userId);
    userMethods.push(paymentMethod);
    this.paymentMethods.set(userId, userMethods);

    return paymentMethod;
  }

  /**
   * Traite les webhooks des providers
   */
  async handleWebhook(
    provider: PaymentProvider,
    webhookData: any,
    signature?: string
  ): Promise<{ success: boolean; transactionId?: string }> {
    try {
      let result: { success: boolean; status: PaymentStatus };

      switch (provider) {
        case PaymentProvider.FLUTTERWAVE:
          result = await flutterwaveService.handleWebhook(webhookData, signature || '');
          break;
        case PaymentProvider.PAYSTACK:
          result = await paystackService.handleWebhook(webhookData, signature || '');
          break;
        default:
          throw new Error(`Webhook non supporté pour le provider: ${provider}`);
      }

      if (result.success && webhookData.data?.tx_ref) {
        // Trouver la transaction correspondante
        const transaction = Array.from(this.transactions.values())
          .find(t => t.providerTransactionId === webhookData.data.tx_ref);

        if (transaction) {
          await this.updateTransactionStatus(transaction.id, result.status);
          return { success: true, transactionId: transaction.id };
        }
      }

      return { success: result.success };
    } catch (error) {
      console.error('Erreur lors du traitement du webhook:', error);
      return { success: false };
    }
  }

  /**
   * Obtient l'historique des transactions
   */
  getTransactionHistory(userId: string): PaymentTransaction[] {
    return Array.from(this.transactions.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.initiatedAt).getTime() - new Date(a.initiatedAt).getTime());
  }

  /**
   * Obtient une transaction par ID
   */
  getTransaction(transactionId: string): PaymentTransaction | null {
    return this.transactions.get(transactionId) || null;
  }

  /**
   * Écoute les événements
   */
  on<K extends keyof PaymentServiceEvents>(event: K, callback: PaymentServiceEvents[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Supprime un écouteur d'événement
   */
  off<K extends keyof PaymentServiceEvents>(event: K, callback: PaymentServiceEvents[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Émet un événement
   */
  private emit<K extends keyof PaymentServiceEvents>(event: K, ...args: Parameters<PaymentServiceEvents[K]>): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          (callback as any)(...args);
        } catch (error) {
          console.error(`Erreur dans l'écouteur ${event}:`, error);
        }
      });
    }
  }

  /**
   * Initialise des données de test
   */
  private initializeMockData(): void {
    // Créer quelques transactions de test
    if (process.env.NODE_ENV === 'development') {
      // Cette méthode sera supprimée en production
    }
  }

  /**
   * Nettoie les ressources
   */
  cleanup(): void {
    // Arrêter tous les intervalles de suivi
    this.statusCheckIntervals.forEach(interval => clearInterval(interval));
    this.statusCheckIntervals.clear();
    this.eventListeners.clear();
  }
}

export const paymentService = new PaymentService();
