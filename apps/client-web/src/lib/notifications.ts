// Types et modèles pour le système de notifications WALI Livraison

export enum NotificationType {
  ORDER_STATUS = 'ORDER_STATUS',
  NEW_MESSAGE = 'NEW_MESSAGE',
  DRIVER_ASSIGNED = 'DRIVER_ASSIGNED',
  DRIVER_ARRIVED = 'DRIVER_ARRIVED',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  DELIVERY_COMPLETED = 'DELIVERY_COMPLETED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  PROMOTION = 'PROMOTION',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum NotificationChannel {
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  IN_APP = 'IN_APP',
}

export interface WaliNotification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  title: string;
  message: string;
  data?: {
    orderId?: string;
    orderNumber?: string;
    chatId?: string;
    driverId?: string;
    driverName?: string;
    amount?: number;
    actionUrl?: string;
    imageUrl?: string;
  };
  isRead: boolean;
  isArchived: boolean;
  createdAt: string;
  readAt?: string;
  expiresAt?: string;
}

export interface NotificationPreferences {
  userId: string;
  channels: {
    [key in NotificationType]: NotificationChannel[];
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string;
  };
  language: 'fr' | 'en';
  emailAddress?: string;
  phoneNumber?: string;
  pushToken?: string;
}

// Templates de notifications en français
export const NOTIFICATION_TEMPLATES = {
  [NotificationType.ORDER_STATUS]: {
    title: 'Mise à jour de commande',
    messages: {
      PENDING: 'Votre commande {orderNumber} est en attente d\'attribution',
      ASSIGNED: 'Un livreur a été assigné à votre commande {orderNumber}',
      ACCEPTED: '{driverName} a accepté votre commande {orderNumber}',
      PICKUP_IN_PROGRESS: '{driverName} se dirige vers le point de récupération',
      PICKED_UP: 'Votre colis a été récupéré par {driverName}',
      DELIVERY_IN_PROGRESS: '{driverName} se dirige vers vous',
      DELIVERED: 'Votre commande {orderNumber} a été livrée avec succès !',
      CANCELLED: 'Votre commande {orderNumber} a été annulée',
      FAILED: 'Problème avec votre commande {orderNumber}',
    },
  },
  [NotificationType.NEW_MESSAGE]: {
    title: 'Nouveau message',
    message: '{senderName}: {messagePreview}',
  },
  [NotificationType.DRIVER_ASSIGNED]: {
    title: 'Livreur assigné',
    message: '{driverName} a été assigné à votre commande {orderNumber}',
  },
  [NotificationType.DRIVER_ARRIVED]: {
    title: 'Livreur arrivé',
    message: '{driverName} est arrivé au point de rendez-vous',
  },
  [NotificationType.PAYMENT_REQUIRED]: {
    title: 'Paiement requis',
    message: 'Veuillez effectuer le paiement de {amount} FCFA pour votre commande {orderNumber}',
  },
  [NotificationType.PAYMENT_CONFIRMED]: {
    title: 'Paiement confirmé',
    message: 'Votre paiement de {amount} FCFA a été confirmé',
  },
  [NotificationType.DELIVERY_COMPLETED]: {
    title: 'Livraison terminée',
    message: 'Votre commande {orderNumber} a été livrée. Merci d\'avoir choisi WALI !',
  },
  [NotificationType.ORDER_CANCELLED]: {
    title: 'Commande annulée',
    message: 'Votre commande {orderNumber} a été annulée. Remboursement en cours.',
  },
  [NotificationType.SYSTEM_ALERT]: {
    title: 'Alerte système',
    message: 'Information importante concernant votre compte WALI',
  },
  [NotificationType.PROMOTION]: {
    title: 'Offre spéciale WALI',
    message: 'Profitez de nos promotions exclusives !',
  },
};

