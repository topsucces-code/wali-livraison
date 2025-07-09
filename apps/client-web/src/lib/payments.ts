// Types et modèles pour les paiements Mobile Money WALI Livraison

export enum PaymentProvider {
  ORANGE_MONEY = 'ORANGE_MONEY',
  MTN_MOMO = 'MTN_MOMO',
  WAVE = 'WAVE',
  FLUTTERWAVE = 'FLUTTERWAVE',
  PAYSTACK = 'PAYSTACK',
  CASH = 'CASH',
  CARD = 'CARD',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED',
}

export enum PaymentType {
  ORDER_PAYMENT = 'ORDER_PAYMENT',
  DELIVERY_FEE = 'DELIVERY_FEE',
  TIP = 'TIP',
  REFUND = 'REFUND',
  COMMISSION = 'COMMISSION',
}

export enum PaymentMethod {
  MOBILE_MONEY = 'MOBILE_MONEY',
  BANK_CARD = 'BANK_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  USSD = 'USSD',
  QR_CODE = 'QR_CODE',
  CASH = 'CASH',
}

export enum CardType {
  VISA = 'VISA',
  MASTERCARD = 'MASTERCARD',
  VERVE = 'VERVE',
  AMERICAN_EXPRESS = 'AMERICAN_EXPRESS',
}

export interface WaliPaymentMethod {
  id: string;
  provider: PaymentProvider;
  paymentMethod: PaymentMethod;
  displayName: string;
  phoneNumber?: string;
  accountName?: string;
  cardDetails?: {
    last4: string;
    cardType: CardType;
    expiryMonth: string;
    expiryYear: string;
    bank?: string;
  };
  isDefault: boolean;
  isActive: boolean;
  lastUsed?: string;
  createdAt: string;
  metadata?: {
    country?: string;
    currency?: string;
    supportedMethods?: PaymentMethod[];
  };
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  paymentMethodId: string;
  provider: PaymentProvider;
  type: PaymentType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description: string;
  
  // Données spécifiques au provider
  providerTransactionId?: string;
  providerReference?: string;
  providerData?: Record<string, any>;
  
  // Métadonnées
  metadata?: {
    phoneNumber?: string;
    customerName?: string;
    merchantReference?: string;
    callbackUrl?: string;
    returnUrl?: string;
  };
  
  // Timestamps
  initiatedAt: string;
  completedAt?: string;
  expiresAt?: string;
  
  // Erreurs
  errorCode?: string;
  errorMessage?: string;
  
