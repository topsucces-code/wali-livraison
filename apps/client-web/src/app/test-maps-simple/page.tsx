'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function TestMapsSimplePage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    setApiKey(key || 'NON_CONFIGURÉE');
    
    if (!key) {
      setStatus('error');
      setErrorMessage('Clé API Google Maps non configurée');
      return;
    }

    // Test de chargement direct de l'API Google Maps
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=fr&region=CI`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('✅ Google Maps API chargée avec succès');
      initializeMap();
    };

    script.onerror = (error) => {
      console.error('❌ Erreur de chargement Google Maps API:', error);
      setStatus('error');
      setErrorMessage('Erreur de chargement de l\'API Google Maps');
    };

    // Vérifier si le script n'est pas déjà chargé
    if (!document.querySelector(`script[src*="maps.googleapis.com"]`)) {
      document.head.appendChild(script);
    } else if (window.google?.maps) {
      initializeMap();
    }

    return () => {
      // Nettoyage si nécessaire
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current) return;

    try {
      // Position par défaut : Plateau, Abidjan
      const center = { lat: 5.3364, lng: -4.0267 };

      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      // Ajouter un marker de test
      new google.maps.Marker({
        position: center,
        map,
        title: 'Test WALI Livraison - Plateau, Abidjan',
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

      console.log('✅ Carte initialisée avec succès');
      setStatus('success');
    } catch (error) {
      console.error('❌ Erreur d\'initialisation de la carte:', error);
      setStatus('error');
      setErrorMessage(`Erreur d'initialisation: ${error}`);
    }
  };

  const testGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Géolocalisation non supportée par ce navigateur');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        alert(`Position obtenue: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      },
      (error) => {
        alert(`Erreur de géolocalisation: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  const testPlacesAPI = () => {
    if (!window.google?.maps?.places) {
      alert('API Places non disponible');
      return;
    }

    const service = new google.maps.places.PlacesService(document.createElement('div'));
    
    service.textSearch(
      {
        query: 'Plateau Abidjan Côte d\'Ivoire',
        region: 'CI',
      },
      (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          alert(`Places API fonctionne ! Trouvé ${results.length} résultats pour "Plateau Abidjan"`);
        } else {
          alert(`Erreur Places API: ${status}`);
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔧 Diagnostic Google Maps
          </h1>
          <p className="text-gray-600">
            Test simple pour diagnostiquer les problèmes Google Maps
          </p>
        </div>

        {/* Informations de configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Clé API:</span>
              <span className="font-mono text-sm">
                {apiKey.length > 20 ? `${apiKey.substring(0, 20)}...` : apiKey}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Environnement:</span>
              <span>{process.env.NODE_ENV}</span>
            </div>
            <div className="flex justify-between">
              <span>URL:</span>
              <span>{typeof window !== 'undefined' ? window.location.origin : 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Statut de chargement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
              {status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {status === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
              <span>Statut Google Maps API</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status === 'loading' && (
              <p className="text-blue-600">🔄 Chargement de l'API Google Maps...</p>
            )}
            {status === 'success' && (
              <p className="text-green-600">✅ API Google Maps chargée et carte initialisée avec succès !</p>
            )}
            {status === 'error' && (
              <div className="text-red-600">
                <p>❌ Erreur de chargement Google Maps</p>
                <p className="text-sm mt-1">{errorMessage}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Carte de test */}
        <Card>
          <CardHeader>
            <CardTitle>Carte de Test</CardTitle>
            <CardDescription>
              Carte simple centrée sur le Plateau, Abidjan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              ref={mapRef} 
              className="w-full h-96 bg-gray-200 rounded-lg border"
              style={{ minHeight: '400px' }}
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
                    <p>Erreur de chargement de la carte</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tests supplémentaires */}
        <Card>
          <CardHeader>
            <CardTitle>Tests Supplémentaires</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button onClick={testGeolocation} variant="outline">
                🧭 Tester Géolocalisation
              </Button>
              <Button onClick={testPlacesAPI} variant="outline" disabled={status !== 'success'}>
                📍 Tester Places API
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions de dépannage */}
        <Card>
          <CardHeader>
            <CardTitle>🛠️ Guide de Dépannage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Si la carte ne se charge pas :</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>Vérifiez que la clé API Google Maps est valide</li>
                <li>Assurez-vous que les APIs suivantes sont activées dans Google Cloud Console :
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Maps JavaScript API</li>
                    <li>Places API</li>
                    <li>Geocoding API</li>
                  </ul>
                </li>
                <li>Vérifiez les restrictions de domaine dans Google Cloud Console</li>
                <li>Consultez la console JavaScript (F12) pour plus de détails</li>
                <li>Vérifiez que le quota n'est pas dépassé</li>
              </ol>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-1">💡 Configuration recommandée :</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Domaines autorisés : localhost:3003, votre-domaine.com</li>
                <li>• APIs activées : Maps JavaScript, Places, Geocoding</li>
                <li>• Quota : Vérifiez les limites quotidiennes</li>
                <li>• Facturation : Compte Google Cloud avec facturation activée</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