// Configuration par défaut des préférences
export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<NotificationPreferences, 'userId'> = {
  channels: {
    [NotificationType.ORDER_STATUS]: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
    [NotificationType.NEW_MESSAGE]: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
    [NotificationType.DRIVER_ASSIGNED]: [NotificationChannel.PUSH, NotificationChannel.IN_APP, NotificationChannel.SMS],
    [NotificationType.DRIVER_ARRIVED]: [NotificationChannel.PUSH, NotificationChannel.IN_APP, NotificationChannel.SMS],
    [NotificationType.PAYMENT_REQUIRED]: [NotificationChannel.PUSH, NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    [NotificationType.PAYMENT_CONFIRMED]: [NotificationChannel.PUSH, NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    [NotificationType.DELIVERY_COMPLETED]: [NotificationChannel.PUSH, NotificationChannel.IN_APP, NotificationChannel.SMS],
    [NotificationType.ORDER_CANCELLED]: [NotificationChannel.PUSH, NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    [NotificationType.SYSTEM_ALERT]: [NotificationChannel.PUSH, NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    [NotificationType.PROMOTION]: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
  },
  quietHours: {
    enabled: true,
    startTime: '22:00',
    endTime: '07:00',
  },
  language: 'fr',
};

// Priorités par type de notification
export const NOTIFICATION_PRIORITIES: Record<NotificationType, NotificationPriority> = {
  [NotificationType.ORDER_STATUS]: NotificationPriority.HIGH,
  [NotificationType.NEW_MESSAGE]: NotificationPriority.NORMAL,
  [NotificationType.DRIVER_ASSIGNED]: NotificationPriority.HIGH,
  [NotificationType.DRIVER_ARRIVED]: NotificationPriority.URGENT,
  [NotificationType.PAYMENT_REQUIRED]: NotificationPriority.HIGH,
  [NotificationType.PAYMENT_CONFIRMED]: NotificationPriority.NORMAL,
  [NotificationType.DELIVERY_COMPLETED]: NotificationPriority.HIGH,
  [NotificationType.ORDER_CANCELLED]: NotificationPriority.HIGH,
  [NotificationType.SYSTEM_ALERT]: NotificationPriority.URGENT,
  [NotificationType.PROMOTION]: NotificationPriority.LOW,
};

// Icônes pour les notifications
export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  [NotificationType.ORDER_STATUS]: '📦',
  [NotificationType.NEW_MESSAGE]: '💬',
  [NotificationType.DRIVER_ASSIGNED]: '🚚',
  [NotificationType.DRIVER_ARRIVED]: '📍',
  [NotificationType.PAYMENT_REQUIRED]: '💳',
  [NotificationType.PAYMENT_CONFIRMED]: '✅',
  [NotificationType.DELIVERY_COMPLETED]: '🎉',
  [NotificationType.ORDER_CANCELLED]: '❌',
  [NotificationType.SYSTEM_ALERT]: '⚠️',
  [NotificationType.PROMOTION]: '🎁',
};

// Couleurs pour les notifications
export const NOTIFICATION_COLORS: Record<NotificationPriority, string> = {
  [NotificationPriority.LOW]: 'bg-gray-100 text-gray-800',
  [NotificationPriority.NORMAL]: 'bg-blue-100 text-blue-800',
  [NotificationPriority.HIGH]: 'bg-orange-100 text-orange-800',
  [NotificationPriority.URGENT]: 'bg-red-100 text-red-800',
};

// Génération d'ID de notification
export const generateNotificationId = (): string => {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Formatage du temps pour les notifications
export const formatNotificationTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
  
  if (diffInMinutes < 1) {
    return 'À l\'instant';
  } else if (diffInMinutes < 60) {
    return `Il y a ${Math.floor(diffInMinutes)} min`;
  } else if (diffInMinutes < 1440) { // 24 heures
    return `Il y a ${Math.floor(diffInMinutes / 60)} h`;
  } else {
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

// Vérification des heures silencieuses
export const isInQuietHours = (preferences: NotificationPreferences): boolean => {
  if (!preferences.quietHours.enabled) return false;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = preferences.quietHours.startTime.split(':').map(Number);
  const [endHour, endMin] = preferences.quietHours.endTime.split(':').map(Number);
  
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  
  // Gérer le cas où les heures silencieuses traversent minuit
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  } else {
    return currentTime >= startTime && currentTime <= endTime;
  }
};

// Création d'une notification
export const createNotification = (
  userId: string,
  type: NotificationType,
  data: any = {},
  customMessage?: string
): WaliNotification => {
  const template = NOTIFICATION_TEMPLATES[type];
  let title = template.title;
  let message = customMessage || template.message;
  
  // Remplacer les variables dans le message
  if (typeof template.messages === 'object' && data.status) {
    message = template.messages[data.status as keyof typeof template.messages] || message;
  }
  
  // Substitution des variables
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    title = title.replace(new RegExp(placeholder, 'g'), String(value));
    message = message.replace(new RegExp(placeholder, 'g'), String(value));
  });
  
  return {
    id: generateNotificationId(),
    userId,
    type,
    priority: NOTIFICATION_PRIORITIES[type],
    channels: DEFAULT_NOTIFICATION_PREFERENCES.channels[type],
    title,
    message,
    data,
    isRead: false,
    isArchived: false,
    createdAt: new Date().toISOString(),
  };
};

// Validation du token push
export const isValidPushToken = (token: string): boolean => {
  // Validation basique du format du token
  return token && token.length > 10 && /^[a-zA-Z0-9_-]+$/.test(token);
};

// Validation du numéro de téléphone ivoirien
export const isValidIvoirianPhone = (phone: string): boolean => {
  // Format: +225 XX XX XX XX XX ou 225XXXXXXXXXX ou 0XXXXXXXXX
  const cleaned = phone.replace(/\s+/g, '');
  const patterns = [
    /^\+225[0-9]{10}$/, // +225XXXXXXXXXX
    /^225[0-9]{10}$/, // 225XXXXXXXXXX
    /^0[0-9]{9}$/, // 0XXXXXXXXX
  ];
  
  return patterns.some(pattern => pattern.test(cleaned));
};

// Validation de l'email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Groupement des notifications par type
export const groupNotificationsByType = (notifications: WaliNotification[]): Record<string, WaliNotification[]> => {
  return notifications.reduce((groups, notification) => {
    const key = notification.type;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(notification);
    return groups;
  }, {} as Record<string, WaliNotification[]>);
};

// Filtrage des notifications
export const filterNotifications = (
  notifications: WaliNotification[],
  filters: {
    isRead?: boolean;
    type?: NotificationType;
    priority?: NotificationPriority;
    dateFrom?: string;
    dateTo?: string;
  }
): WaliNotification[] => {
  return notifications.filter(notification => {
    if (filters.isRead !== undefined && notification.isRead !== filters.isRead) {
      return false;
    }
    
    if (filters.type && notification.type !== filters.type) {
      return false;
    }
    
    if (filters.priority && notification.priority !== filters.priority) {
      return false;
    }
    
    if (filters.dateFrom && notification.createdAt < filters.dateFrom) {
      return false;
    }
    
    if (filters.dateTo && notification.createdAt > filters.dateTo) {
      return false;
    }
    
    return true;
  });
};
