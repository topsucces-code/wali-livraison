import { useState, useEffect, useCallback } from 'react';
import {
  PaymentProvider,
  PaymentStatus,
  PaymentRequest,
  PaymentResponse,
  PaymentTransaction,
  WaliPaymentMethod,
  PAYMENT_PROVIDERS,
  detectProviderFromPhone,
  validatePhoneForProvider,
  validateAmountForProvider,
  formatAmount,
  validateCardNumber,
  validateExpiryDate,
  validateCVV,
} from '@/lib/payments';
import { paymentService } from '@/services/payment.service';
import { useWaliAuth } from './useWaliAuth';

interface UsePaymentsReturn {
  // État
  paymentMethods: WaliPaymentMethod[];
  transactions: PaymentTransaction[];
  isLoading: boolean;
  error: string | null;

  // Actions de paiement
  initiatePayment: (request: PaymentRequest) => Promise<PaymentResponse>;
  initiateCardPayment: (
    request: PaymentRequest,
    cardDetails: {
      cardNumber: string;
      cvv: string;
      expiryMonth: string;
      expiryYear: string;
      pin?: string;
    },
    provider: PaymentProvider.FLUTTERWAVE | PaymentProvider.PAYSTACK
  ) => Promise<PaymentResponse>;
  checkPaymentStatus: (transactionId: string) => Promise<PaymentStatus>;
  addPaymentMethod: (phoneNumber: string, provider?: PaymentProvider) => Promise<WaliPaymentMethod>;
  addCardPaymentMethod: (
    cardDetails: {
      cardNumber: string;
      cvv: string;
      expiryMonth: string;
      expiryYear: string;
      cardholderName: string;
    },
    provider: PaymentProvider.FLUTTERWAVE | PaymentProvider.PAYSTACK
  ) => Promise<WaliPaymentMethod>;
  
  // Gestion des méthodes
  setDefaultPaymentMethod: (methodId: string) => Promise<void>;
  removePaymentMethod: (methodId: string) => Promise<void>;
  
  // Utilitaires
  getAvailableProviders: () => typeof PAYMENT_PROVIDERS;
  detectProvider: (phoneNumber: string) => PaymentProvider | null;
  validatePayment: (amount: number, phoneNumber: string, provider: PaymentProvider) => { isValid: boolean; error?: string };
  validateCard: (cardNumber: string, cvv: string, expiryMonth: string, expiryYear: string) => { isValid: boolean; error?: string };
  formatPaymentAmount: (amount: number) => string;
  
  // État des transactions
  getTransaction: (transactionId: string) => PaymentTransaction | null;
  refreshTransactions: () => Promise<void>;
  clearError: () => void;
}

