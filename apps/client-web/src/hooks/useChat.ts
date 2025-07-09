import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChatConversation,
  ChatMessage,
  TypingIndicator,
  MessageType,
  MessageStatus,
  ParticipantRole,
  generateChatId,
  validateMessage,
} from '@/lib/chat';
import { chatService } from '@/services/chat.service';
import { useWaliAuth } from './useWaliAuth';

interface UseChatReturn {
  // État
  conversations: ChatConversation[];
  currentConversation: ChatConversation | null;
  messages: ChatMessage[];
  typingUsers: TypingIndicator[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  sendMessage: (content: string, type?: MessageType, metadata?: any) => Promise<ChatMessage>;
  joinConversation: (chatId: string) => Promise<void>;
  leaveConversation: () => void;
  createConversationForOrder: (orderId: string, orderNumber: string) => Promise<ChatConversation>;
  startTyping: () => void;
  stopTyping: () => void;
  markAsRead: (messageIds: string[]) => void;
  loadMoreMessages: () => Promise<void>;
  
  // Utilitaires
  getUnreadCount: () => number;
  clearError: () => void;
  refreshConversation: () => Promise<void>;
}

export const useChat = (): UseChatReturn => {
  const { user } = useWaliAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  
  const messagesOffset = useRef(0);
  const isInitialized = useRef(false);

  // Initialisation de la connexion
  useEffect(() => {
    if (user && !isInitialized.current) {
      initializeChat();
      isInitialized.current = true;
    }

    return () => {
      if (isInitialized.current) {
        chatService.disconnect();
        isInitialized.current = false;
      }
    };
  }, [user]);

  // Initialisation du service de chat
  const initializeChat = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const userRole = user.role === 'CLIENT' ? ParticipantRole.CLIENT : 
                      user.role === 'DRIVER' ? ParticipantRole.DRIVER : 
                      ParticipantRole.CLIENT;

      await chatService.connect(user.id, userRole);
      setIsConnected(chatService.connected);

      // Configurer les écouteurs d'événements
      setupEventListeners();

    } catch (err: any) {
      setError(err.message || 'Erreur de connexion au chat');
      console.error('Erreur d\'initialisation du chat:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Configuration des écouteurs d'événements
  const setupEventListeners = useCallback(() => {
    // Nouveau message reçu
    chatService.on('message:new', (message: ChatMessage) => {
      setMessages(prev => {
        // Éviter les doublons
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, message].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });

      // Mettre à jour la conversation
      if (currentConversation && message.chatId === currentConversation.id) {
        setCurrentConversation(prev => prev ? {
          ...prev,
          lastMessage: message,
          updatedAt: message.timestamp,
          unreadCount: message.senderId !== user?.id ? prev.unreadCount + 1 : prev.unreadCount,
        } : null);
      }
    });

    // Statut de message mis à jour
    chatService.on('message:status', (messageId: string, status: MessageStatus) => {
      setMessages(prev => prev.map(message => 
        message.id === messageId ? { ...message, status } : message
      ));
    });

    // Indicateur de frappe
    chatService.on('typing:start', (indicator: TypingIndicator) => {
      if (indicator.userId !== user?.id) {
        setTypingUsers(prev => {
          const filtered = prev.filter(t => t.userId !== indicator.userId);
          return [...filtered, indicator];
        });
      }
    });

    chatService.on('typing:stop', (indicator: TypingIndicator) => {
      setTypingUsers(prev => prev.filter(t => t.userId !== indicator.userId));
    });

    // Utilisateur en ligne/hors ligne
    chatService.on('user:online', (userId: string) => {
      updateUserOnlineStatus(userId, true);
    });

    chatService.on('user:offline', (userId: string) => {
      updateUserOnlineStatus(userId, false);
    });

    // Erreurs
    chatService.on('error', (errorMessage: string) => {
      setError(errorMessage);
    });
  }, [currentConversation, user]);

  // Mise à jour du statut en ligne des utilisateurs
  const updateUserOnlineStatus = useCallback((userId: string, isOnline: boolean) => {
    setCurrentConversation(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        participants: prev.participants.map(participant =>
          participant.id === userId ? { ...participant, isOnline } : participant
        ),
      };
    });
  }, []);

  // Envoyer un message
  const sendMessage = useCallback(async (
    content: string, 
    type: MessageType = MessageType.TEXT, 
    metadata?: any
  ): Promise<ChatMessage> => {
    if (!currentConversation) {
      throw new Error('Aucune conversation active');
    }

    // Validation du message
    const validation = validateMessage(content);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    try {
      setError(null);
      const message = await chatService.sendMessage(currentConversation.id, content, type, metadata);
      
      // Arrêter l'indicateur de frappe
      chatService.stopTyping(currentConversation.id);
      
      return message;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi du message');
      throw err;
    }
  }, [currentConversation]);

  // Rejoindre une conversation
  const joinConversation = useCallback(async (chatId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const conversation = await chatService.joinConversation(chatId);
      setCurrentConversation(conversation);

      // Charger l'historique des messages
      messagesOffset.current = 0;
      const history = await chatService.getMessageHistory(chatId, 50, 0);
      setMessages(history);
      messagesOffset.current = history.length;
      setHasMoreMessages(history.length === 50);

      // Marquer les messages non lus comme lus
      const unreadMessages = history
        .filter(msg => msg.senderId !== user?.id && msg.status !== MessageStatus.READ)
        .map(msg => msg.id);
      
      if (unreadMessages.length > 0) {
        markAsRead(unreadMessages);
      }

    } catch (err: any) {
      setError(err.message || 'Erreur lors de la jointure de conversation');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Quitter la conversation actuelle
  const leaveConversation = useCallback(() => {
    if (currentConversation) {
      chatService.leaveConversation(currentConversation.id);
      setCurrentConversation(null);
      setMessages([]);
      setTypingUsers([]);
      messagesOffset.current = 0;
    }
  }, [currentConversation]);

  // Créer une conversation pour une commande
  const createConversationForOrder = useCallback(async (
    orderId: string, 
    orderNumber: string
  ): Promise<ChatConversation> => {
    try {
      setIsLoading(true);
      setError(null);

      const conversation = await chatService.createConversationForOrder(orderId, orderNumber);
      setConversations(prev => {
        const filtered = prev.filter(c => c.id !== conversation.id);
        return [conversation, ...filtered];
      });

      return conversation;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de conversation');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Commencer à taper
  const startTyping = useCallback(() => {
    if (currentConversation) {
      chatService.startTyping(currentConversation.id);
    }
  }, [currentConversation]);

  // Arrêter de taper
  const stopTyping = useCallback(() => {
    if (currentConversation) {
      chatService.stopTyping(currentConversation.id);
    }
  }, [currentConversation]);

  // Marquer comme lu
  const markAsRead = useCallback((messageIds: string[]) => {
    if (currentConversation) {
      chatService.markMessagesAsRead(currentConversation.id, messageIds);
      
      // Mettre à jour localement
      setMessages(prev => prev.map(message => 
        messageIds.includes(message.id) ? { ...message, status: MessageStatus.READ } : message
      ));

      // Réduire le compteur de non lus
      setCurrentConversation(prev => prev ? {
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - messageIds.length),
      } : null);
    }
  }, [currentConversation]);

  // Charger plus de messages
  const loadMoreMessages = useCallback(async () => {
    if (!currentConversation || !hasMoreMessages || isLoading) return;

    try {
      setIsLoading(true);
      const moreMessages = await chatService.getMessageHistory(
        currentConversation.id, 
        50, 
        messagesOffset.current
      );

      if (moreMessages.length > 0) {
        setMessages(prev => [...moreMessages, ...prev]);
        messagesOffset.current += moreMessages.length;
        setHasMoreMessages(moreMessages.length === 50);
      } else {
        setHasMoreMessages(false);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des messages');
    } finally {
      setIsLoading(false);
    }
  }, [currentConversation, hasMoreMessages, isLoading]);

  // Obtenir le nombre total de messages non lus
  const getUnreadCount = useCallback((): number => {
    return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  }, [conversations]);

  // Effacer l'erreur
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Actualiser la conversation
  const refreshConversation = useCallback(async () => {
    if (currentConversation) {
      await joinConversation(currentConversation.id);
    }
  }, [currentConversation, joinConversation]);

  return {
    // État
    conversations,
    currentConversation,
    messages,
    typingUsers,
    isConnected,
    isLoading,
    error,

    // Actions
    sendMessage,
    joinConversation,
    leaveConversation,
    createConversationForOrder,
    startTyping,
    stopTyping,
    markAsRead,
    loadMoreMessages,

    // Utilitaires
    getUnreadCount,
    clearError,
    refreshConversation,
  };
};

// Hook spécialisé pour une conversation spécifique
export const useChatConversation = (orderId: string) => {
  const chat = useChat();
  const chatId = generateChatId(orderId);

  useEffect(() => {
    if (chat.isConnected && orderId) {
      chat.joinConversation(chatId);
    }

    return () => {
      chat.leaveConversation();
    };
  }, [chat.isConnected, orderId, chatId]);

  return {
    ...chat,
    chatId,
  };
};
