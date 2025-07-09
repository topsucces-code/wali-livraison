'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Navigation, 
  Truck, 
  Clock, 
  Phone,
  RefreshCw,
  Route,
  AlertCircle
} from 'lucide-react';
import { GoogleMap } from './GoogleMap';
import { Order, OrderStatus, getOrderStatusLabel, getOrderStatusColor } from '@/lib/orders';

interface OrderTrackingMapProps {
  order: Order;
  driverLocation?: { lat: number; lng: number; timestamp: string };
  onRefresh?: () => void;
  className?: string;
}

interface RouteInfo {
  distance: string;
  duration: string;
  steps: google.maps.DirectionsStep[];
}

export function OrderTrackingMap({
  order,
  driverLocation,
  onRefresh,
  className = '',
}: OrderTrackingMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialisation des services Google Maps
  useEffect(() => {
    if (map) {
      const service = new google.maps.DirectionsService();
      const renderer = new google.maps.DirectionsRenderer({
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#3B82F6',
          strokeWeight: 4,
          strokeOpacity: 0.8,
        },
      });
      
      renderer.setMap(map);
      setDirectionsService(service);
      setDirectionsRenderer(renderer);
    }
  }, [map]);

  // Calcul de l'itinéraire
  const calculateRoute = useCallback(async () => {
    if (!directionsService || !directionsRenderer) return;

    setIsCalculatingRoute(true);

    try {
      const origin = driverLocation || order.pickupAddress.coordinates;
      const destination = order.status === OrderStatus.PICKED_UP || 
                         order.status === OrderStatus.DELIVERY_IN_PROGRESS
                         ? order.deliveryAddress.coordinates
                         : order.pickupAddress.coordinates;

      const request: google.maps.DirectionsRequest = {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        travelMode: google.maps.TravelMode.DRIVING,
        avoidHighways: false,
        avoidTolls: true,
        optimizeWaypoints: true,
      };

      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);
          
          const route = result.routes[0];
          const leg = route.legs[0];
          
          setRouteInfo({
            distance: leg.distance?.text || 'N/A',
            duration: leg.duration?.text || 'N/A',
            steps: leg.steps || [],
          });
        } else {
          console.error('Erreur de calcul d\'itinéraire:', status);
        }
        setIsCalculatingRoute(false);
      });
    } catch (error) {
      console.error('Erreur de calcul d\'itinéraire:', error);
      setIsCalculatingRoute(false);
    }
  }, [directionsService, directionsRenderer, driverLocation, order]);

  // Mise à jour de la position du livreur
  useEffect(() => {
    if (map && driverLocation) {
      // Supprimer l'ancien marqueur
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setMap(null);
      }

      // Créer le nouveau marqueur du livreur
      const marker = new google.maps.Marker({
        position: driverLocation,
        map,
        title: `${order.driverName} - ${order.vehicleInfo?.type}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="#3B82F6" stroke="white" stroke-width="2"/>
              <path d="M16 8L20 12H18V20H14V12H12L16 8Z" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16),
        },
        zIndex: 1000,
      });

      driverMarkerRef.current = marker;
      setLastUpdate(new Date());

      // Recalculer l'itinéraire avec la nouvelle position
      calculateRoute();
    }
  }, [map, driverLocation, calculateRoute, order.driverName, order.vehicleInfo]);

  // Actualisation automatique
  useEffect(() => {
    if (onRefresh && [
      OrderStatus.ACCEPTED,
      OrderStatus.PICKUP_IN_PROGRESS,
      OrderStatus.PICKED_UP,
      OrderStatus.DELIVERY_IN_PROGRESS,
    ].includes(order.status)) {
      
      refreshIntervalRef.current = setInterval(() => {
        onRefresh();
      }, 15000); // Actualisation toutes les 15 secondes

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [onRefresh, order.status]);

  // Nettoyage
  useEffect(() => {
    return () => {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setMap(null);
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Préparation des marqueurs
  const markers = [
    // Marqueur de récupération
    {
      position: order.pickupAddress.coordinates,
      title: `Récupération: ${order.pickupAddress.label}`,
      icon: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#10B981"/>
          <circle cx="12" cy="9" r="2.5" fill="white"/>
        </svg>
      `),
    },
    // Marqueur de livraison
    {
      position: order.deliveryAddress.coordinates,
      title: `Livraison: ${order.deliveryAddress.label}`,
      icon: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EF4444"/>
          <circle cx="12" cy="9" r="2.5" fill="white"/>
        </svg>
      `),
    },
  ];

  // Centre de la carte
  const mapCenter = driverLocation || {
    lat: (order.pickupAddress.coordinates.lat + order.deliveryAddress.coordinates.lat) / 2,
    lng: (order.pickupAddress.coordinates.lng + order.deliveryAddress.coordinates.lng) / 2,
  };

  const getStatusMessage = () => {
    switch (order.status) {
      case OrderStatus.ACCEPTED:
        return 'Le livreur se prépare à récupérer votre colis';
      case OrderStatus.PICKUP_IN_PROGRESS:
        return 'Le livreur se dirige vers le point de récupération';
      case OrderStatus.PICKED_UP:
        return 'Colis récupéré, livraison en cours';
      case OrderStatus.DELIVERY_IN_PROGRESS:
        return 'Le livreur se dirige vers vous';
      case OrderStatus.DELIVERED:
        return 'Colis livré avec succès !';
      default:
        return 'En attente d\'attribution à un livreur';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Suivi en temps réel</span>
            </CardTitle>
            <CardDescription>{getStatusMessage()}</CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={getOrderStatusColor(order.status)}>
              {getOrderStatusLabel(order.status)}
            </Badge>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Informations du livreur */}
        {order.driverId && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Truck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">{order.driverName}</h4>
                  <p className="text-sm text-gray-600">
                    {order.vehicleInfo?.brand} {order.vehicleInfo?.model}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {driverLocation && (
                  <div className="text-xs text-gray-500">
                    Mis à jour il y a {Math.round((Date.now() - lastUpdate.getTime()) / 1000)}s
                  </div>
                )}
                <Button size="sm" variant="outline">
                  <Phone className="h-4 w-4 mr-1" />
                  Appeler
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Informations d'itinéraire */}
        {routeInfo && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <Route className="h-5 w-5 mx-auto mb-1 text-gray-600" />
              <p className="text-sm text-gray-600">Distance</p>
              <p className="font-medium">{routeInfo.distance}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 text-gray-600" />
              <p className="text-sm text-gray-600">Temps estimé</p>
              <p className="font-medium">{routeInfo.duration}</p>
            </div>
          </div>
        )}

        {/* Carte */}
        <div className="relative">
          <GoogleMap
            center={mapCenter}
            zoom={14}
            height="400px"
            markers={markers}
            onMapLoad={setMap}
            className="rounded-lg border"
          />
          
          {isCalculatingRoute && (
            <div className="absolute top-2 right-2 bg-white rounded-lg shadow-md p-2">
              <div className="flex items-center space-x-2 text-sm">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                <span>Calcul d'itinéraire...</span>
              </div>
            </div>
          )}
        </div>

        {/* Adresses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-900">Récupération</span>
            </div>
            <p className="text-sm text-green-800">{order.pickupAddress.street}</p>
            <p className="text-xs text-green-700">{order.pickupAddress.district}</p>
          </div>
          
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Navigation className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-900">Livraison</span>
            </div>
            <p className="text-sm text-red-800">{order.deliveryAddress.street}</p>
            <p className="text-xs text-red-700">{order.deliveryAddress.district}</p>
          </div>
        </div>

        {/* Message d'information */}
        {!driverLocation && order.driverId && (
          <div className="p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Position du livreur en cours de mise à jour...
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