export const usePayments = (): UsePaymentsReturn => {
  const { user } = useWaliAuth();
  const [paymentMethods, setPaymentMethods] = useState<WaliPaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chargement initial
  useEffect(() => {
    if (user) {
      loadPaymentMethods();
      loadTransactions();
      setupEventListeners();
    }

    return () => {
      paymentService.cleanup();
    };
  }, [user]);

  // Chargement des méthodes de paiement
  const loadPaymentMethods = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const methods = await paymentService.getUserPaymentMethods(user.id);
      setPaymentMethods(methods);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des méthodes de paiement');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Chargement des transactions
  const loadTransactions = useCallback(async () => {
    if (!user) return;

    try {
      const history = paymentService.getTransactionHistory(user.id);
      setTransactions(history);
    } catch (err: any) {
      console.error('Erreur lors du chargement des transactions:', err);
    }
  }, [user]);

  // Configuration des écouteurs d'événements
  const setupEventListeners = useCallback(() => {
    paymentService.on('payment:initiated', (transaction) => {
      setTransactions(prev => [transaction, ...prev]);
    });

    paymentService.on('payment:completed', (transaction) => {
      setTransactions(prev => prev.map(t => 
        t.id === transaction.id ? transaction : t
      ));
    });

    paymentService.on('payment:failed', (transaction) => {
      setTransactions(prev => prev.map(t => 
        t.id === transaction.id ? transaction : t
      ));
    });

    paymentService.on('payment:cancelled', (transaction) => {
      setTransactions(prev => prev.map(t => 
        t.id === transaction.id ? transaction : t
      ));
    });
  }, []);

  // Initier un paiement
  const initiatePayment = useCallback(async (request: PaymentRequest): Promise<PaymentResponse> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await paymentService.initiatePayment(request);
      
      if (!response.success) {
        setError(response.error?.message || 'Erreur lors de l\'initiation du paiement');
      }

      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'initiation du paiement';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Vérifier le statut d'un paiement
  const checkPaymentStatus = useCallback(async (transactionId: string): Promise<PaymentStatus> => {
    try {
      const status = await paymentService.checkPaymentStatus(transactionId);
      
      // Mettre à jour la transaction locale
      setTransactions(prev => prev.map(t => 
        t.id === transactionId ? { ...t, status } : t
      ));

      return status;
    } catch (err: any) {
      console.error('Erreur lors de la vérification du statut:', err);
      throw err;
    }
  }, []);

  // Initier un paiement par carte
  const initiateCardPayment = useCallback(async (
    request: PaymentRequest,
    cardDetails: {
      cardNumber: string;
      cvv: string;
      expiryMonth: string;
      expiryYear: string;
      pin?: string;
    },
    provider: PaymentProvider.FLUTTERWAVE | PaymentProvider.PAYSTACK
  ): Promise<PaymentResponse> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await paymentService.initiateCardPayment(request, cardDetails, provider);

      if (!response.success) {
        setError(response.error?.message || 'Erreur lors du paiement par carte');
      }

      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du paiement par carte';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Ajouter une méthode de paiement
  const addPaymentMethod = useCallback(async (
    phoneNumber: string,
    provider?: PaymentProvider
  ): Promise<WaliPaymentMethod> => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      setIsLoading(true);
      setError(null);

      const method = await paymentService.addPaymentMethod(user.id, phoneNumber, provider);
      setPaymentMethods(prev => [...prev, method]);

      return method;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'ajout de la méthode de paiement';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Ajouter une méthode de paiement par carte
  const addCardPaymentMethod = useCallback(async (
    cardDetails: {
      cardNumber: string;
      cvv: string;
      expiryMonth: string;
      expiryYear: string;
      cardholderName: string;
    },
    provider: PaymentProvider.FLUTTERWAVE | PaymentProvider.PAYSTACK
  ): Promise<WaliPaymentMethod> => {
    if (!user) throw new Error('Utilisateur non connecté');

    try {
      setIsLoading(true);
      setError(null);

      const method = await paymentService.addCardPaymentMethod(user.id, cardDetails, provider);
      setPaymentMethods(prev => [...prev, method]);

      return method;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'ajout de la carte';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Définir une méthode par défaut
  const setDefaultPaymentMethod = useCallback(async (methodId: string): Promise<void> => {
    try {
      setPaymentMethods(prev => prev.map(method => ({
        ...method,
        isDefault: method.id === methodId,
      })));
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la définition de la méthode par défaut');
    }
  }, []);

  // Supprimer une méthode de paiement
  const removePaymentMethod = useCallback(async (methodId: string): Promise<void> => {
    try {
      setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression de la méthode de paiement');
    }
  }, []);

  // Obtenir les providers disponibles
  const getAvailableProviders = useCallback(() => {
    return PAYMENT_PROVIDERS;
  }, []);

  // Détecter le provider depuis un numéro
  const detectProvider = useCallback((phoneNumber: string): PaymentProvider | null => {
    return detectProviderFromPhone(phoneNumber);
  }, []);

  // Valider un paiement
  const validatePayment = useCallback((
    amount: number, 
    phoneNumber: string, 
    provider: PaymentProvider
  ): { isValid: boolean; error?: string } => {
    // Valider le montant
    if (!validateAmountForProvider(amount, provider)) {
      const config = PAYMENT_PROVIDERS[provider];
      return {
        isValid: false,
        error: `Le montant doit être entre ${formatAmount(config.minAmount)} et ${formatAmount(config.maxAmount)}`,
      };
    }

    // Valider le numéro de téléphone (sauf pour cash)
    if (provider !== PaymentProvider.CASH && !validatePhoneForProvider(phoneNumber, provider)) {
      const config = PAYMENT_PROVIDERS[provider];
      return {
        isValid: false,
        error: `Numéro invalide pour ${config.displayName}`,
      };
    }

    return { isValid: true };
  }, []);

  // Valider une carte
  const validateCard = useCallback((
    cardNumber: string,
    cvv: string,
    expiryMonth: string,
    expiryYear: string
  ): { isValid: boolean; error?: string } => {
    // Valider le numéro de carte
    const cardValidation = validateCardNumber(cardNumber);
    if (!cardValidation.isValid) {
      return {
        isValid: false,
        error: 'Numéro de carte invalide',
      };
    }

    // Valider la date d'expiration
    if (!validateExpiryDate(expiryMonth, expiryYear)) {
      return {
        isValid: false,
        error: 'Date d\'expiration invalide ou expirée',
      };
    }

    // Valider le CVV
    if (!validateCVV(cvv, cardValidation.cardType!)) {
      return {
        isValid: false,
        error: 'Code CVV invalide',
      };
    }

    return { isValid: true };
  }, []);

  // Formater un montant
  const formatPaymentAmount = useCallback((amount: number): string => {
    return formatAmount(amount);
  }, []);

  // Obtenir une transaction
  const getTransaction = useCallback((transactionId: string): PaymentTransaction | null => {
    return transactions.find(t => t.id === transactionId) || null;
  }, [transactions]);

  // Actualiser les transactions
  const refreshTransactions = useCallback(async (): Promise<void> => {
    await loadTransactions();
  }, [loadTransactions]);

  // Effacer l'erreur
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // État
    paymentMethods,
    transactions,
    isLoading,
    error,

    // Actions de paiement
    initiatePayment,
    initiateCardPayment,
    checkPaymentStatus,
    addPaymentMethod,
    addCardPaymentMethod,

    // Gestion des méthodes
    setDefaultPaymentMethod,
    removePaymentMethod,

    // Utilitaires
    getAvailableProviders,
    detectProvider,
    validatePayment,
    validateCard,
    formatPaymentAmount,

    // État des transactions
    getTransaction,
    refreshTransactions,
    clearError,
  };
};

// Hook spécialisé pour une commande spécifique
export const useOrderPayment = (orderId: string) => {
  const payments = usePayments();
  
  const orderTransactions = payments.transactions.filter(t => t.orderId === orderId);
  const latestTransaction = orderTransactions[0] || null;
  
  const initiateOrderPayment = useCallback(async (
    amount: number,
    paymentMethodId: string,
    description: string,
    customerPhone: string,
    customerName: string
  ) => {
    const request: PaymentRequest = {
      orderId,
      amount,
      currency: 'XOF',
      paymentMethodId,
      description,
      customerPhone,
      customerName,
    };
    
    return payments.initiatePayment(request);
  }, [orderId, payments.initiatePayment]);

  return {
    ...payments,
    orderTransactions,
    latestTransaction,
    initiateOrderPayment,
  };
};
