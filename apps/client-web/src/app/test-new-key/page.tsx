'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2, MapPin } from 'lucide-react';

export default function TestNewKeyPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [customApiKey, setCustomApiKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const testApiKey = async (apiKey: string) => {
    if (!apiKey || apiKey.length < 30) {
      setStatus('error');
      setErrorMessage('Clé API invalide (trop courte)');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      // Supprimer les anciens scripts Google Maps
      const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
      existingScripts.forEach(script => script.remove());

      // Nettoyer l'objet google global
      if (window.google) {
        delete (window as any).google;
      }

      // Charger l'API avec la nouvelle clé
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=fr&region=CI&callback=initTestMap`;
      script.async = true;
      script.defer = true;

      // Fonction callback globale
      (window as any).initTestMap = () => {
        try {
          if (!mapRef.current) return;

          const testMap = new google.maps.Map(mapRef.current, {
            center: { lat: 5.3364, lng: -4.0267 }, // Plateau, Abidjan
            zoom: 13,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });

          // Ajouter un marker de test
          new google.maps.Marker({
            position: { lat: 5.3364, lng: -4.0267 },
            map: testMap,
            title: 'Test WALI Livraison - Plateau, Abidjan',
          });

          // Test de géocodage
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({
            address: 'Cocody, Abidjan, Côte d\'Ivoire',
            region: 'CI',
          }, (results, status) => {
            if (status === 'OK' && results && results.length > 0) {
              const location = results[0].geometry.location;
              
              // Ajouter un marker pour Cocody
              new google.maps.Marker({
                position: location,
                map: testMap,
                title: 'Cocody - Test Géocodage',
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

              console.log('✅ Géocodage réussi:', location.toString());
            }
          });

          setMap(testMap);
          setStatus('success');
          console.log('✅ Test de la clé API réussi !');
        } catch (error) {
          console.error('❌ Erreur d\'initialisation de la carte:', error);
          setStatus('error');
          setErrorMessage(`Erreur d'initialisation: ${error}`);
        }
      };

      script.onerror = () => {
        setStatus('error');
        setErrorMessage('Erreur de chargement de Google Maps API - Vérifiez la clé API');
      };

      document.head.appendChild(script);

      // Timeout de sécurité
      setTimeout(() => {
        if (status === 'loading') {
          setStatus('error');
          setErrorMessage('Timeout - La clé API ne répond pas');
        }
      }, 10000);

    } catch (error) {
      setStatus('error');
      setErrorMessage(`Erreur: ${error}`);
    }
  };

  const testCurrentKey = () => {
    const currentKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (currentKey) {
      testApiKey(currentKey);
    } else {
      setStatus('error');
      setErrorMessage('Aucune clé API configurée dans .env.local');
    }
  };

  const testCustomKey = () => {
    if (customApiKey) {
      testApiKey(customApiKey);
    } else {
      setStatus('error');
      setErrorMessage('Veuillez saisir une clé API');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔑 Test de Clé API Google Maps
          </h1>
          <p className="text-gray-600">
            Testez différentes clés API pour diagnostiquer les problèmes
          </p>
        </div>

        {/* Configuration actuelle */}
        <Card>
          <CardHeader>
            <CardTitle>Clé API Actuelle</CardTitle>
            <CardDescription>
              Clé configurée dans .env.local
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <code className="bg-gray-100 px-3 py-2 rounded text-sm">
                {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 
                  `${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.substring(0, 20)}...` : 
                  'NON_CONFIGURÉE'
                }
              </code>
              <Button onClick={testCurrentKey} disabled={status === 'loading'}>
                {status === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Tester cette Clé
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test avec clé personnalisée */}
        <Card>
          <CardHeader>
            <CardTitle>Test avec Nouvelle Clé</CardTitle>
            <CardDescription>
              Testez une nouvelle clé API Google Maps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="custom-key">Clé API Google Maps</Label>
              <Input
                id="custom-key"
                type="password"
                placeholder="AIzaSy..."
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                className="font-mono"
              />
            </div>
            <Button onClick={testCustomKey} disabled={status === 'loading' || !customApiKey}>
              {status === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Tester cette Clé
            </Button>
          </CardContent>
        </Card>

        {/* Statut du test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
              {status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {status === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
              <span>Statut du Test</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status === 'idle' && (
              <p className="text-gray-600">Cliquez sur "Tester cette Clé" pour commencer</p>
            )}
            {status === 'loading' && (
              <p className="text-blue-600">🔄 Test en cours...</p>
            )}
            {status === 'success' && (
              <p className="text-green-600">✅ Clé API valide ! Google Maps fonctionne correctement.</p>
            )}
            {status === 'error' && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  ❌ {errorMessage}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Carte de test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Carte de Test</span>
            </CardTitle>
            <CardDescription>
              Carte Google Maps avec markers de test (Plateau et Cocody)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              ref={mapRef} 
              className="w-full h-96 bg-gray-200 rounded-lg border"
            >
              {status === 'idle' && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">En attente du test...</p>
                </div>
              )}
              {status === 'loading' && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Chargement de Google Maps...</p>
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

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>🛠️ Instructions de Résolution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h4 className="font-medium">Si le test échoue, vérifiez :</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>La clé API est valide et active dans Google Cloud Console</li>
                <li>Les APIs sont activées : Maps JavaScript API, Places API, Geocoding API</li>
                <li>Les restrictions de domaine incluent : <code>localhost:3003</code></li>
                <li>La facturation est activée (requis même pour usage gratuit)</li>
                <li>Les quotas ne sont pas dépassés</li>
              </ol>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">💡 Conseil :</h4>
                <p className="text-sm text-blue-800">
                  Pour un test rapide, créez une nouvelle clé API sans restrictions dans Google Cloud Console, 
                  puis testez-la ici avant de l'ajouter à votre .env.local
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
