import { io, Socket } from 'socket.io-client';
import {
  ChatConversation,
  ChatMessage,
  TypingIndicator,
  MessageType,
  MessageStatus,
  ParticipantRole,
  generateMessageId,
  generateChatId,
  createSystemMessage,
  SYSTEM_MESSAGES,
} from '@/lib/chat';

interface ChatServiceEvents {
  'message:new': (message: ChatMessage) => void;
  'message:status': (messageId: string, status: MessageStatus) => void;
  'typing:start': (indicator: TypingIndicator) => void;
  'typing:stop': (indicator: TypingIndicator) => void;
  'conversation:updated': (conversation: ChatConversation) => void;
  'user:online': (userId: string) => void;
  'user:offline': (userId: string) => void;
  'error': (error: string) => void;
}

class ChatService {
  private socket: Socket | null = null;
  private isConnected = false;
  private currentUserId: string | null = null;
  private currentUserRole: ParticipantRole | null = null;
  private eventListeners: Map<keyof ChatServiceEvents, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();

  // Données simulées pour le développement
  private mockConversations: Map<string, ChatConversation> = new Map();
  private mockMessages: Map<string, ChatMessage[]> = new Map();

  constructor() {
    this.initializeMockData();
  }

  /**
   * Initialise la connexion WebSocket
   */
  async connect(userId: string, userRole: ParticipantRole, token?: string): Promise<void> {
    if (this.isConnected && this.currentUserId === userId) {
      return;
    }

    this.currentUserId = userId;
    this.currentUserRole = userRole;

    try {
      // En mode développement, on simule la connexion
      if (process.env.NODE_ENV === 'development') {
        await this.simulateConnection();
        return;
      }

      // Configuration WebSocket pour production
      const socketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001';
      
      this.socket = io(socketUrl, {
        auth: {
          token,
          userId,
          userRole,
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
      });

      this.setupSocketListeners();
      
      await new Promise<void>((resolve, reject) => {
        this.socket!.on('connect', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('Chat WebSocket connecté');
          resolve();
        });

        this.socket!.on('connect_error', (error) => {
          console.error('Erreur de connexion WebSocket:', error);
          reject(error);
        });
      });

    } catch (error) {
      console.error('Erreur de connexion chat:', error);
      // Fallback en mode simulation
      await this.simulateConnection();
    }
  }

  /**
   * Déconnexion WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.currentUserId = null;
    this.currentUserRole = null;
    this.eventListeners.clear();
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();
  }

  /**
   * Envoie un message
   */
  async sendMessage(
    chatId: string,
    content: string,
    type: MessageType = MessageType.TEXT,
    metadata?: any
  ): Promise<ChatMessage> {
    if (!this.currentUserId || !this.currentUserRole) {
      throw new Error('Utilisateur non connecté');
    }

    const message: ChatMessage = {
      id: generateMessageId(),
      chatId,
      senderId: this.currentUserId,
      senderName: 'Utilisateur', // Sera mis à jour avec les vraies données
      senderRole: this.currentUserRole,
      type,
      content,
      metadata,
      status: MessageStatus.SENDING,
      timestamp: new Date().toISOString(),
    };

    try {
      if (this.socket && this.isConnected) {
        // Envoyer via WebSocket
        this.socket.emit('message:send', message);
      } else {
        // Mode simulation
        await this.simulateSendMessage(message);
      }

      return message;
    } catch (error) {
      message.status = MessageStatus.FAILED;
      throw error;
    }
  }

  /**
   * Rejoint une conversation
   */
  async joinConversation(chatId: string): Promise<ChatConversation> {
    try {
      if (this.socket && this.isConnected) {
        return new Promise((resolve, reject) => {
          this.socket!.emit('conversation:join', chatId, (response: any) => {
            if (response.success) {
              resolve(response.conversation);
            } else {
              reject(new Error(response.error));
            }
          });
        });
      } else {
        // Mode simulation
        return this.simulateJoinConversation(chatId);
      }
    } catch (error) {
      console.error('Erreur lors de la jointure de conversation:', error);
      throw error;
    }
  }

