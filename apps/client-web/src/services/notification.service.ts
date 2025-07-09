import {
  WaliNotification,
  NotificationPreferences,
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  createNotification,
  isInQuietHours,
  DEFAULT_NOTIFICATION_PREFERENCES,
  isValidPushToken,
  isValidIvoirianPhone,
  isValidEmail,
} from '@/lib/notifications';

interface NotificationServiceEvents {
  'notification:received': (notification: WaliNotification) => void;
  'notification:read': (notificationId: string) => void;
  'notification:deleted': (notificationId: string) => void;
  'preferences:updated': (preferences: NotificationPreferences) => void;
}

class NotificationService {
  private notifications: Map<string, WaliNotification> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();
  private eventListeners: Map<keyof NotificationServiceEvents, Function[]> = new Map();
  private pushRegistration: ServiceWorkerRegistration | null = null;
  private currentUserId: string | null = null;

  constructor() {
    this.initializeMockData();
    this.initializePushNotifications();
  }

  /**
   * Initialise les notifications push
   */
  private async initializePushNotifications(): Promise<void> {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        this.pushRegistration = registration;
        console.log('Service Worker enregistré pour les notifications push');
      } catch (error) {
        console.error('Erreur d\'enregistrement du Service Worker:', error);
      }
    }
  }

  /**
   * Demande la permission pour les notifications
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Ce navigateur ne supporte pas les notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  /**
   * Enregistre un token push
   */
  async registerPushToken(userId: string): Promise<string | null> {
    if (!this.pushRegistration) {
      console.warn('Service Worker non disponible');
      return null;
    }

    try {
      const subscription = await this.pushRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        ),
      });

      const token = JSON.stringify(subscription);
      
      // Sauvegarder le token dans les préférences
      const preferences = this.getPreferences(userId);
      preferences.pushToken = token;
      this.updatePreferences(userId, preferences);

      return token;
    } catch (error) {
      console.error('Erreur d\'enregistrement push:', error);
      return null;
    }
  }

  /**
   * Envoie une notification
   */
  async sendNotification(
    userId: string,
    type: NotificationType,
    data: any = {},
    customMessage?: string
  ): Promise<WaliNotification> {
    const notification = createNotification(userId, type, data, customMessage);
    const preferences = this.getPreferences(userId);

    // Vérifier les heures silencieuses pour les notifications non urgentes
    if (notification.priority !== NotificationPriority.URGENT && isInQuietHours(preferences)) {
      console.log('Notification différée (heures silencieuses)');
      // En production, on pourrait programmer la notification pour plus tard
    }

    // Sauvegarder la notification
    this.notifications.set(notification.id, notification);

    // Envoyer selon les canaux configurés
    const channels = preferences.channels[type] || [];
    
    for (const channel of channels) {
      try {
        await this.sendToChannel(notification, channel, preferences);
      } catch (error) {
        console.error(`Erreur envoi ${channel}:`, error);
      }
    }

    // Émettre l'événement
    this.emit('notification:received', notification);

    return notification;
  }

  /**
   * Envoie une notification via un canal spécifique
   */
  private async sendToChannel(
    notification: WaliNotification,
    channel: NotificationChannel,
    preferences: NotificationPreferences
  ): Promise<void> {
    switch (channel) {
      case NotificationChannel.PUSH:
        await this.sendPushNotification(notification, preferences);
        break;
      case NotificationChannel.EMAIL:
        await this.sendEmailNotification(notification, preferences);
        break;
      case NotificationChannel.SMS:
        await this.sendSMSNotification(notification, preferences);
        break;
      case NotificationChannel.IN_APP:
        // Les notifications in-app sont gérées par l'événement
        break;
    }
  }

  /**
   * Envoie une notification push
   */
  private async sendPushNotification(
    notification: WaliNotification,
    preferences: NotificationPreferences
  ): Promise<void> {
    if (!preferences.pushToken || !isValidPushToken(preferences.pushToken)) {
      return;
    }

    // En mode développement, on simule avec une notification navigateur
    if (process.env.NODE_ENV === 'development') {
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icons/wali-logo-192.png',
          badge: '/icons/wali-badge-72.png',
          tag: notification.id,
          data: notification.data,
          requireInteraction: notification.priority === NotificationPriority.URGENT,
        });
      }
      return;
    }

    // En production, envoyer via l'API push
    try {
      const response = await fetch('/api/notifications/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: preferences.pushToken,
          notification: {
            title: notification.title,
            body: notification.message,
            icon: '/icons/wali-logo-192.png',
            data: notification.data,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur envoi push notification');
      }
    } catch (error) {
      console.error('Erreur push notification:', error);
    }
  }

  /**
   * Envoie une notification par email
   */
  private async sendEmailNotification(
    notification: WaliNotification,
    preferences: NotificationPreferences
  ): Promise<void> {
    if (!preferences.emailAddress || !isValidEmail(preferences.emailAddress)) {
      return;
    }

    // En mode développement, on simule
    if (process.env.NODE_ENV === 'development') {
      console.log(`📧 Email simulé vers ${preferences.emailAddress}:`, {
        subject: notification.title,
        body: notification.message,
      });
      return;
    }

    // En production, envoyer via l'API email
    try {
      const response = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: preferences.emailAddress,
          subject: notification.title,
          body: notification.message,
          data: notification.data,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur envoi email');
      }
    } catch (error) {
      console.error('Erreur email notification:', error);
    }
  }

  /**
   * Envoie une notification par SMS
   */
  private async sendSMSNotification(
    notification: WaliNotification,
    preferences: NotificationPreferences
  ): Promise<void> {
    if (!preferences.phoneNumber || !isValidIvoirianPhone(preferences.phoneNumber)) {
      return;
    }

    // En mode développement, on simule
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 SMS simulé vers ${preferences.phoneNumber}:`, {
        message: `${notification.title}: ${notification.message}`,
      });
      return;
    }

    // En production, envoyer via l'API SMS
    try {
      const response = await fetch('/api/notifications/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: preferences.phoneNumber,
          message: `WALI: ${notification.title} - ${notification.message}`,
          data: notification.data,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur envoi SMS');
      }
    } catch (error) {
      console.error('Erreur SMS notification:', error);
    }
  }

  /**
   * Marque une notification comme lue
   */
  markAsRead(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (notification && !notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date().toISOString();
      this.emit('notification:read', notificationId);
    }
  }

  /**
   * Marque toutes les notifications comme lues
   */
  markAllAsRead(userId: string): void {
    for (const notification of this.notifications.values()) {
      if (notification.userId === userId && !notification.isRead) {
        this.markAsRead(notification.id);
      }
    }
  }

  /**
   * Supprime une notification
   */
  deleteNotification(notificationId: string): void {
    if (this.notifications.delete(notificationId)) {
      this.emit('notification:deleted', notificationId);
    }
  }

  /**
   * Archive une notification
   */
  archiveNotification(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.isArchived = true;
    }
  }

  /**
   * Obtient les notifications d'un utilisateur
   */
  getNotifications(userId: string, includeArchived = false): WaliNotification[] {
    const userNotifications = Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .filter(n => includeArchived || !n.isArchived)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return userNotifications;
  }

  /**
   * Obtient le nombre de notifications non lues
   */
  getUnreadCount(userId: string): number {
    return this.getNotifications(userId).filter(n => !n.isRead).length;
  }

  /**
   * Obtient les préférences de notification
   */
  getPreferences(userId: string): NotificationPreferences {
    if (!this.preferences.has(userId)) {
      this.preferences.set(userId, {
        userId,
        ...DEFAULT_NOTIFICATION_PREFERENCES,
      });
    }
    return this.preferences.get(userId)!;
  }

  /**
   * Met à jour les préférences de notification
   */
  updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): void {
    const current = this.getPreferences(userId);
    const updated = { ...current, ...preferences };
    this.preferences.set(userId, updated);
    this.emit('preferences:updated', updated);
  }

  /**
   * Écoute les événements
   */
  on<K extends keyof NotificationServiceEvents>(event: K, callback: NotificationServiceEvents[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Supprime un écouteur d'événement
   */
  off<K extends keyof NotificationServiceEvents>(event: K, callback: NotificationServiceEvents[K]): void {
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
  private emit<K extends keyof NotificationServiceEvents>(
    event: K, 
    ...args: Parameters<NotificationServiceEvents[K]>
  ): void {
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
   * Utilitaire pour convertir la clé VAPID
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Initialise des données de test
   */
  private initializeMockData(): void {
    // Créer quelques notifications de test
    if (process.env.NODE_ENV === 'development') {
      // Cette méthode sera supprimée en production
    }
  }

  /**
   * Nettoie les notifications expirées
   */
  cleanupExpiredNotifications(): void {
    const now = new Date().toISOString();
    for (const [id, notification] of this.notifications.entries()) {
      if (notification.expiresAt && notification.expiresAt < now) {
        this.notifications.delete(id);
      }
    }
  }

  /**
   * Initialise le service pour un utilisateur
   */
  async initialize(userId: string): Promise<void> {
    this.currentUserId = userId;
    
    // Demander la permission pour les notifications
    await this.requestPermission();
    
    // Enregistrer le token push si possible
    await this.registerPushToken(userId);
    
    // Nettoyer les notifications expirées
    this.cleanupExpiredNotifications();
  }

  /**
   * Déconnecte le service
   */
  disconnect(): void {
    this.currentUserId = null;
    this.eventListeners.clear();
  }
}

export const notificationService = new NotificationService();
