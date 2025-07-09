'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  BellOff, 
  Check, 
  CheckCheck, 
  Trash2, 
  Archive,
  Settings,
  Filter,
  RefreshCw,
  X
} from 'lucide-react';
import {
  WaliNotification,
  NotificationType,
  NotificationPriority,
  NOTIFICATION_ICONS,
  NOTIFICATION_COLORS,
  formatNotificationTime,
} from '@/lib/notifications';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationCenterProps {
  className?: string;
  compact?: boolean;
}

export function NotificationCenter({ className = '', compact = false }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    preferences,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    archiveNotification,
    getFilteredNotifications,
    getGroupedNotifications,
    clearError,
    refreshNotifications,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: undefined as NotificationType | undefined,
    priority: undefined as NotificationPriority | undefined,
    isRead: undefined as boolean | undefined,
  });

  // Filtrer les notifications selon l'onglet actif
  const getTabNotifications = (tab: string): WaliNotification[] => {
    let baseNotifications = notifications;

    switch (tab) {
      case 'unread':
        baseNotifications = notifications.filter(n => !n.isRead);
        break;
      case 'orders':
        baseNotifications = notifications.filter(n => 
          n.type === NotificationType.ORDER_STATUS ||
          n.type === NotificationType.DRIVER_ASSIGNED ||
          n.type === NotificationType.DRIVER_ARRIVED ||
          n.type === NotificationType.DELIVERY_COMPLETED
        );
        break;
      case 'messages':
        baseNotifications = notifications.filter(n => n.type === NotificationType.NEW_MESSAGE);
        break;
      case 'payments':
        baseNotifications = notifications.filter(n => 
          n.type === NotificationType.PAYMENT_REQUIRED ||
          n.type === NotificationType.PAYMENT_CONFIRMED
        );
        break;
      default:
        baseNotifications = notifications;
    }

    // Appliquer les filtres supplémentaires
    return getFilteredNotifications({
      ...filters,
    }).filter(n => baseNotifications.includes(n));
  };

  const handleNotificationClick = (notification: WaliNotification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Navigation vers l'action associée
    if (notification.data?.actionUrl) {
      window.location.href = notification.data.actionUrl;
    } else if (notification.data?.orderId) {
      window.location.href = `/order/${notification.data.orderId}`;
    }
  };

  const renderNotification = (notification: WaliNotification) => {
    const icon = NOTIFICATION_ICONS[notification.type];
    const colorClass = NOTIFICATION_COLORS[notification.priority];

    return (
      <div
        key={notification.id}
        className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
          !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
        }`}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="flex items-start space-x-3">
          
          {/* Icône */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
            <span className="text-lg">{icon}</span>
          </div>

          {/* Contenu */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                  {notification.title}
                </h4>
                <p className={`text-sm mt-1 ${!notification.isRead ? 'text-gray-800' : 'text-gray-600'}`}>
                  {notification.message}
                </p>
                
                {/* Métadonnées */}
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-xs text-gray-500">
                    {formatNotificationTime(notification.createdAt)}
                  </span>
                  
                  {notification.data?.orderNumber && (
                    <Badge variant="outline" className="text-xs">
                      {notification.data.orderNumber}
                    </Badge>
                  )}
                  
                  <Badge className={`text-xs ${colorClass}`}>
                    {notification.priority}
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-1 ml-4">
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                    title="Marquer comme lu"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    archiveNotification(notification.id);
                  }}
                  title="Archiver"
                >
                  <Archive className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const tabNotifications = getTabNotifications(activeTab);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Centre de notifications WALI Livraison
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={refreshNotifications}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Tout lire
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        
        {/* Erreur */}
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200 flex items-center justify-between">
            <span className="text-sm text-red-600">{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Filtres */}
        {showFilters && (
          <div className="p-4 bg-gray-50 border-b">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <select
                  className="w-full mt-1 p-2 border rounded"
                  value={filters.type || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    type: e.target.value as NotificationType || undefined
                  }))}
                >
                  <option value="">Tous les types</option>
                  {Object.values(NotificationType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Priorité</label>
                <select
                  className="w-full mt-1 p-2 border rounded"
                  value={filters.priority || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    priority: e.target.value as NotificationPriority || undefined
                  }))}
                >
                  <option value="">Toutes les priorités</option>
                  {Object.values(NotificationPriority).map(priority => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Statut</label>
                <select
                  className="w-full mt-1 p-2 border rounded"
                  value={filters.isRead === undefined ? '' : filters.isRead.toString()}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    isRead: e.target.value === '' ? undefined : e.target.value === 'true'
                  }))}
                >
                  <option value="">Tous</option>
                  <option value="false">Non lues</option>
                  <option value="true">Lues</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-5 rounded-none border-b">
            <TabsTrigger value="all">
              Toutes ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Non lues ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="orders">
              Commandes
            </TabsTrigger>
            <TabsTrigger value="messages">
              Messages
            </TabsTrigger>
            <TabsTrigger value="payments">
              Paiements
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <div className={`${compact ? 'max-h-96' : 'max-h-[600px]'} overflow-y-auto`}>
              
              {/* Liste des notifications */}
              {tabNotifications.length > 0 ? (
                <div>
                  {tabNotifications.map(renderNotification)}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <BellOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucune notification
                  </h3>
                  <p className="text-gray-600">
                    {activeTab === 'unread' 
                      ? 'Toutes vos notifications sont lues !' 
                      : 'Vous n\'avez pas encore de notifications.'}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
