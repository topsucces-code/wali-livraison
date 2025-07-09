'use client';

import { useState } from 'react';
import { MapContainer, LatLng, MapMarker } from '@/components/maps/MapContainer';
import { AddressAutocomplete, AddressResult } from '@/components/maps/AddressAutocomplete';
import { AddressPicker, DualAddressPicker } from '@/components/maps/AddressPicker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Navigation, Route } from 'lucide-react';
import { useCurrentPosition } from '@/hooks/useGeolocation';

export default function TestMapsPage() {
  const [selectedAddress, setSelectedAddress] = useState<AddressResult | null>(null);
  const [pickupAddress, setPickupAddress] = useState<AddressResult | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<AddressResult | null>(null);
  const { position, isLoading, error } = useCurrentPosition();

  // Markers pour la carte principale
  const markers: MapMarker[] = [];
  
  if (pickupAddress) {
    markers.push({
      id: 'pickup',
      position: { lat: pickupAddress.lat, lng: pickupAddress.lng },
      title: 'Récupération: ' + pickupAddress.address,
      type: 'pickup',
    });
  }
  
  if (deliveryAddress) {
    markers.push({
      id: 'delivery',
      position: { lat: deliveryAddress.lat, lng: deliveryAddress.lng },
      title: 'Livraison: ' + deliveryAddress.address,
      type: 'delivery',
    });
  }

  // Position du livreur simulée (près du Plateau)
  const driverPosition: LatLng = { lat: 5.3300, lng: -4.0200 };
  markers.push({
    id: 'driver',
    position: driverPosition,
    title: 'Livreur: Jean-Baptiste',
    type: 'driver',
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🗺️ Test Google Maps Integration
          </h1>
          <p className="text-gray-600">
            Test des composants de cartes interactives avec géolocalisation et autocomplete
          </p>
        </div>

        {/* Informations de géolocalisation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Navigation className="h-5 w-5" />
              <span>Géolocalisation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <p className="text-blue-600">🔄 Obtention de votre position...</p>
            )}
            {error && (
              <p className="text-red-600">❌ Erreur: {error.message}</p>
            )}
            {position && (
              <div className="space-y-2">
                <p className="text-green-600">✅ Position obtenue avec succès</p>
                <p className="text-sm text-gray-600">
                  Latitude: {position.lat.toFixed(6)}, Longitude: {position.lng.toFixed(6)}
                </p>
                {position.accuracy && (
                  <p className="text-sm text-gray-600">
                    Précision: {Math.round(position.accuracy)} mètres
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Onglets de test */}
        <Tabs defaultValue="autocomplete" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="autocomplete">Autocomplete</TabsTrigger>
            <TabsTrigger value="picker">Address Picker</TabsTrigger>
            <TabsTrigger value="dual">Dual Picker</TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
          </TabsList>

          {/* Test Autocomplete */}
          <TabsContent value="autocomplete">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Test Autocomplete</CardTitle>
                  <CardDescription>
                    Test de l'autocomplete Google Places avec restriction Côte d'Ivoire
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AddressAutocomplete
                    value={selectedAddress?.address || ''}
                    onChange={() => {}} // Géré par onAddressSelect
                    onAddressSelect={setSelectedAddress}
                    placeholder="Tapez une adresse en Côte d'Ivoire..."
                  />
                  
                  {selectedAddress && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <h4 className="font-medium text-green-900">Adresse sélectionnée:</h4>
                      <p className="text-sm text-green-800 mt-1">{selectedAddress.address}</p>
                      <p className="text-xs text-green-600 mt-1">
                        {selectedAddress.lat.toFixed(6)}, {selectedAddress.lng.toFixed(6)}
                      </p>
                      {selectedAddress.components && (
                        <div className="mt-2 text-xs text-green-600">
                          <p>Ville: {selectedAddress.components.city || 'N/A'}</p>
                          <p>Quartier: {selectedAddress.components.district || 'N/A'}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Carte de Visualisation</CardTitle>
                </CardHeader>
                <CardContent>
                  <MapContainer
                    center={selectedAddress ? { lat: selectedAddress.lat, lng: selectedAddress.lng } : { lat: 5.3364, lng: -4.0267 }}
                    zoom={selectedAddress ? 16 : 13}
                    height="300px"
                    markers={selectedAddress ? [{
                      id: 'selected',
                      position: { lat: selectedAddress.lat, lng: selectedAddress.lng },
                      title: selectedAddress.address,
                      type: 'pickup',
                    }] : []}
                    showUserLocation={true}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Test Address Picker */}
          <TabsContent value="picker">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AddressPicker
                title="Test Address Picker"
                description="Sélectionnez une adresse via autocomplete ou en cliquant sur la carte"
                onAddressSelect={(address) => {
                  console.log('Adresse sélectionnée:', address);
                  setSelectedAddress(address);
                }}
                markerType="delivery"
              />

              <Card>
                <CardHeader>
                  <CardTitle>Résultat</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedAddress ? (
                    <div className="space-y-2">
                      <p><strong>Adresse:</strong> {selectedAddress.address}</p>
                      <p><strong>Coordonnées:</strong> {selectedAddress.lat.toFixed(6)}, {selectedAddress.lng.toFixed(6)}</p>
                      {selectedAddress.placeId && (
                        <p><strong>Place ID:</strong> {selectedAddress.placeId}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">Aucune adresse sélectionnée</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Test Dual Address Picker */}
          <TabsContent value="dual">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DualAddressPicker
                onPickupSelect={setPickupAddress}
                onDeliverySelect={setDeliveryAddress}
                pickupAddress={pickupAddress?.address}
                deliveryAddress={deliveryAddress?.address}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Aperçu de la Livraison</CardTitle>
                </CardHeader>
                <CardContent>
                  <MapContainer
                    center={pickupAddress ? { lat: pickupAddress.lat, lng: pickupAddress.lng } : { lat: 5.3364, lng: -4.0267 }}
                    zoom={pickupAddress && deliveryAddress ? 12 : 13}
                    height="400px"
                    markers={markers}
                    showUserLocation={true}
                    showTraffic={true}
                  />
                  
                  {pickupAddress && deliveryAddress && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Informations de livraison</h4>
                      <div className="space-y-1 text-sm text-blue-800">
                        <p>📍 Récupération: {pickupAddress.address}</p>
                        <p>🎯 Livraison: {deliveryAddress.address}</p>
                        <p>🚚 Livreur: Jean-Baptiste (en ligne)</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Test Tracking */}
          <TabsContent value="tracking">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Route className="h-5 w-5" />
                  <span>Suivi de Livraison en Temps Réel</span>
                </CardTitle>
                <CardDescription>
                  Simulation du suivi d'une commande avec position du livreur
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Carte de suivi */}
                  <div className="lg:col-span-2">
                    <MapContainer
                      center={driverPosition}
                      zoom={14}
                      height="500px"
                      markers={[
                        {
                          id: 'pickup',
                          position: { lat: 5.3364, lng: -4.0267 },
                          title: 'Restaurant Chez Tante Marie',
                          type: 'pickup',
                        },
                        {
                          id: 'delivery',
                          position: { lat: 5.3400, lng: -4.0300 },
                          title: 'Villa 12, Résidence Les Palmiers',
                          type: 'delivery',
                        },
                        {
                          id: 'driver',
                          position: driverPosition,
                          title: 'Jean-Baptiste - Livreur WALI',
                          type: 'driver',
                        },
                      ]}
                      showUserLocation={true}
                      showTraffic={true}
                    />
                  </div>

                  {/* Informations de suivi */}
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Commande #WL24011500001</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Commande récupérée</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span>En route vers vous</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          <span>Livraison</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Livreur</h4>
                      <div className="space-y-1 text-sm text-blue-800">
                        <p>👤 Jean-Baptiste Kouassi</p>
                        <p>📱 +225 07 12 34 56 78</p>
                        <p>⭐ 4.8/5 (127 livraisons)</p>
                        <p>🚗 Moto Yamaha - AB 1234 CI</p>
                      </div>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-medium text-orange-900 mb-2">Estimation</h4>
                      <div className="space-y-1 text-sm text-orange-800">
                        <p>⏱️ Arrivée dans 12 minutes</p>
                        <p>📍 Distance: 2.3 km</p>
                        <p>🚦 Trafic: Fluide</p>
                      </div>
                    </div>

                    <Button className="w-full">
                      📞 Appeler le livreur
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
