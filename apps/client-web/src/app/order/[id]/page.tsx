'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  MapPin, 
  Clock, 
  Phone, 
  User, 
  Truck,
  CheckCircle,
  AlertCircle,
  Navigation,
  MessageCircle,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { 
  Order,
  OrderStatus,
  getOrderStatusLabel,
  getOrderStatusColor
} from '@/lib/orders';
import { useWaliOrders } from '@/hooks/useWaliOrders';
import { OrderTrackingMap } from '@/components/maps/OrderTrackingMap';
import { ChatInterface } from '@/components/chat/ChatInterface';

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { currentOrder, tracking, getOrderById, getTracking, isLoading, error } = useWaliOrders();
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (orderId) {
      loadOrderData();
      
      // Actualisation automatique toutes les 30 secondes pour les commandes actives
      const interval = setInterval(() => {
        if (currentOrder && isActiveOrder(currentOrder.status)) {
          getTracking(orderId);
        }
      }, 30000);
      
      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [orderId]);

  const loadOrderData = async () => {
    try {
      await getOrderById(orderId);
      await getTracking(orderId);
    } catch (error) {
      console.error('Erreur de chargement:', error);
    }
  };

  const isActiveOrder = (status: OrderStatus): boolean => {
    return [
      OrderStatus.PENDING,
      OrderStatus.ASSIGNED,
      OrderStatus.ACCEPTED,
      OrderStatus.PICKUP_IN_PROGRESS,
      OrderStatus.PICKED_UP,
      OrderStatus.DELIVERY_IN_PROGRESS,
    ].includes(status);
  };

  const getStatusProgress = (status: OrderStatus): number => {
    const statusOrder = [
      OrderStatus.PENDING,
      OrderStatus.ASSIGNED,
      OrderStatus.ACCEPTED,
      OrderStatus.PICKUP_IN_PROGRESS,
      OrderStatus.PICKED_UP,
      OrderStatus.DELIVERY_IN_PROGRESS,
      OrderStatus.DELIVERED,
    ];
    
    const currentIndex = statusOrder.indexOf(status);
    return currentIndex >= 0 ? ((currentIndex + 1) / statusOrder.length) * 100 : 0;
  };

  const getStatusSteps = (currentStatus: OrderStatus) => {
    const steps = [
      { status: OrderStatus.PENDING, label: 'Commande créée', icon: Package },
      { status: OrderStatus.ACCEPTED, label: 'Livreur assigné', icon: User },
      { status: OrderStatus.PICKUP_IN_PROGRESS, label: 'En route vers récupération', icon: Navigation },
      { status: OrderStatus.PICKED_UP, label: 'Colis récupéré', icon: CheckCircle },
      { status: OrderStatus.DELIVERY_IN_PROGRESS, label: 'En cours de livraison', icon: Truck },
      { status: OrderStatus.DELIVERED, label: 'Livré', icon: CheckCircle },
    ];

    const currentIndex = steps.findIndex(step => step.status === currentStatus);
    
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }));
  };

  if (isLoading && !currentOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la commande...</p>
        </div>
      </div>
    );
  }

  if (error || !currentOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Commande non trouvée</h1>
          <p className="text-gray-600 mb-4">{error || 'Cette commande n\'existe pas ou a été supprimée.'}</p>
          <Button asChild>
            <Link href="/wali-dashboard">Retour au dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const statusSteps = getStatusSteps(currentOrder.status);
  const progress = getStatusProgress(currentOrder.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center space-x-4 mb-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/wali-dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Link>
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">
                Commande {currentOrder.orderNumber}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className={getOrderStatusColor(currentOrder.status)}>
                {getOrderStatusLabel(currentOrder.status)}
              </Badge>
              <span className="text-sm text-gray-500">
                Créée le {new Date(currentOrder.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadOrderData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Carte de suivi en temps réel */}
        {currentOrder.driverId && isActiveOrder(currentOrder.status) && (
          <OrderTrackingMap
            order={currentOrder}
            driverLocation={tracking ? {
              lat: tracking.currentLocation.lat,
              lng: tracking.currentLocation.lng,
              timestamp: tracking.currentLocation.timestamp,
            } : undefined}
            onRefresh={loadOrderData}
            className="mb-8"
          />
        )}

        {/* Progression */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Suivi de livraison</CardTitle>
            <CardDescription>
              Progression de votre commande en temps réel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">

              {/* Barre de progression */}
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progression</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              {/* Étapes détaillées */}
              <div className="space-y-4">
                {statusSteps.map((step, index) => {
                  const IconComponent = step.icon;
                  return (
                    <div key={step.status} className="flex items-center space-x-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed
                          ? 'bg-green-100 text-green-600'
                          : step.current
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${
                          step.completed || step.current ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {step.label}
                        </p>
                        {step.current && tracking && (
                          <p className="text-sm text-blue-600">
                            Arrivée estimée dans {tracking.duration} minutes
                          </p>
                        )}
                      </div>
                      {step.completed && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Détails de la commande */}
          <div className="space-y-6">
            
            {/* Adresses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Adresses</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Récupération */}
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">📍 Récupération</h4>
                  <p className="text-sm text-green-800">
                    <strong>{currentOrder.pickupAddress.label}</strong><br />
                    {currentOrder.pickupAddress.street}<br />
                    {currentOrder.pickupAddress.district}, {currentOrder.pickupAddress.city}
                  </p>
                  {currentOrder.pickupAddress.contactName && (
                    <p className="text-sm text-green-700 mt-2">
                      Contact: {currentOrder.pickupAddress.contactName}
                      {currentOrder.pickupAddress.contactPhone && (
                        <span> • {currentOrder.pickupAddress.contactPhone}</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Livraison */}
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">🎯 Livraison</h4>
                  <p className="text-sm text-blue-800">
                    <strong>{currentOrder.deliveryAddress.label}</strong><br />
                    {currentOrder.deliveryAddress.street}<br />
                    {currentOrder.deliveryAddress.district}, {currentOrder.deliveryAddress.city}
                  </p>
                  {currentOrder.deliveryAddress.contactName && (
                    <p className="text-sm text-blue-700 mt-2">
                      Contact: {currentOrder.deliveryAddress.contactName}
                      {currentOrder.deliveryAddress.contactPhone && (
                        <span> • {currentOrder.deliveryAddress.contactPhone}</span>
                      )}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Articles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Articles</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentOrder.items.map((item, index) => (
                    <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>Qté: {item.quantity}</span>
                            <span>Poids: {item.weight}kg</span>
                            {item.fragile && (
                              <Badge variant="outline" className="text-xs">Fragile</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informations livreur et actions */}
          <div className="space-y-6">

            {/* Chat avec le livreur */}
            {currentOrder.driverId && isActiveOrder(currentOrder.status) && (
              <ChatInterface
                orderId={currentOrder.id}
                orderNumber={currentOrder.orderNumber}
                compact={true}
              />
            )}

            {/* Livreur */}
            {currentOrder.driverId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Votre livreur</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{currentOrder.driverName}</h4>
                      <p className="text-sm text-gray-600">{currentOrder.driverPhone}</p>
                    </div>
                  </div>

                  {currentOrder.vehicleInfo && (
                    <div className="p-3 bg-gray-50 rounded-lg mb-4">
                      <h5 className="font-medium mb-2">🚗 Véhicule</h5>
                      <p className="text-sm text-gray-600">
                        {currentOrder.vehicleInfo.brand} {currentOrder.vehicleInfo.model}<br />
                        Plaque: {currentOrder.vehicleInfo.registrationNumber}
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1">
                      <Phone className="h-4 w-4 mr-2" />
                      Appeler
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Résumé financier */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Résumé</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Prix */}
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">💰 Prix</h4>
                  <div className="space-y-1 text-sm">
                    {currentOrder.pricing.breakdown.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-blue-700">{item.label}</span>
                        <span className="text-blue-800">{item.amount} FCFA</span>
                      </div>
                    ))}
                    <div className="border-t border-blue-200 pt-1 mt-2 flex justify-between font-medium">
                      <span className="text-blue-900">Total</span>
                      <span className="text-blue-900">{currentOrder.pricing.totalPrice} FCFA</span>
                    </div>
                  </div>
                </div>

                {/* Informations supplémentaires */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Priorité:</span>
                    <span className="font-medium">{currentOrder.priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paiement:</span>
                    <span className="font-medium">{currentOrder.paymentMethod}</span>
                  </div>
                  {currentOrder.estimatedDeliveryTime && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Livraison estimée:</span>
                      <span className="font-medium">
                        {new Date(currentOrder.estimatedDeliveryTime).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {currentOrder.notes && (
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <h5 className="font-medium text-yellow-900 mb-1">📝 Notes</h5>
                    <p className="text-sm text-yellow-800">{currentOrder.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            {isActiveOrder(currentOrder.status) && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full">
                      Modifier la commande
                    </Button>
                    <Button variant="destructive" className="w-full">
                      Annuler la commande
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
