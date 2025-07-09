'use client';

import { useState } from 'react';
import { SimpleMap, LatLng, SimpleMapMarker } from '@/components/maps/SimpleMap';
import { useGoogleMaps } from '@/components/maps/GoogleMapsProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function TestMapsFixedPage() {
  const { isLoaded, loadError } = useGoogleMaps();
  const [center, setCenter] = useState<LatLng>({ lat: 5.3364, lng: -4.0267 });
  const [markers, setMarkers] = useState<SimpleMapMarker[]>([
    {
      id: 'plateau',
      position: { lat: 5.3364, lng: -4.0267 },
      title: 'Plateau - Centre d\'Abidjan',
      color: 'orange',
    },
  ]);

  const [newMarkerName, setNewMarkerName] = useState('');

  const handleMapClick = (position: LatLng) => {
    const name = newMarkerName || `Point ${markers.length + 1}`;
    const newMarker: SimpleMapMarker = {
      id: `marker-${Date.now()}`,
      position,
      title: name,
      color: 'blue',
    };
    
    setMarkers(prev => [...prev, newMarker]);
    setNewMarkerName('');
  };

  const testGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Géolocalisation non supportée');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCenter(newPos);
        
        // Ajouter un marker à la position actuelle
        const userMarker: SimpleMapMarker = {
          id: 'user-location',
          position: newPos,
          title: 'Votre position actuelle',
          color: 'green',
        };
        setMarkers(prev => [...prev.filter(m => m.id !== 'user-location'), userMarker]);
      },
      (error) => {
        alert(`Erreur de géolocalisation: ${error.message}`);
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🗺️ Test Google Maps - Version Corrigée
          </h1>
          <p className="text-gray-600">
            Version avec GoogleMapsProvider et gestion d'erreurs Next.js corrigée
          </p>
        </div>

        {/* Statut Google Maps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {!isLoaded && !loadError && <Loader2 className="h-5 w-5 animate-spin" />}
              {isLoaded && <CheckCircle className="h-5 w-5 text-green-600" />}
              {loadError && <AlertCircle className="h-5 w-5 text-red-600" />}
              <span>Statut Google Maps API</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isLoaded && !loadError && (
              <p className="text-blue-600">🔄 Chargement de Google Maps API...</p>
            )}
            {isLoaded && (
              <p className="text-green-600">✅ Google Maps API chargée avec succès !</p>
            )}
            {loadError && (
              <div className="text-red-600">
                <p>❌ Erreur: {loadError}</p>
                <p className="text-sm mt-1">Vérifiez la configuration de votre clé API</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Carte principale */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Carte Interactive</span>
                </CardTitle>
                <CardDescription>
                  {isLoaded ? 'Cliquez sur la carte pour ajouter des markers' : 'En attente du chargement de Google Maps...'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoaded ? (
                  <SimpleMap
                    center={center}
                    zoom={13}
                    height="500px"
                    markers={markers}
                    onMapClick={handleMapClick}
                    className="border rounded-lg overflow-hidden"
                  />
                ) : (
                  <div className="h-[500px] bg-gray-100 border rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      {loadError ? (
                        <>
                          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                          <p className="text-red-600 font-medium">Erreur de chargement</p>
                          <p className="text-sm text-red-500 mt-1">{loadError}</p>
                        </>
                      ) : (
                        <>
                          <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-blue-500" />
                          <p className="text-blue-600 font-medium">Chargement de Google Maps...</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contrôles */}
          <div className="space-y-6">
            
            {/* Actions rapides */}
            <Card>
              <CardHeader>
                <CardTitle>Actions Rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => setCenter({ lat: 5.3364, lng: -4.0267 })} 
                  variant="outline" 
                  className="w-full"
                  disabled={!isLoaded}
                >
                  🏢 Plateau
                </Button>
                <Button 
                  onClick={() => setCenter({ lat: 5.3500, lng: -3.9800 })} 
                  variant="outline" 
                  className="w-full"
                  disabled={!isLoaded}
                >
                  🏠 Cocody
                </Button>
                <Button 
                  onClick={testGeolocation} 
                  variant="outline" 
                  className="w-full"
                  disabled={!isLoaded}
                >
                  📍 Ma Position
                </Button>
              </CardContent>
            </Card>

            {/* Ajouter marker */}
            <Card>
              <CardHeader>
                <CardTitle>Ajouter un Marker</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="marker-name">Nom du marker</Label>
                  <Input
                    id="marker-name"
                    value={newMarkerName}
                    onChange={(e) => setNewMarkerName(e.target.value)}
                    placeholder="Nom du lieu..."
                    disabled={!isLoaded}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  💡 Cliquez sur la carte pour ajouter un marker
                </p>
              </CardContent>
            </Card>

            {/* Informations */}
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>API Status:</span>
                  <span className={isLoaded ? 'text-green-600' : loadError ? 'text-red-600' : 'text-blue-600'}>
                    {isLoaded ? 'Chargée' : loadError ? 'Erreur' : 'Chargement...'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Centre:</span>
                  <span>{center.lat.toFixed(4)}, {center.lng.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Markers:</span>
                  <span>{markers.length}</span>
                </div>
              </CardContent>
            </Card>

            {/* Liste des markers */}
            <Card>
              <CardHeader>
                <CardTitle>Markers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {markers.map((marker) => (
                    <div key={marker.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded text-sm">
                      <div 
                        className={`w-3 h-3 rounded-full ${
                          marker.color === 'red' ? 'bg-red-500' :
                          marker.color === 'green' ? 'bg-green-500' :
                          marker.color === 'blue' ? 'bg-blue-500' :
                          'bg-orange-500'
                        }`}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{marker.title}</p>
                        <p className="text-xs text-gray-500">
                          {marker.position.lat.toFixed(4)}, {marker.position.lng.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Guide de dépannage */}
        {loadError && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-900">🛠️ Guide de Dépannage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">Si Google Maps ne se charge pas :</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Vérifiez que la clé API est configurée dans .env.local</li>
                <li>Activez les APIs dans Google Cloud Console :
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Maps JavaScript API</li>
                    <li>Places API</li>
                    <li>Geocoding API</li>
                  </ul>
                </li>
                <li>Vérifiez les restrictions de domaine (localhost:3003)</li>
                <li>Activez la facturation dans Google Cloud Console</li>
                <li>Consultez la console JavaScript (F12) pour plus de détails</li>
              </ol>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
