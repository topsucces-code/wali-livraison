'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2, MapPin } from 'lucide-react';

export default function TestBasicMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Fonction pour charger Google Maps
    const loadGoogleMaps = () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        setStatus('error');
        setErrorMessage('Clé API Google Maps non configurée');
        return;
      }

      // Vérifier si Google Maps est déjà chargé
      if (window.google?.maps) {
        initMap();
        return;
      }

      // Charger le script Google Maps
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=fr&region=CI&callback=initMap`;
      script.async = true;
      script.defer = true;

      // Fonction callback globale
      (window as any).initMap = initMap;

      script.onerror = () => {
        setStatus('error');
        setErrorMessage('Erreur de chargement de Google Maps API');
      };

      document.head.appendChild(script);
    };

    // Fonction d'initialisation de la carte
    const initMap = () => {
      if (!mapRef.current) return;

      try {
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 5.3364, lng: -4.0267 }, // Plateau, Abidjan
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        // Ajouter un marker
        new google.maps.Marker({
          position: { lat: 5.3364, lng: -4.0267 },
          map,
          title: 'WALI Livraison - Plateau, Abidjan',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2C11.6 2 8 5.6 8 10C8 16 16 30 16 30S24 16 24 10C24 5.6 20.4 2 16 2Z" fill="#EA580C" stroke="#FFFFFF" stroke-width="2"/>
                <circle cx="16" cy="10" r="4" fill="#FFFFFF"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 32),
          },
        });

        setStatus('success');
        console.log('✅ Carte basique initialisée avec succès');
      } catch (error) {
        setStatus('error');
        setErrorMessage(`Erreur d'initialisation: ${error}`);
        console.error('❌ Erreur d\'initialisation de la carte:', error);
      }
    };

    loadGoogleMaps();

    // Nettoyage
    return () => {
      delete (window as any).initMap;
    };
  }, []);

  const testGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Géolocalisation non supportée');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        alert(`Position: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
      },
      (error) => {
        alert(`Erreur: ${error.message}`);
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🗺️ Test Google Maps - Version Basique
          </h1>
          <p className="text-gray-600">
            Version ultra-simplifiée avec callback global pour maximum de compatibilité
          </p>
        </div>

        {/* Statut */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
              {status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {status === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
              <span>Statut Google Maps</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status === 'loading' && (
              <p className="text-blue-600">🔄 Chargement de Google Maps...</p>
            )}
            {status === 'success' && (
              <p className="text-green-600">✅ Google Maps chargé avec succès !</p>
            )}
            {status === 'error' && (
              <div className="text-red-600">
                <p>❌ Erreur: {errorMessage}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Carte */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Carte Google Maps</span>
            </CardTitle>
            <CardDescription>
              Carte centrée sur le Plateau, Abidjan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              ref={mapRef} 
              className="w-full h-96 bg-gray-200 rounded-lg border"
            >
              {status === 'loading' && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Chargement de la carte...</p>
                  </div>
                </div>
              )}
              {status === 'error' && (
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

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={testGeolocation} variant="outline" className="w-full">
                📍 Tester Géolocalisation
              </Button>
              
              <div className="text-sm text-gray-600">
                <p><strong>Clé API:</strong> {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Configurée' : 'Non configurée'}</p>
                <p><strong>Google Maps:</strong> {typeof window !== 'undefined' && window.google?.maps ? 'Disponible' : 'Non disponible'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>🛠️ Instructions de Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. Obtenir une clé API Google Maps :</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>Aller sur <a href="https://console.cloud.google.com/" target="_blank" className="text-blue-600 underline">Google Cloud Console</a></li>
                <li>Créer un projet ou sélectionner un projet existant</li>
                <li>Activer les APIs : Maps JavaScript API, Places API, Geocoding API</li>
                <li>Créer une clé API dans "APIs & Services" > "Credentials"</li>
                <li>Configurer les restrictions de domaine : localhost:3003</li>
                <li>Activer la facturation (requis même pour usage gratuit)</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium mb-2">2. Configurer la clé dans l'application :</h4>
              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-sm font-mono">
                  # Dans apps/client-web/.env.local<br/>
                  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="VOTRE_CLE_API_ICI"
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                💡 <strong>Astuce :</strong> Si cette page fonctionne, votre configuration Google Maps est correcte !
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
