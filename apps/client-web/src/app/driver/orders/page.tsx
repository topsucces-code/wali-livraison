'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  MapPin, 
  Clock, 
  DollarSign, 
  Navigation, 
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Phone,
  MessageCircle,
  ArrowLeft,
  Truck
} from 'lucide-react';
import { 
  Order,
  OrderStatus,
  VehicleType,
  getOrderStatusLabel,
  getOrderStatusColor,
  calculateDistance
} from '@/lib/orders';
import { useWaliOrders, useDriverOrders } from '@/hooks/useWaliOrders';
import { useWaliAuth } from '@/hooks/useWaliAuth';
import { useDriver } from '@/hooks/useDriver';

export default function DriverOrdersPage() {
  const router = useRouter();
  const { user, isDriver } = useWaliAuth();
  const { profile } = useDriver();
  const { orders, acceptOrder, updateOrderStatus, getOrders, isLoading, error } = useWaliOrders();
  const { availableOrders, getAvailableOrders, isLoading: loadingAvailable } = useDriverOrders();
  
  const [activeTab, setActiveTab] = useState('available');
  const [refreshing, setRefreshing] = useState(false);

  // Redirection si pas livreur
  useEffect(() => {
    if (user && !isDriver) {
      router.push('/wali-dashboard');
      return;
    }
    
    if (profile && profile.status !== 'VERIFIED') {
      router.push('/driver/status');
      return;
    }
  }, [user, isDriver, profile, router]);

  // Charger les données
  useEffect(() => {
    if (profile?.vehicle?.type) {
      loadData();
    }
  }, [profile?.vehicle?.type]);

  const loadData = async () => {
    try {
      await Promise.all([
        getOrders(),
        profile?.vehicle?.type && getAvailableOrders(profile.vehicle.type as VehicleType)
      ]);
    } catch (error) {
      console.error('Erreur de chargement:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await acceptOrder(orderId);
      alert('Commande acceptée avec succès !');
      await loadData(); // Recharger les données
    } catch (error) {
      console.error('Erreur d\'acceptation:', error);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status);
      alert('Statut mis à jour !');
    } catch (error) {
      console.error('Erreur de mise à jour:', error);
    }
  };

  const getDistanceText = (order: Order): string => {
    const distance = calculateDistance(order.pickupAddress, order.deliveryAddress);
    return `${distance.toFixed(1)} km`;
  };

  const getEarningsText = (order: Order): string => {
    // Estimation des gains livreur (70% du prix total)
    const earnings = Math.round(order.pricing.totalPrice * 0.7);
    return `${earnings} FCFA`;
  };

  const myOrders = orders.filter(order => order.driverId === user?.id);
  const activeOrders = myOrders.filter(order => 
    [OrderStatus.ACCEPTED, OrderStatus.PICKUP_IN_PROGRESS, OrderStatus.PICKED_UP, OrderStatus.DELIVERY_IN_PROGRESS].includes(order.status)
  );
  const completedOrders = myOrders.filter(order => 
    [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.FAILED].includes(order.status)
  );

  if (!profile || profile.status !== 'VERIFIED') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Compte en cours de vérification</h1>
          <p className="text-gray-600 mb-4">Votre compte doit être vérifié avant d'accepter des commandes.</p>
          <Button asChild>
            <Link href="/driver/status">Voir le statut</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center space-x-4 mb-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/wali-dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Mes Commandes</h1>
            </div>
            <p className="text-gray-600">
              Gérez vos livraisons et trouvez de nouvelles commandes
            </p>
          </div>
          
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Disponibles</p>
                  <p className="text-xl font-bold">{availableOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Truck className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">En cours</p>
                  <p className="text-xl font-bold">{activeOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Terminées</p>
                  <p className="text-xl font-bold">{completedOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Gains du jour</p>
                  <p className="text-xl font-bold">
                    {completedOrders.reduce((sum, order) => sum + Math.round(order.pricing.totalPrice * 0.7), 0)} FCFA
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available">
              Commandes disponibles ({availableOrders.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              En cours ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Terminées ({completedOrders.length})
            </TabsTrigger>
          </TabsList>

          {/* Commandes disponibles */}
          <TabsContent value="available" className="space-y-4">
            {loadingAvailable ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Chargement des commandes...</p>
              </div>
            ) : availableOrders.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune commande disponible</h3>
                  <p className="text-gray-600">
                    Aucune nouvelle commande n'est disponible pour votre véhicule pour le moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {availableOrders.map((order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                        <Badge className={getOrderStatusColor(order.status)}>
                          {getOrderStatusLabel(order.status)}
                        </Badge>
                      </div>
                      <CardDescription>
                        Créée le {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      
                      {/* Adresses */}
                      <div className="space-y-2">
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-4 w-4 text-green-600 mt-1" />
                          <div className="text-sm">
                            <p className="font-medium">{order.pickupAddress.label}</p>
                            <p className="text-gray-600">{order.pickupAddress.district}</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <Navigation className="h-4 w-4 text-blue-600 mt-1" />
                          <div className="text-sm">
                            <p className="font-medium">{order.deliveryAddress.label}</p>
                            <p className="text-gray-600">{order.deliveryAddress.district}</p>
                          </div>
                        </div>
                      </div>

                      {/* Articles */}
                      <div>
                        <h4 className="font-medium text-sm mb-2">Articles ({order.items.length})</h4>
                        <div className="space-y-1">
                          {order.items.slice(0, 2).map((item) => (
                            <p key={item.id} className="text-sm text-gray-600">
                              • {item.name} (x{item.quantity})
                            </p>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-sm text-gray-500">
                              +{order.items.length - 2} autre(s) article(s)
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Informations importantes */}
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-gray-500">Distance</p>
                          <p className="font-medium text-sm">{getDistanceText(order)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Priorité</p>
                          <p className="font-medium text-sm">{order.priority}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Vos gains</p>
                          <p className="font-medium text-sm text-green-600">{getEarningsText(order)}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <Button
                          className="flex-1"
                          onClick={() => handleAcceptOrder(order.id)}
                          disabled={isLoading}
                        >
                          Accepter
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href={`/order/${order.id}`}>
                            Détails
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Commandes en cours */}
          <TabsContent value="active" className="space-y-4">
            {activeOrders.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune livraison en cours</h3>
                  <p className="text-gray-600">
                    Vous n'avez pas de livraison en cours. Consultez les commandes disponibles.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <Card key={order.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-medium">{order.orderNumber}</h3>
                          <Badge className={getOrderStatusColor(order.status)}>
                            {getOrderStatusLabel(order.status)}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Vos gains</p>
                          <p className="text-lg font-bold text-green-600">{getEarningsText(order)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Adresses */}
                        <div className="space-y-3">
                          <div className="p-3 bg-green-50 rounded-lg">
                            <h4 className="font-medium text-green-900 mb-1">📍 Récupération</h4>
                            <p className="text-sm text-green-800">
                              {order.pickupAddress.label}<br />
                              {order.pickupAddress.street}<br />
                              {order.pickupAddress.district}
                            </p>
                            {order.pickupAddress.contactPhone && (
                              <Button size="sm" className="mt-2">
                                <Phone className="h-3 w-3 mr-1" />
                                {order.pickupAddress.contactPhone}
                              </Button>
                            )}
                          </div>
                          
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-1">🎯 Livraison</h4>
                            <p className="text-sm text-blue-800">
                              {order.deliveryAddress.label}<br />
                              {order.deliveryAddress.street}<br />
                              {order.deliveryAddress.district}
                            </p>
                            {order.deliveryAddress.contactPhone && (
                              <Button size="sm" className="mt-2">
                                <Phone className="h-3 w-3 mr-1" />
                                {order.deliveryAddress.contactPhone}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Actions selon le statut */}
                        <div className="space-y-3">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <h4 className="font-medium mb-2">Prochaines étapes</h4>
                            
                            {order.status === OrderStatus.ACCEPTED && (
                              <Button
                                className="w-full"
                                onClick={() => handleUpdateStatus(order.id, OrderStatus.PICKUP_IN_PROGRESS)}
                              >
                                <Navigation className="h-4 w-4 mr-2" />
                                Partir récupérer
                              </Button>
                            )}
                            
                            {order.status === OrderStatus.PICKUP_IN_PROGRESS && (
                              <Button
                                className="w-full"
                                onClick={() => handleUpdateStatus(order.id, OrderStatus.PICKED_UP)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Colis récupéré
                              </Button>
                            )}
                            
                            {order.status === OrderStatus.PICKED_UP && (
                              <Button
                                className="w-full"
                                onClick={() => handleUpdateStatus(order.id, OrderStatus.DELIVERY_IN_PROGRESS)}
                              >
                                <Truck className="h-4 w-4 mr-2" />
                                Partir livrer
                              </Button>
                            )}
                            
                            {order.status === OrderStatus.DELIVERY_IN_PROGRESS && (
                              <Button
                                className="w-full"
                                onClick={() => handleUpdateStatus(order.id, OrderStatus.DELIVERED)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Livraison terminée
                              </Button>
                            )}
                          </div>

                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Client
                            </Button>
                            <Button variant="outline" size="sm" asChild className="flex-1">
                              <Link href={`/order/${order.id}`}>
                                Détails
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Commandes terminées */}
          <TabsContent value="completed" className="space-y-4">
            {completedOrders.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune livraison terminée</h3>
                  <p className="text-gray-600">
                    Vos livraisons terminées apparaîtront ici.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedOrders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{order.orderNumber}</h4>
                          <p className="text-sm text-gray-600">
                            {order.pickupAddress.district} → {order.deliveryAddress.district}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.completedAt || order.updatedAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getOrderStatusColor(order.status)}>
                            {getOrderStatusLabel(order.status)}
                          </Badge>
                          <p className="text-sm font-medium text-green-600 mt-1">
                            {getEarningsText(order)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