  // Callbacks et webhooks
  webhookReceived?: boolean;
  webhookData?: Record<string, any>;
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
  description: string;
  customerPhone: string;
  customerName: string;
  callbackUrl?: string;
  returnUrl?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  providerTransactionId?: string;
  status: PaymentStatus;
  message: string;
  paymentUrl?: string;
  qrCode?: string;
  ussdCode?: string;
  expiresAt?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Configuration des providers de paiement
export const PAYMENT_PROVIDERS = {
  [PaymentProvider.ORANGE_MONEY]: {
    name: 'Orange Money',
    displayName: 'Orange Money',
    icon: '🟠',
    color: '#FF6600',
    description: 'Paiement via Orange Money',
    phonePrefix: '+225',
    supportedOperators: ['07', '08', '09'],
    minAmount: 100,
    maxAmount: 1000000,
    fees: {
      percentage: 0,
      fixed: 0,
    },
    processingTime: '1-3 minutes',
    isActive: true,
    supportedMethods: [PaymentMethod.MOBILE_MONEY],
    supportedCountries: ['CI'],
    supportedCurrencies: ['XOF'],
  },
  [PaymentProvider.MTN_MOMO]: {
    name: 'MTN Mobile Money',
    displayName: 'MTN MoMo',
    icon: '🟡',
    color: '#FFCC00',
    description: 'Paiement via MTN Mobile Money',
    phonePrefix: '+225',
    supportedOperators: ['05', '06'],
    minAmount: 100,
    maxAmount: 500000,
    fees: {
      percentage: 0,
      fixed: 0,
    },
    processingTime: '1-5 minutes',
    isActive: true,
    supportedMethods: [PaymentMethod.MOBILE_MONEY],
    supportedCountries: ['CI'],
    supportedCurrencies: ['XOF'],
  },
  [PaymentProvider.WAVE]: {
    name: 'Wave',
    displayName: 'Wave',
    icon: '🌊',
    color: '#00D4FF',
    description: 'Paiement via Wave',
    phonePrefix: '+225',
    supportedOperators: ['01', '02', '03', '04', '05', '06', '07', '08', '09'],
    minAmount: 50,
    maxAmount: 2000000,
    fees: {
      percentage: 0,
      fixed: 0,
    },
    processingTime: 'Instantané',
    isActive: true,
    supportedMethods: [PaymentMethod.MOBILE_MONEY, PaymentMethod.QR_CODE],
    supportedCountries: ['CI', 'SN'],
    supportedCurrencies: ['XOF'],
  },
  [PaymentProvider.FLUTTERWAVE]: {
    name: 'Flutterwave',
    displayName: 'Flutterwave',
    icon: '🌍',
    color: '#F5A623',
    description: 'Paiement par carte ou Mobile Money panafricain',
    phonePrefix: '+225',
    supportedOperators: ['01', '02', '03', '04', '05', '06', '07', '08', '09'],
    minAmount: 100,
    maxAmount: 5000000,
    fees: {
      percentage: 1.4,
      fixed: 0,
    },
    processingTime: 'Instantané',
    isActive: true,
    supportedMethods: [PaymentMethod.BANK_CARD, PaymentMethod.MOBILE_MONEY, PaymentMethod.BANK_TRANSFER],
    supportedCountries: ['CI', 'NG', 'GH', 'KE', 'UG', 'ZA'],
    supportedCurrencies: ['XOF', 'NGN', 'GHS', 'KES', 'UGX', 'ZAR'],
  },
  [PaymentProvider.PAYSTACK]: {
    name: 'Paystack',
    displayName: 'Paystack',
    icon: '💎',
    color: '#00C3F7',
    description: 'Paiement par carte bancaire et solutions africaines',
    phonePrefix: '+225',
    supportedOperators: ['01', '02', '03', '04', '05', '06', '07', '08', '09'],
    minAmount: 100,
    maxAmount: 10000000,
    fees: {
      percentage: 1.5,
      fixed: 100,
    },
    processingTime: 'Instantané',
    isActive: true,
    supportedMethods: [PaymentMethod.BANK_CARD, PaymentMethod.BANK_TRANSFER, PaymentMethod.USSD],
    supportedCountries: ['NG', 'GH', 'ZA', 'CI'],
    supportedCurrencies: ['NGN', 'GHS', 'ZAR', 'XOF'],
  },
  [PaymentProvider.CASH]: {
    name: 'Espèces',
    displayName: 'Paiement en espèces',
    icon: '💵',
    color: '#10B981',
    description: 'Paiement en espèces à la livraison',
    phonePrefix: '',
    supportedOperators: [],
    minAmount: 0,
    maxAmount: 100000,
    fees: {
      percentage: 0,
      fixed: 0,
    },
    processingTime: 'À la livraison',
    isActive: true,
    supportedMethods: [PaymentMethod.CASH],
    supportedCountries: ['CI'],
    supportedCurrencies: ['XOF'],
  },
};

// Messages d'erreur en français
export const PAYMENT_ERROR_MESSAGES = {
  INVALID_PHONE: 'Numéro de téléphone invalide',
  INSUFFICIENT_FUNDS: 'Solde insuffisant',
  TRANSACTION_FAILED: 'Transaction échouée',
  NETWORK_ERROR: 'Erreur de réseau',
  TIMEOUT: 'Délai d\'attente dépassé',
  CANCELLED_BY_USER: 'Transaction annulée par l\'utilisateur',
  INVALID_AMOUNT: 'Montant invalide',
  PROVIDER_ERROR: 'Erreur du fournisseur de paiement',
  UNKNOWN_ERROR: 'Erreur inconnue',
};

// Statuts de paiement avec labels français
export const PAYMENT_STATUS_LABELS = {
  [PaymentStatus.PENDING]: 'En attente',
  [PaymentStatus.PROCESSING]: 'En cours',
  [PaymentStatus.COMPLETED]: 'Terminé',
  [PaymentStatus.FAILED]: 'Échoué',
  [PaymentStatus.CANCELLED]: 'Annulé',
  [PaymentStatus.REFUNDED]: 'Remboursé',
  [PaymentStatus.EXPIRED]: 'Expiré',
};

// Couleurs pour les statuts
export const PAYMENT_STATUS_COLORS = {
  [PaymentStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [PaymentStatus.PROCESSING]: 'bg-blue-100 text-blue-800',
  [PaymentStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [PaymentStatus.FAILED]: 'bg-red-100 text-red-800',
  [PaymentStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
  [PaymentStatus.REFUNDED]: 'bg-purple-100 text-purple-800',
  [PaymentStatus.EXPIRED]: 'bg-orange-100 text-orange-800',
};

// Validation du numéro de téléphone selon l'opérateur
export const validatePhoneForProvider = (phone: string, provider: PaymentProvider): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  const config = PAYMENT_PROVIDERS[provider];
  
  if (!config.supportedOperators.length) return true; // Cash n'a pas de contraintes
  
  // Vérifier le format ivoirien
  let phoneToCheck = '';
  if (cleaned.startsWith('225')) {
    phoneToCheck = cleaned.substring(3);
  } else if (cleaned.startsWith('0')) {
    phoneToCheck = cleaned.substring(1);
  } else if (cleaned.length === 10) {
    phoneToCheck = cleaned;
  } else {
    return false;
  }
  
  if (phoneToCheck.length !== 10) return false;
  
  // Vérifier l'opérateur
  const prefix = phoneToCheck.substring(0, 2);
  return config.supportedOperators.includes(prefix);
};

// Formatage du montant en FCFA
export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('XOF', 'FCFA');
};

// Génération d'ID de transaction
export const generateTransactionId = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8);
  return `WALI_${timestamp}_${random}`.toUpperCase();
};

