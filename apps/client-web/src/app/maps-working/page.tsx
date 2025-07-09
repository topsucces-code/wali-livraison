'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2, MapPin, Navigation } from 'lucide-react';

export default function MapsWorkingPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{lat: number, lng: number} | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    loadGoogleMaps();
  }, []);

  const loadGoogleMaps = () => {
    // Utiliser une clé API de démonstration ou la clé configurée
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBgNfqhT6lk47eh3gA0Oc9uxsB16r5lTMY';
    
    if (window.google?.maps) {
      initializeMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=fr&region=CI&callback=initMap`;
    script.async = true;
    script.defer = true;

    (window as any).initMap = initializeMap;

    script.onload = () => {
      console.log('✅ Google Maps API chargée');
    };

    script.onerror = (error) => {
      console.error('❌ Erreur de chargement Google Maps:', error);
      setError('Erreur de chargement de Google Maps API');
    };

    document.head.appendChild(script);
  };

  const initializeMap = () => {
    if (!mapRef.current) return;

    try {
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: 5.3364, lng: -4.0267 }, // Plateau, Abidjan
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      setMap(mapInstance);
      setIsLoaded(true);
      setError(null);
      
      console.log('✅ Carte initialisée avec succès');
    } catch (err) {
      console.error('❌ Erreur d\'initialisation:', err);
      setError(`Erreur d'initialisation: ${err}`);
    }
  };

  const geocodeAddress = async (address: string): Promise<{lat: number, lng: number} | null> => {
    if (!window.google?.maps || !address) return null;

    const geocoder = new google.maps.Geocoder();
    
    try {
      const response = await geocoder.geocode({
        address: `${address}, Abidjan, Côte d'Ivoire`,
        region: 'CI',
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
    if (!pickupAddress) return;
    
    setIsGeocoding(true);
    const coords = await geocodeAddress(pickupAddress);
    setIsGeocoding(false);
    
    if (coords) {
      setPickupCoords(coords);
      
      if (map) {
        // Supprimer les anciens markers
        // Ajouter nouveau marker
        new google.maps.Marker({
          position: coords,
          map,
          title: `Récupération: ${pickupAddress}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2C11.6 2 8 5.6 8 10C8 16 16 30 16 30S24 16 24 10C24 5.6 20.4 2 16 2Z" fill="#10B981" stroke="#FFFFFF" stroke-width="2"/>
                <circle cx="16" cy="10" r="4" fill="#FFFFFF"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 32),
          },
        });
        
        map.setCenter(coords);
        map.setZoom(15);
      }
    } else {
      alert('Adresse non trouvée');
    }
  };

  const handleGeocodeDelivery = async () => {
    if (!deliveryAddress) return;
    
    setIsGeocoding(true);
    const coords = await geocodeAddress(deliveryAddress);
    setIsGeocoding(false);
    
    if (coords) {
      setDeliveryCoords(coords);
      
      if (map) {
        new google.maps.Marker({
          position: coords,
          map,
          title: `Livraison: ${deliveryAddress}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2C11.6 2 8 5.6 8 10C8 16 16 30 16 30S24 16 24 10C24 5.6 20.4 2 16 2Z" fill="#EF4444" stroke="#FFFFFF" stroke-width="2"/>
                <circle cx="16" cy="10" r="4" fill="#FFFFFF"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 32),
          },
        });
        
        // Si on a les deux coordonnées, ajuster la vue
        if (pickupCoords) {
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(pickupCoords);
          bounds.extend(coords);
          map.fitBounds(bounds);
        } else {
          map.setCenter(coords);
          map.setZoom(15);
        }
      }
    } else {
      alert('Adresse non trouvée');
    }
  };

  const testAddresses = [
    { pickup: 'Plateau', delivery: 'Cocody' },
    { pickup: 'Marcory Zone 4', delivery: 'Yopougon' },
    { pickup: 'Treichville', delivery: 'Adjamé' },
  ];

  const loadTestAddress = (test: {pickup: string, delivery: string}) => {
    setPickupAddress(test.pickup);
    setDeliveryAddress(test.delivery);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🗺️ Google Maps - Version Fonctionnelle
          </h1>
          <p className="text-gray-600">
            Version simplifiée garantie de fonctionner avec géocodage manuel
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
                  <span>Statut</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isLoaded && !error && (
                  <p className="text-blue-600">🔄 Chargement...</p>
                )}
                {isLoaded && (
                  <p className="text-green-600">✅ Google Maps chargé !</p>
                )}
                {error && (
                  <p className="text-red-600">❌ {error}</p>
                )}
              </CardContent>
            </Card>

            {/* Adresses */}
            <Card>
              <CardHeader>
                <CardTitle>Adresses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="pickup">Récupération</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="pickup"
                      placeholder="Ex: Plateau"
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                    />
                    <Button 
                      onClick={handleGeocodePickup} 
                      disabled={!isLoaded || isGeocoding || !pickupAddress}
                      size="sm"
                    >
                      {isGeocoding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Navigation className="h-3 w-3" />}
                    </Button>
                  </div>
                  {pickupCoords && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ {pickupCoords.lat.toFixed(4)}, {pickupCoords.lng.toFixed(4)}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="delivery">Livraison</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="delivery"
                      placeholder="Ex: Cocody"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                    />
                    <Button 
                      onClick={handleGeocodeDelivery} 
                      disabled={!isLoaded || isGeocoding || !deliveryAddress}
                      size="sm"
                    >
                      {isGeocoding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Navigation className="h-3 w-3" />}
                    </Button>
                  </div>
                  {deliveryCoords && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ {deliveryCoords.lat.toFixed(4)}, {deliveryCoords.lng.toFixed(4)}
                    </p>
                  )}
                </div>
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
                  Saisissez des adresses et cliquez sur les boutons pour les géocoder
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
                        <p>Chargement de Google Maps...</p>
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

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Comment utiliser :</h4>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>Attendez que Google Maps se charge</li>
                  <li>Saisissez une adresse de récupération</li>
                  <li>Cliquez sur le bouton de navigation</li>
                  <li>Répétez pour l'adresse de livraison</li>
                  <li>Ou utilisez les tests rapides</li>
                </ol>
              </div>
              <div>
                <h4 className="font-medium mb-2">Adresses qui fonctionnent :</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Plateau</li>
                  <li>Cocody</li>
                  <li>Marcory</li>
                  <li>Yopougon</li>
                  <li>Treichville</li>
                  <li>Adjamé</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
