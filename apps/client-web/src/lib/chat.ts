// Types et modèles pour le système de chat WALI Livraison

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  LOCATION = 'LOCATION',
  ORDER_UPDATE = 'ORDER_UPDATE',
  SYSTEM = 'SYSTEM',
}

export enum MessageStatus {
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

export enum ParticipantRole {
  CLIENT = 'CLIENT',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN',
  SYSTEM = 'SYSTEM',
}

export interface ChatParticipant {
  id: string;
  name: string;
  role: ParticipantRole;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
  phone?: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: ParticipantRole;
  type: MessageType;
  content: string;
  metadata?: {
    imageUrl?: string;
    location?: { lat: number; lng: number; address?: string };
    orderUpdate?: {
      orderId: string;
      oldStatus: string;
      newStatus: string;
      message: string;
    };
  };
  status: MessageStatus;
  timestamp: string;
  editedAt?: string;
  replyTo?: string; // ID du message auquel on répond
}

export interface ChatConversation {
  id: string;
  orderId: string;
  orderNumber: string;
  participants: ChatParticipant[];
  messages: ChatMessage[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TypingIndicator {
  chatId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
  timestamp: string;
}

export interface ChatNotification {
  id: string;
  chatId: string;
  orderId: string;
  type: 'NEW_MESSAGE' | 'ORDER_UPDATE' | 'DRIVER_ASSIGNED' | 'DELIVERY_STARTED';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

// Messages système prédéfinis en français
export const SYSTEM_MESSAGES = {
  CHAT_CREATED: 'Conversation créée pour la commande {orderNumber}',
  DRIVER_ASSIGNED: '{driverName} a été assigné à votre commande',
  ORDER_ACCEPTED: 'Votre commande a été acceptée par {driverName}',
  PICKUP_STARTED: '{driverName} se dirige vers le point de récupération',
  PICKUP_COMPLETED: 'Colis récupéré par {driverName}',
  DELIVERY_STARTED: '{driverName} se dirige vers vous pour la livraison',
  DELIVERY_COMPLETED: 'Livraison terminée avec succès !',
  ORDER_CANCELLED: 'Commande annulée',
  DRIVER_ARRIVED: '{driverName} est arrivé au point de rendez-vous',
  PAYMENT_CONFIRMED: 'Paiement confirmé - {amount} FCFA',
};

// Templates de messages pour différentes situations
export const MESSAGE_TEMPLATES = {
  CLIENT: {
    GREETING: 'Bonjour, je suis {clientName}. Ma commande est prête pour récupération.',
    LOCATION_HELP: 'J\'ai du mal à trouver l\'adresse. Pouvez-vous m\'aider ?',
    DELAY_INQUIRY: 'Bonjour, pouvez-vous me donner une estimation du temps d\'arrivée ?',
    THANK_YOU: 'Merci pour la livraison rapide !',
    ISSUE_REPORT: 'Il y a un problème avec ma commande...',
  },
  DRIVER: {
    GREETING: 'Bonjour, je suis {driverName}, votre livreur WALI.',
    ARRIVAL_PICKUP: 'Je suis arrivé au point de récupération.',
    ON_THE_WAY: 'J\'ai récupéré votre colis et je me dirige vers vous.',
    ARRIVAL_DELIVERY: 'Je suis arrivé à l\'adresse de livraison.',
    LOCATION_REQUEST: 'Pouvez-vous partager votre position exacte ?',
    DELAY_NOTIFICATION: 'Je vais avoir un léger retard à cause du trafic. ETA: {eta}',
    DELIVERY_CONFIRMATION: 'Livraison effectuée. Merci d\'avoir choisi WALI !',
  },
  SYSTEM: {
    WELCOME: 'Bienvenue dans le chat WALI ! Vous pouvez communiquer directement avec votre livreur.',
    DRIVER_ONLINE: '{driverName} est maintenant en ligne.',
    DRIVER_OFFLINE: '{driverName} est hors ligne. Il répondra dès son retour.',
    ORDER_COMPLETED: 'Commande terminée. Ce chat restera accessible dans votre historique.',
  },
};

// Expressions courantes en français ivoirien
export const IVORIAN_EXPRESSIONS = {
  GREETINGS: ['Bonjour', 'Bonsoir', 'Salut', 'Wassa', 'Comment ça va ?'],
  THANKS: ['Merci', 'Merci beaucoup', 'Je vous remercie', 'C\'est gentil'],
  LOCATIONS: ['Je suis à', 'Je me trouve', 'Mon adresse est', 'Venez à'],
  CONFIRMATIONS: ['D\'accord', 'OK', 'C\'est bon', 'Parfait', 'Entendu'],
  URGENCY: ['Urgent', 'Pressé', 'Vite', 'Rapidement', 'C\'est urgent'],
};

// Validation des messages
export const validateMessage = (content: string): { isValid: boolean; error?: string } => {
  if (!content || content.trim().length === 0) {
    return { isValid: false, error: 'Le message ne peut pas être vide' };
  }
  
  if (content.length > 1000) {
    return { isValid: false, error: 'Le message ne peut pas dépasser 1000 caractères' };
  }
  
  // Vérifier les mots inappropriés (liste basique)
  const inappropriateWords = ['spam', 'scam', 'arnaque'];
  const hasInappropriateContent = inappropriateWords.some(word => 
    content.toLowerCase().includes(word)
  );
  
  if (hasInappropriateContent) {
    return { isValid: false, error: 'Le message contient du contenu inapproprié' };
  }
  
  return { isValid: true };
};

// Formatage des numéros de téléphone ivoiriens
export const formatIvoirianPhone = (phone: string): string => {
  // Supprimer tous les caractères non numériques
  const cleaned = phone.replace(/\D/g, '');
  
  // Format ivoirien : +225 XX XX XX XX XX
  if (cleaned.startsWith('225')) {
    const number = cleaned.substring(3);
    if (number.length === 10) {
      return `+225 ${number.substring(0, 2)} ${number.substring(2, 4)} ${number.substring(4, 6)} ${number.substring(6, 8)} ${number.substring(8, 10)}`;
    }
  } else if (cleaned.length === 10) {
    return `+225 ${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8, 10)}`;
  }
  
  return phone; // Retourner tel quel si format non reconnu
};

// Génération d'ID de chat basé sur la commande
export const generateChatId = (orderId: string): string => {
  return `chat_${orderId}`;
};

// Génération d'ID de message unique
export const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Formatage de l'heure pour l'affichage
export const formatMessageTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    const minutes = Math.floor(diffInHours * 60);
    return minutes <= 1 ? 'À l\'instant' : `Il y a ${minutes} min`;
  } else if (diffInHours < 24) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 48) {
    return `Hier ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

// Détection automatique du type de message
export const detectMessageType = (content: string): MessageType => {
  // Détecter les coordonnées GPS
  const gpsRegex = /(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/;
  if (gpsRegex.test(content)) {
    return MessageType.LOCATION;
  }
  
  // Détecter les URLs d'images
  const imageRegex = /\.(jpg|jpeg|png|gif|webp)$/i;
  if (imageRegex.test(content)) {
    return MessageType.IMAGE;
  }
  
  return MessageType.TEXT;
};

// Création d'un message système
export const createSystemMessage = (
  chatId: string,
  template: string,
  variables: Record<string, string> = {}
): ChatMessage => {
  let content = template;
  Object.entries(variables).forEach(([key, value]) => {
    content = content.replace(new RegExp(`{${key}}`, 'g'), value);
  });
  
  return {
    id: generateMessageId(),
    chatId,
    senderId: 'system',
    senderName: 'Système WALI',
    senderRole: ParticipantRole.SYSTEM,
    type: MessageType.SYSTEM,
    content,
    status: MessageStatus.DELIVERED,
    timestamp: new Date().toISOString(),
  };
};

// Suggestions de réponses rapides
export const getQuickReplies = (role: ParticipantRole, context?: string): string[] => {
  const baseReplies = {
    [ParticipantRole.CLIENT]: [
      'Merci !',
      'D\'accord',
      'Je vous attends',
      'Où êtes-vous ?',
      'Combien de temps encore ?',
    ],
    [ParticipantRole.DRIVER]: [
      'J\'arrive dans 5 minutes',
      'Je suis en route',
      'Pouvez-vous sortir ?',
      'Je suis devant',
      'Livraison terminée',
    ],
    [ParticipantRole.ADMIN]: [
      'Nous vérifions',
      'Problème résolu',
      'Merci de votre patience',
      'Contactez le support',
    ],
    [ParticipantRole.SYSTEM]: [],
  };
  
  return baseReplies[role] || [];
};