// Génération de référence marchande
export const generateMerchantReference = (orderId: string): string => {
  return `WALI_ORDER_${orderId}_${Date.now()}`;
};

// Validation du montant selon le provider
export const validateAmountForProvider = (amount: number, provider: PaymentProvider): boolean => {
  const config = PAYMENT_PROVIDERS[provider];
  return amount >= config.minAmount && amount <= config.maxAmount;
};

// Calcul des frais de transaction
export const calculateTransactionFees = (amount: number, provider: PaymentProvider): number => {
  const config = PAYMENT_PROVIDERS[provider];
  const percentageFee = (amount * config.fees.percentage) / 100;
  return percentageFee + config.fees.fixed;
};

// Détection automatique du provider selon le numéro
export const detectProviderFromPhone = (phone: string): PaymentProvider | null => {
  const cleaned = phone.replace(/\D/g, '');
  let phoneToCheck = '';

  if (cleaned.startsWith('225')) {
    phoneToCheck = cleaned.substring(3);
  } else if (cleaned.startsWith('0')) {
    phoneToCheck = cleaned.substring(1);
  } else if (cleaned.length === 10) {
    phoneToCheck = cleaned;
  } else {
    return null;
  }

  if (phoneToCheck.length !== 10) return null;

  const prefix = phoneToCheck.substring(0, 2);

  // Orange Money
  if (['07', '08', '09'].includes(prefix)) {
    return PaymentProvider.ORANGE_MONEY;
  }

  // MTN Mobile Money
  if (['05', '06'].includes(prefix)) {
    return PaymentProvider.MTN_MOMO;
  }

  // Wave accepte tous les opérateurs
  return PaymentProvider.WAVE;
};

