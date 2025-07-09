'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ExternalLink } from 'lucide-react';
import {
  WaliNotification,
  NOTIFICATION_ICONS,
  NOTIFICATION_COLORS,
  formatNotificationTime,
} from '@/lib/notifications';
import { useRealtimeNotifications } from '@/hooks/useNotifications';

interface NotificationToastProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoHide?: boolean;
  hideDelay?: number;
}

export function NotificationToast({ 
  position = 'top-right',
  autoHide = true,
  hideDelay = 5000 
}: NotificationToastProps) {
  const { latestNotification, dismissLatest } = useRealtimeNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Gestion de l'affichage
  useEffect(() => {
    if (latestNotification) {
      setIsVisible(true);
      setIsAnimating(true);
      
      // Animation d'entrée
      const animationTimer = setTimeout(() => {
        setIsAnimating(false);
      }, 300);

      // Auto-masquage
      let hideTimer: NodeJS.Timeout;
      if (autoHide) {
        hideTimer = setTimeout(() => {
          handleHide();
        }, hideDelay);
      }

      return () => {
        clearTimeout(animationTimer);
        if (hideTimer) clearTimeout(hideTimer);
      };
    } else {
      setIsVisible(false);
    }
  }, [latestNotification, autoHide, hideDelay]);

  const handleHide = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsAnimating(false);
      dismissLatest();
    }, 300);
  };

  const handleClick = () => {
    if (latestNotification?.data?.actionUrl) {
      window.location.href = latestNotification.data.actionUrl;
    } else if (latestNotification?.data?.orderId) {
      window.location.href = `/order/${latestNotification.data.orderId}`;
    }
    handleHide();
  };

  if (!isVisible || !latestNotification) {
    return null;
  }

  const icon = NOTIFICATION_ICONS[latestNotification.type];
  const colorClass = NOTIFICATION_COLORS[latestNotification.priority];

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  const animationClasses = {
    'top-right': isAnimating ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100',
    'top-left': isAnimating ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100',
    'bottom-right': isAnimating ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100',
    'bottom-left': isAnimating ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100',
  };

  return (
    <div className={`fixed z-50 ${positionClasses[position]} max-w-sm w-full`}>
      <Card 
        className={`shadow-lg border-l-4 ${
          latestNotification.priority === 'URGENT' ? 'border-l-red-500' : 'border-l-blue-500'
        } transform transition-all duration-300 ease-in-out ${animationClasses[position]}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            
            {/* Icône */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
              <span className="text-sm">{icon}</span>
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    {latestNotification.title}
                  </h4>
                  <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                    {latestNotification.message}
                  </p>
                  
                  {/* Métadonnées */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {formatNotificationTime(latestNotification.createdAt)}
                    </span>
                    
                    {latestNotification.data?.orderNumber && (
                      <Badge variant="outline" className="text-xs">
                        {latestNotification.data.orderNumber}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Bouton fermer */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleHide}
                  className="flex-shrink-0 ml-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 mt-3">
                {(latestNotification.data?.actionUrl || latestNotification.data?.orderId) && (
                  <Button
                    size="sm"
                    onClick={handleClick}
                    className="text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Voir détails
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={dismissLatest}
                  className="text-xs"
                >
                  Marquer comme lu
                </Button>
              </div>
            </div>
          </div>

          {/* Barre de progression pour l'auto-masquage */}
          {autoHide && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-blue-500 h-1 rounded-full transition-all duration-100 ease-linear"
                  style={{
                    animation: `shrink ${hideDelay}ms linear`,
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// Composant pour afficher plusieurs toasts
export function NotificationToastContainer() {
  return (
    <>
      <NotificationToast position="top-right" />
    </>
  );
}
