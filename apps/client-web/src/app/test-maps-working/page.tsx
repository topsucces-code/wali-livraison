'use client';

import { useState } from 'react';
import { SimpleMap, LatLng, SimpleMapMarker } from '@/components/maps/SimpleMap';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Plus, Trash2 } from 'lucide-react';

export default function TestMapsWorkingPage() {
  const [center, setCenter] = useState<LatLng>({ lat: 5.3364, lng: -4.0267 });
  const [zoom, setZoom] = useState(13);
  const [markers, setMarkers] = useState<SimpleMapMarker[]>([
    {
      id: 'plateau',
      position: { lat: 5.3364, lng: -4.0267 },
      title: 'Plateau - Centre d\'Abidjan',
      color: 'orange',
    },
    {
      id: 'cocody',
      position: { lat: 5.3500, lng: -3.9800 },
      title: 'Cocody - Zone résidentielle',
      color: 'green',
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

  const removeMarker = (id: string) => {
    setMarkers(prev => prev.filter(m => m.id !== id));
  };

  const centerOnAbidjan = () => {
    setCenter({ lat: 5.3364, lng: -4.0267 });
    setZoom(13);
  };

  const centerOnCocody = () => {
    setCenter({ lat: 5.3500, lng: -3.9800 });
    setZoom(15);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🗺️ Test Google Maps - Version Simple
          </h1>
          <p className="text-gray-600">
            Version simplifiée qui charge Google Maps directement via Next.js Script
          </p>
        </div>

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
                  Cliquez sur la carte pour ajouter des markers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleMap
                  center={center}
                  zoom={zoom}
                  height="500px"
                  markers={markers}
                  onMapClick={handleMapClick}
                  className="border rounded-lg overflow-hidden"
                />
              </CardContent>
            </Card>
          </div>

          {/* Contrôles */}
          <div className="space-y-6">
            
            {/* Navigation rapide */}
            <Card>
              <CardHeader>
                <CardTitle>Navigation Rapide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={centerOnAbidjan} variant="outline" className="w-full">
                  🏢 Plateau (Centre)
                </Button>
                <Button onClick={centerOnCocody} variant="outline" className="w-full">
                  🏠 Cocody (Résidentiel)
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
                  />
                </div>
                <p className="text-sm text-gray-600">
                  💡 Cliquez sur la carte pour ajouter un marker
                </p>
              </CardContent>
            </Card>

            {/* Liste des markers */}
            <Card>
              <CardHeader>
                <CardTitle>Markers ({markers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {markers.map((marker) => (
                    <div key={marker.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <div 
                          className={`w-3 h-3 rounded-full ${
                            marker.color === 'red' ? 'bg-red-500' :
                            marker.color === 'green' ? 'bg-green-500' :
                            marker.color === 'blue' ? 'bg-blue-500' :
                            'bg-orange-500'
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium">{marker.title}</p>
                          <p className="text-xs text-gray-500">
                            {marker.position.lat.toFixed(4)}, {marker.position.lng.toFixed(4)}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeMarker(marker.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  
                  {markers.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Aucun marker. Cliquez sur la carte pour en ajouter.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Informations */}
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Centre:</span>
                  <span>{center.lat.toFixed(4)}, {center.lng.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Zoom:</span>
                  <span>{zoom}</span>
                </div>
                <div className="flex justify-between">
                  <span>Markers:</span>
                  <span>{markers.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Fonctionnalités testées :</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>✅ Chargement Google Maps API</li>
                  <li>✅ Affichage carte interactive</li>
                  <li>✅ Markers personnalisés</li>
                  <li>✅ Clic sur carte pour ajouter markers</li>
                  <li>✅ Navigation et zoom</li>
                  <li>✅ Gestion d'état React</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Comment utiliser :</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Cliquez sur la carte pour ajouter un marker</li>
                  <li>• Utilisez les boutons de navigation rapide</li>
                  <li>• Supprimez les markers avec l'icône poubelle</li>
                  <li>• Personnalisez le nom avant d'ajouter</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