// Validation des cartes bancaires
export const validateCardNumber = (cardNumber: string): { isValid: boolean; cardType?: CardType } => {
  const cleaned = cardNumber.replace(/\D/g, '');

  if (cleaned.length < 13 || cleaned.length > 19) {
    return { isValid: false };
  }

  // Algorithme de Luhn
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  const isValid = sum % 10 === 0;

  if (!isValid) {
    return { isValid: false };
  }

  // Détection du type de carte
  let cardType: CardType;
  if (cleaned.startsWith('4')) {
    cardType = CardType.VISA;
  } else if (cleaned.startsWith('5') || cleaned.startsWith('2')) {
    cardType = CardType.MASTERCARD;
  } else if (cleaned.startsWith('506') || cleaned.startsWith('507') || cleaned.startsWith('508') || cleaned.startsWith('627')) {
    cardType = CardType.VERVE;
  } else if (cleaned.startsWith('34') || cleaned.startsWith('37')) {
    cardType = CardType.AMERICAN_EXPRESS;
  } else {
    cardType = CardType.VISA; // Par défaut
  }

  return { isValid: true, cardType };
};

// Validation de la date d'expiration
export const validateExpiryDate = (month: string, year: string): boolean => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const expMonth = parseInt(month);
  const expYear = parseInt(year);

  if (expMonth < 1 || expMonth > 12) return false;
  if (expYear < currentYear) return false;
  if (expYear === currentYear && expMonth < currentMonth) return false;

  return true;
};

// Validation du CVV
export const validateCVV = (cvv: string, cardType: CardType): boolean => {
  const cleaned = cvv.replace(/\D/g, '');

  if (cardType === CardType.AMERICAN_EXPRESS) {
    return cleaned.length === 4;
  } else {
    return cleaned.length === 3;
  }
};

// Obtenir les providers disponibles pour un pays
export const getAvailableProvidersForCountry = (countryCode: string): PaymentProvider[] => {
  return Object.entries(PAYMENT_PROVIDERS)
    .filter(([_, config]) => config.supportedCountries?.includes(countryCode))
    .map(([provider, _]) => provider as PaymentProvider);
};

// Obtenir les méthodes de paiement supportées par un provider
export const getSupportedPaymentMethods = (provider: PaymentProvider): PaymentMethod[] => {
  return PAYMENT_PROVIDERS[provider].supportedMethods || [];
};

// Formatage du numéro de téléphone pour l'affichage
export const formatPhoneForDisplay = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('225') && cleaned.length === 13) {
    const number = cleaned.substring(3);
    return `+225 ${number.substring(0, 2)} ${number.substring(2, 4)} ${number.substring(4, 6)} ${number.substring(6, 8)} ${number.substring(8, 10)}`;
  } else if (cleaned.length === 10) {
    return `+225 ${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8, 10)}`;
  }
  
  return phone;
};

// Instructions de paiement selon le provider
export const getPaymentInstructions = (provider: PaymentProvider, amount: number, phone: string): string[] => {
  const formattedAmount = formatAmount(amount);
  const formattedPhone = formatPhoneForDisplay(phone);
  
  switch (provider) {
    case PaymentProvider.ORANGE_MONEY:
      return [
        `Composez #144# sur votre téléphone ${formattedPhone}`,
        'Sélectionnez "Paiement marchand"',
        `Entrez le montant: ${formattedAmount}`,
        'Confirmez avec votre code PIN Orange Money',
        'Vous recevrez un SMS de confirmation',
      ];
      
    case PaymentProvider.MTN_MOMO:
      return [
        `Composez *133# sur votre téléphone ${formattedPhone}`,
        'Sélectionnez "Paiement"',
        `Entrez le montant: ${formattedAmount}`,
        'Confirmez avec votre code PIN MTN MoMo',
        'Vous recevrez un SMS de confirmation',
      ];
      
    case PaymentProvider.WAVE:
      return [
        'Ouvrez l\'application Wave sur votre téléphone',
        'Scannez le QR code affiché',
        `Confirmez le paiement de ${formattedAmount}`,
        'Entrez votre code PIN Wave',
        'Le paiement sera traité instantanément',
      ];
      
    case PaymentProvider.CASH:
      return [
        'Préparez le montant exact en espèces',
        `Montant à payer: ${formattedAmount}`,
        'Remettez l\'argent au livreur à la réception',
        'Demandez un reçu de paiement',
        'Vérifiez votre commande avant paiement',
      ];
      
    default:
      return ['Instructions de paiement non disponibles'];
  }
};