  /**
   * Quitte une conversation
   */
  leaveConversation(chatId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('conversation:leave', chatId);
    }
  }

  /**
   * Indique que l'utilisateur tape
   */
  startTyping(chatId: string): void {
    if (!this.currentUserId) return;

    if (this.socket && this.isConnected) {
      this.socket.emit('typing:start', {
        chatId,
        userId: this.currentUserId,
        userName: 'Utilisateur',
      });
    }

    // Auto-stop après 3 secondes
    const timeoutKey = `${chatId}_${this.currentUserId}`;
    if (this.typingTimeouts.has(timeoutKey)) {
      clearTimeout(this.typingTimeouts.get(timeoutKey)!);
    }

    const timeout = setTimeout(() => {
      this.stopTyping(chatId);
    }, 3000);

    this.typingTimeouts.set(timeoutKey, timeout);
  }

  /**
   * Arrête l'indicateur de frappe
   */
  stopTyping(chatId: string): void {
    if (!this.currentUserId) return;

    if (this.socket && this.isConnected) {
      this.socket.emit('typing:stop', {
        chatId,
        userId: this.currentUserId,
      });
    }

    const timeoutKey = `${chatId}_${this.currentUserId}`;
    if (this.typingTimeouts.has(timeoutKey)) {
      clearTimeout(this.typingTimeouts.get(timeoutKey)!);
      this.typingTimeouts.delete(timeoutKey);
    }
  }

  /**
   * Marque les messages comme lus
   */
  markMessagesAsRead(chatId: string, messageIds: string[]): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('messages:read', { chatId, messageIds });
    } else {
      // Mode simulation
      this.simulateMarkAsRead(chatId, messageIds);
    }
  }

  /**
   * Obtient l'historique des messages
   */
  async getMessageHistory(chatId: string, limit = 50, offset = 0): Promise<ChatMessage[]> {
    try {
      if (this.socket && this.isConnected) {
        return new Promise((resolve, reject) => {
          this.socket!.emit('messages:history', { chatId, limit, offset }, (response: any) => {
            if (response.success) {
              resolve(response.messages);
            } else {
              reject(new Error(response.error));
            }
          });
        });
      } else {
        // Mode simulation
        return this.simulateGetHistory(chatId, limit, offset);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      return [];
    }
  }

  /**
   * Crée une conversation pour une commande
   */
  async createConversationForOrder(orderId: string, orderNumber: string): Promise<ChatConversation> {
    const chatId = generateChatId(orderId);
    
    try {
      if (this.socket && this.isConnected) {
        return new Promise((resolve, reject) => {
          this.socket!.emit('conversation:create', { orderId, orderNumber }, (response: any) => {
            if (response.success) {
              resolve(response.conversation);
            } else {
              reject(new Error(response.error));
            }
          });
        });
      } else {
        // Mode simulation
        return this.simulateCreateConversation(orderId, orderNumber);
      }
    } catch (error) {
      console.error('Erreur lors de la création de conversation:', error);
      throw error;
    }
  }

  /**
   * Écoute les événements
   */
  on<K extends keyof ChatServiceEvents>(event: K, callback: ChatServiceEvents[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Supprime un écouteur d'événement
   */
  off<K extends keyof ChatServiceEvents>(event: K, callback: ChatServiceEvents[K]): void {
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
  private emit<K extends keyof ChatServiceEvents>(event: K, ...args: Parameters<ChatServiceEvents[K]>): void {
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

  // Méthodes de simulation pour le développement
  private async simulateConnection(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    this.isConnected = true;
    console.log('Chat simulé connecté');
  }

  private async simulateSendMessage(message: ChatMessage): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    message.status = MessageStatus.SENT;
    this.emit('message:new', message);
    
    // Simuler la livraison
    setTimeout(() => {
      message.status = MessageStatus.DELIVERED;
      this.emit('message:status', message.id, MessageStatus.DELIVERED);
    }, 500);

    // Ajouter à l'historique simulé
    if (!this.mockMessages.has(message.chatId)) {
      this.mockMessages.set(message.chatId, []);
    }
    this.mockMessages.get(message.chatId)!.push(message);

    // Simuler une réponse automatique du livreur
    if (message.senderRole === ParticipantRole.CLIENT) {
      setTimeout(() => {
        this.simulateDriverResponse(message.chatId);
      }, 2000);
    }
  }

  private async simulateJoinConversation(chatId: string): Promise<ChatConversation> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (this.mockConversations.has(chatId)) {
      return this.mockConversations.get(chatId)!;
    }

    // Créer une conversation simulée
    const conversation: ChatConversation = {
      id: chatId,
      orderId: chatId.replace('chat_', ''),
      orderNumber: `WAL-2024-${Math.random().toString().slice(-6)}`,
      participants: [
        {
          id: this.currentUserId!,
          name: 'Client Test',
          role: ParticipantRole.CLIENT,
          isOnline: true,
        },
        {
          id: 'driver_1',
          name: 'Mamadou Traoré',
          role: ParticipantRole.DRIVER,
          isOnline: true,
          phone: '+225 07 12 34 56 78',
        },
      ],
      messages: [],
      unreadCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.mockConversations.set(chatId, conversation);
    return conversation;
  }

  private simulateDriverResponse(chatId: string): void {
    const responses = [
      'Bonjour ! Je suis en route pour récupérer votre commande.',
      'J\'arrive dans 10 minutes au point de récupération.',
      'Colis récupéré, je me dirige vers vous maintenant.',
      'Je suis devant votre adresse.',
      'Merci d\'avoir choisi WALI Livraison !',
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    const driverMessage: ChatMessage = {
      id: generateMessageId(),
      chatId,
      senderId: 'driver_1',
      senderName: 'Mamadou Traoré',
      senderRole: ParticipantRole.DRIVER,
      type: MessageType.TEXT,
      content: randomResponse,
      status: MessageStatus.DELIVERED,
      timestamp: new Date().toISOString(),
    };

    this.emit('message:new', driverMessage);
    
    if (!this.mockMessages.has(chatId)) {
      this.mockMessages.set(chatId, []);
    }
    this.mockMessages.get(chatId)!.push(driverMessage);
  }

  private async simulateGetHistory(chatId: string, limit: number, offset: number): Promise<ChatMessage[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const messages = this.mockMessages.get(chatId) || [];
    return messages.slice(offset, offset + limit);
  }

  private simulateMarkAsRead(chatId: string, messageIds: string[]): void {
    const messages = this.mockMessages.get(chatId) || [];
    messages.forEach(message => {
      if (messageIds.includes(message.id)) {
        message.status = MessageStatus.READ;
        this.emit('message:status', message.id, MessageStatus.READ);
      }
    });
  }

  private async simulateCreateConversation(orderId: string, orderNumber: string): Promise<ChatConversation> {
    const chatId = generateChatId(orderId);
    const conversation = await this.simulateJoinConversation(chatId);
    conversation.orderNumber = orderNumber;
    
    // Ajouter un message système de bienvenue
    const welcomeMessage = createSystemMessage(
      chatId,
      SYSTEM_MESSAGES.CHAT_CREATED,
      { orderNumber }
    );
    
    if (!this.mockMessages.has(chatId)) {
      this.mockMessages.set(chatId, []);
    }
    this.mockMessages.get(chatId)!.unshift(welcomeMessage);
    
    return conversation;
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('message:new', (message: ChatMessage) => {
      this.emit('message:new', message);
    });

    this.socket.on('message:status', (data: { messageId: string; status: MessageStatus }) => {
      this.emit('message:status', data.messageId, data.status);
    });

    this.socket.on('typing:start', (indicator: TypingIndicator) => {
      this.emit('typing:start', indicator);
    });

    this.socket.on('typing:stop', (indicator: TypingIndicator) => {
      this.emit('typing:stop', indicator);
    });

    this.socket.on('user:online', (userId: string) => {
      this.emit('user:online', userId);
    });

    this.socket.on('user:offline', (userId: string) => {
      this.emit('user:offline', userId);
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('Chat WebSocket déconnecté');
    });

    this.socket.on('error', (error: any) => {
      console.error('Erreur WebSocket:', error);
      this.emit('error', error.message || 'Erreur de connexion');
    });
  }

  private initializeMockData(): void {
    // Initialiser quelques conversations de test
    // Cette méthode sera supprimée en production
  }

  // Getters
  get connected(): boolean {
    return this.isConnected;
  }

  get userId(): string | null {
    return this.currentUserId;
  }

  get userRole(): ParticipantRole | null {
    return this.currentUserRole;
  }
}

export const chatService = new ChatService();
