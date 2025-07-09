'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2, MapPin, Navigation } from 'lucide-react';

// Interface pour les coordonnées
interface Coordinates {
  lat: number;
  lng: number;
}

// Interface pour les markers
interface MapMarker {
  id: string;
  position: Coordinates;
  title: string;
  color: 'green' | 'red' | 'blue';
}

export default function MapsStablePage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Vérifier si Google Maps est déjà chargé
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google?.maps) {
        setIsLoaded(true);
        initializeMap();
        return true;
      }
      return false;
    };

    // Si Google Maps n'est pas encore chargé, attendre
    if (!checkGoogleMaps()) {
      const interval = setInterval(() => {
        if (checkGoogleMaps()) {
          clearInterval(interval);
        }
      }, 500);

      // Timeout après 10 secondes
      const timeout = setTimeout(() => {
        clearInterval(interval);
        if (!window.google?.maps) {
          setError('Google Maps API non disponible. Vérifiez la configuration.');
        }
      }, 10000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 5.3364, lng: -4.0267 }, // Plateau, Abidjan
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      });

      mapInstanceRef.current = map;
      setError(null);
      console.log('✅ Carte initialisée avec succès');
    } catch (err) {
      console.error('❌ Erreur d\'initialisation:', err);
      setError(`Erreur d'initialisation: ${err}`);
    }
  };

  // Mettre à jour les markers sur la carte
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Supprimer les anciens markers
    markersRef.current.forEach(marker => {
      try {
        marker.setMap(null);
      } catch (e) {
        // Ignorer les erreurs de suppression
      }
    });
    markersRef.current = [];

    // Ajouter les nouveaux markers
    markers.forEach((markerData) => {
      try {
        const marker = new google.maps.Marker({
          position: markerData.position,
          map: mapInstanceRef.current,
          title: markerData.title,
          icon: getMarkerIcon(markerData.color),
        });

        markersRef.current.push(marker);
      } catch (e) {
        console.warn('Erreur lors de la création du marker:', e);
      }
    });

    // Ajuster la vue si on a des markers
    if (markers.length > 0 && mapInstanceRef.current) {
      if (markers.length === 1) {
        mapInstanceRef.current.setCenter(markers[0].position);
        mapInstanceRef.current.setZoom(15);
      } else {
        const bounds = new google.maps.LatLngBounds();
        markers.forEach(marker => bounds.extend(marker.position));
        mapInstanceRef.current.fitBounds(bounds);
      }
    }
  }, [markers]);

  const getMarkerIcon = (color: 'green' | 'red' | 'blue') => {
    const colors = {
      green: '#10B981',
      red: '#EF4444',
      blue: '#3B82F6',
    };

    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 2C11.6 2 8 5.6 8 10C8 16 16 30 16 30S24 16 24 10C24 5.6 20.4 2 16 2Z" fill="${colors[color]}" stroke="#FFFFFF" stroke-width="2"/>
          <circle cx="16" cy="10" r="4" fill="#FFFFFF"/>
        </svg>
      `),
      scaledSize: new google.maps.Size(32, 32),
      anchor: new google.maps.Point(16, 32),
    };
  };

  const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
    if (!window.google?.maps || !address.trim()) return null;

    const geocoder = new google.maps.Geocoder();
    
    try {
      const response = await geocoder.geocode({
        address: `${address}, Abidjan, Côte d'Ivoire`,
        region: 'CI',
        componentRestrictions: {
          country: 'CI'
        }
      });

      if (response.results.length > 0) {
        const location = response.results[0].geometry.location;
        return {
          lat: location.lat(),
          lng: location.lng(),
        };
      }
    } catch (error) {
      console.error('Erreur de géocodage:', error);
    }

    return null;
  };

  const handleGeocodePickup = async () => {
    if (!pickupAddress.trim()) return;
    
    setIsGeocoding(true);
    const coords = await geocodeAddress(pickupAddress);
    setIsGeocoding(false);
    
    if (coords) {
      const newMarker: MapMarker = {
        id: 'pickup',
        position: coords,
        title: `Récupération: ${pickupAddress}`,
        color: 'green',
      };

      setMarkers(prev => [
        ...prev.filter(m => m.id !== 'pickup'),
        newMarker
      ]);
    } else {
      alert(`Adresse "${pickupAddress}" non trouvée à Abidjan`);
    }
  };

  const handleGeocodeDelivery = async () => {
    if (!deliveryAddress.trim()) return;
    
    setIsGeocoding(true);
    const coords = await geocodeAddress(deliveryAddress);
    setIsGeocoding(false);
    
    if (coords) {
      const newMarker: MapMarker = {
        id: 'delivery',
        position: coords,
        title: `Livraison: ${deliveryAddress}`,
        color: 'red',
      };

      setMarkers(prev => [
        ...prev.filter(m => m.id !== 'delivery'),
        newMarker
      ]);
    } else {
      alert(`Adresse "${deliveryAddress}" non trouvée à Abidjan`);
    }
  };

  const clearMarkers = () => {
    setMarkers([]);
    setPickupAddress('');
    setDeliveryAddress('');
  };

  const testAddresses = [
    { pickup: 'Plateau', delivery: 'Cocody' },
    { pickup: 'Marcory Zone 4', delivery: 'Yopougon Selmer' },
    { pickup: 'Treichville', delivery: 'Adjamé' },
    { pickup: 'Deux Plateaux', delivery: 'Angré' },
  ];

  const loadTestAddress = (test: {pickup: string, delivery: string}) => {
    setPickupAddress(test.pickup);
    setDeliveryAddress(test.delivery);
  };

  const pickupMarker = markers.find(m => m.id === 'pickup');
  const deliveryMarker = markers.find(m => m.id === 'delivery');

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🗺️ Google Maps - Version Stable
          </h1>
          <p className="text-gray-600">
            Version corrigée sans erreurs React DOM
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Contrôles */}
          <div className="space-y-6">
            
            {/* Statut */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {!isLoaded && !error && <Loader2 className="h-5 w-5 animate-spin" />}
                  {isLoaded && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {error && <AlertCircle className="h-5 w-5 text-red-600" />}
                  <span>Statut Google Maps</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isLoaded && !error && (
                  <p className="text-blue-600">🔄 Attente de Google Maps...</p>
                )}
                {isLoaded && (
                  <p className="text-green-600">✅ Google Maps prêt !</p>
                )}
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Adresses */}
            <Card>
              <CardHeader>
                <CardTitle>Géocodage d'Adresses</CardTitle>
                <CardDescription>
                  Saisissez des adresses d'Abidjan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="pickup">Adresse de récupération</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="pickup"
                      placeholder="Ex: Plateau"
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                    />
                    <Button 
                      onClick={handleGeocodePickup} 
                      disabled={!isLoaded || isGeocoding || !pickupAddress.trim()}
                      size="sm"
                    >
                      {isGeocoding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Navigation className="h-3 w-3" />}
                    </Button>
                  </div>
                  {pickupMarker && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Trouvé: {pickupMarker.position.lat.toFixed(4)}, {pickupMarker.position.lng.toFixed(4)}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="delivery">Adresse de livraison</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="delivery"
                      placeholder="Ex: Cocody"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                    />
                    <Button 
                      onClick={handleGeocodeDelivery} 
                      disabled={!isLoaded || isGeocoding || !deliveryAddress.trim()}
                      size="sm"
                    >
                      {isGeocoding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Navigation className="h-3 w-3" />}
                    </Button>
                  </div>
                  {deliveryMarker && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Trouvé: {deliveryMarker.position.lat.toFixed(4)}, {deliveryMarker.position.lng.toFixed(4)}
                    </p>
                  )}
                </div>

                <Button 
                  onClick={clearMarkers} 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  disabled={markers.length === 0}
                >
                  Effacer tout
                </Button>
              </CardContent>
            </Card>

            {/* Tests rapides */}
            <Card>
              <CardHeader>
                <CardTitle>Tests Rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {testAddresses.map((test, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => loadTestAddress(test)}
                      className="w-full text-left justify-start"
                    >
                      {test.pickup} → {test.delivery}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Informations */}
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Markers:</span>
                  <span>{markers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pickup:</span>
                  <span>{pickupMarker ? '✓' : '✗'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span>{deliveryMarker ? '✓' : '✗'}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Carte */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Carte Interactive</span>
                </CardTitle>
                <CardDescription>
                  Markers : Vert = Récupération, Rouge = Livraison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  ref={mapRef} 
                  className="w-full h-96 bg-gray-200 rounded-lg border"
                >
                  {!isLoaded && !error && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p>Attente de Google Maps...</p>
                      </div>
                    </div>
                  )}
                  {error && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-red-600">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                        <p>Erreur de chargement</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
