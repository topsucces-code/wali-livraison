import { useState, useEffect, useCallback } from 'react';
import {
  WaliNotification,
  NotificationPreferences,
  NotificationType,
  NotificationPriority,
  filterNotifications,
  groupNotificationsByType,
} from '@/lib/notifications';
import { notificationService } from '@/services/notification.service';
import { useWaliAuth } from './useWaliAuth';

interface UseNotificationsReturn {
  // État
  notifications: WaliNotification[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  archiveNotification: (notificationId: string) => void;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  sendTestNotification: (type: NotificationType) => Promise<void>;
  
  // Filtres et utilitaires
  getFilteredNotifications: (filters: {
    isRead?: boolean;
    type?: NotificationType;
    priority?: NotificationPriority;
    dateFrom?: string;
    dateTo?: string;
  }) => WaliNotification[];
  getGroupedNotifications: () => Record<string, WaliNotification[]>;
  clearError: () => void;
  refreshNotifications: () => void;
}

export const useNotifications = (): UseNotificationsReturn => {
  const { user } = useWaliAuth();
  const [notifications, setNotifications] = useState<WaliNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialisation du service
  useEffect(() => {
    if (user) {
      initializeNotifications();
    }

    return () => {
      notificationService.disconnect();
    };
  }, [user]);

  // Initialisation des notifications
  const initializeNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Initialiser le service
      await notificationService.initialize(user.id);

      // Charger les données
      loadNotifications();
      loadPreferences();

      // Configurer les écouteurs d'événements
      setupEventListeners();

    } catch (err: any) {
      setError(err.message || 'Erreur d\'initialisation des notifications');
      console.error('Erreur d\'initialisation des notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Chargement des notifications
  const loadNotifications = useCallback(() => {
    if (!user) return;

    const userNotifications = notificationService.getNotifications(user.id);
    setNotifications(userNotifications);
    
    const unread = notificationService.getUnreadCount(user.id);
    setUnreadCount(unread);
  }, [user]);

  // Chargement des préférences
  const loadPreferences = useCallback(() => {
    if (!user) return;

    const userPreferences = notificationService.getPreferences(user.id);
    setPreferences(userPreferences);
  }, [user]);

  // Configuration des écouteurs d'événements
  const setupEventListeners = useCallback(() => {
    // Nouvelle notification reçue
    notificationService.on('notification:received', (notification: WaliNotification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Notification marquée comme lue
    notificationService.on('notification:read', (notificationId: string) => {
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    });

    // Notification supprimée
    notificationService.on('notification:deleted', (notificationId: string) => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId);
        return notification && !notification.isRead ? Math.max(0, prev - 1) : prev;
      });
    });

    // Préférences mises à jour
    notificationService.on('preferences:updated', (updatedPreferences: NotificationPreferences) => {
      setPreferences(updatedPreferences);
    });
  }, [notifications]);

  // Marquer comme lu
  const markAsRead = useCallback((notificationId: string) => {
    notificationService.markAsRead(notificationId);
  }, []);

  // Marquer tout comme lu
  const markAllAsRead = useCallback(() => {
    if (user) {
      notificationService.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ 
        ...n, 
        isRead: true, 
        readAt: new Date().toISOString() 
      })));
      setUnreadCount(0);
    }
  }, [user]);

  // Supprimer une notification
  const deleteNotification = useCallback((notificationId: string) => {
    notificationService.deleteNotification(notificationId);
  }, []);

  // Archiver une notification
  const archiveNotification = useCallback((notificationId: string) => {
    notificationService.archiveNotification(notificationId);
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, isArchived: true } : n
    ));
  }, []);

  // Mettre à jour les préférences
  const updatePreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
    if (user) {
      notificationService.updatePreferences(user.id, newPreferences);
    }
  }, [user]);

  // Envoyer une notification de test
  const sendTestNotification = useCallback(async (type: NotificationType) => {
    if (!user) return;

    try {
      setError(null);
      
      const testData = {
        orderNumber: 'WAL-TEST-001',
        driverName: 'Mamadou Traoré',
        amount: 2500,
      };

      await notificationService.sendNotification(user.id, type, testData);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi de la notification test');
    }
  }, [user]);

  // Filtrer les notifications
  const getFilteredNotifications = useCallback((filters: {
    isRead?: boolean;
    type?: NotificationType;
    priority?: NotificationPriority;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    return filterNotifications(notifications, filters);
  }, [notifications]);

  // Grouper les notifications par type
  const getGroupedNotifications = useCallback(() => {
    return groupNotificationsByType(notifications);
  }, [notifications]);

  // Effacer l'erreur
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Actualiser les notifications
  const refreshNotifications = useCallback(() => {
    loadNotifications();
    loadPreferences();
  }, [loadNotifications, loadPreferences]);

  return {
    // État
    notifications,
    unreadCount,
    preferences,
    isLoading,
    error,

    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    archiveNotification,
    updatePreferences,
    sendTestNotification,

    // Filtres et utilitaires
    getFilteredNotifications,
    getGroupedNotifications,
    clearError,
    refreshNotifications,
  };
};

// Hook spécialisé pour les notifications de commande
export const useOrderNotifications = (orderId: string) => {
  const { notifications, ...rest } = useNotifications();
  
  const orderNotifications = notifications.filter(n => 
    n.data?.orderId === orderId
  );

  return {
    ...rest,
    notifications: orderNotifications,
    orderNotifications,
  };
};

// Hook pour les notifications en temps réel
export const useRealtimeNotifications = () => {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [latestNotification, setLatestNotification] = useState<WaliNotification | null>(null);

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (!latest.isRead) {
        setLatestNotification(latest);
        
        // Auto-masquer après 5 secondes
        const timer = setTimeout(() => {
          setLatestNotification(null);
        }, 5000);

        return () => clearTimeout(timer);
      }
    }
  }, [notifications]);

  const dismissLatest = useCallback(() => {
    if (latestNotification) {
      markAsRead(latestNotification.id);
      setLatestNotification(null);
    }
  }, [latestNotification, markAsRead]);

  return {
    latestNotification,
    unreadCount,
    dismissLatest,
  };
};
