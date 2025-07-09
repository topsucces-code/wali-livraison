'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2, ExternalLink, Copy } from 'lucide-react';

export default function DebugMapsPage() {
  const [apiKey, setApiKey] = useState<string>('');
  const [testResults, setTestResults] = useState<{
    keyFormat: boolean;
    apiLoaded: boolean;
    mapsAvailable: boolean;
    placesAvailable: boolean;
    geocodingTest: boolean;
    error?: string;
  }>({
    keyFormat: false,
    apiLoaded: false,
    mapsAvailable: false,
    placesAvailable: false,
    geocodingTest: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    setApiKey(key || 'NON_CONFIGURÉE');
    
    // Test initial du format de la clé
    if (key && key.startsWith('AIza') && key.length > 30) {
      setTestResults(prev => ({ ...prev, keyFormat: true }));
    }
  }, []);

  const runFullDiagnostic = async () => {
    setIsLoading(true);
    const results = {
      keyFormat: false,
      apiLoaded: false,
      mapsAvailable: false,
      placesAvailable: false,
      geocodingTest: false,
      error: undefined as string | undefined,
    };

    try {
      // Test 1: Format de la clé
      if (apiKey && apiKey.startsWith('AIza') && apiKey.length > 30) {
        results.keyFormat = true;
      } else {
        results.error = 'Format de clé API invalide';
        setTestResults(results);
        setIsLoading(false);
        return;
      }

      // Test 2: Chargement de l'API
      if (window.google?.maps) {
        results.apiLoaded = true;
        results.mapsAvailable = true;
      } else {
        // Charger l'API manuellement pour le test
        await loadGoogleMapsAPI();
        if (window.google?.maps) {
          results.apiLoaded = true;
          results.mapsAvailable = true;
        }
      }

      // Test 3: Places API
      if (window.google?.maps?.places) {
        results.placesAvailable = true;
      }

      // Test 4: Test de géocodage
      if (results.mapsAvailable) {
        try {
          const geocoder = new google.maps.Geocoder();
          const response = await geocoder.geocode({
            address: 'Plateau, Abidjan, Côte d\'Ivoire',
            region: 'CI',
          });
          
          if (response.results.length > 0) {
            results.geocodingTest = true;
          }
        } catch (error) {
          results.error = `Erreur de géocodage: ${error}`;
        }
      }

    } catch (error) {
      results.error = `Erreur générale: ${error}`;
    }

    setTestResults(results);
    setIsLoading(false);
  };

  const loadGoogleMapsAPI = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google?.maps) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=fr&region=CI`;
      script.async = true;
      script.defer = true;

      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Échec du chargement de Google Maps API'));

      document.head.appendChild(script);
    });
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    alert('Clé API copiée dans le presse-papiers');
  };

  const openGoogleCloudConsole = () => {
    window.open('https://console.cloud.google.com/apis/credentials', '_blank');
  };

  const openMapsDocumentation = () => {
    window.open('https://developers.google.com/maps/documentation/javascript/get-api-key', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 Diagnostic Google Maps API
          </h1>
          <p className="text-gray-600">
            Diagnostic complet de la configuration Google Maps
          </p>
        </div>

        {/* Configuration actuelle */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration Actuelle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Clé API:</span>
              <div className="flex items-center space-x-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  {apiKey.length > 20 ? `${apiKey.substring(0, 20)}...` : apiKey}
                </code>
                <Button size="sm" variant="outline" onClick={copyApiKey}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Environnement:</span>
              <Badge variant="secondary">{process.env.NODE_ENV}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">URL actuelle:</span>
              <span className="text-sm text-gray-600">
                {typeof window !== 'undefined' ? window.location.origin : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Tests de diagnostic */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Tests de Diagnostic</span>
              <Button onClick={runFullDiagnostic} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {isLoading ? 'Test en cours...' : 'Lancer le Diagnostic'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>1. Format de la clé API</span>
                {testResults.keyFormat ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>2. Chargement de l'API Google Maps</span>
                {testResults.apiLoaded ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>3. API Maps disponible</span>
                {testResults.mapsAvailable ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>4. API Places disponible</span>
                {testResults.placesAvailable ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>5. Test de géocodage (Abidjan)</span>
                {testResults.geocodingTest ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>

            {testResults.error && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  <strong>Erreur détectée:</strong> {testResults.error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Actions de résolution */}
        <Card>
          <CardHeader>
            <CardTitle>🛠️ Actions de Résolution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" onClick={openGoogleCloudConsole} className="flex items-center space-x-2">
                <ExternalLink className="h-4 w-4" />
                <span>Ouvrir Google Cloud Console</span>
              </Button>

              <Button variant="outline" onClick={openMapsDocumentation} className="flex items-center space-x-2">
                <ExternalLink className="h-4 w-4" />
                <span>Documentation Google Maps</span>
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              <h4 className="font-medium">📋 Checklist de Configuration :</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>Créer un projet dans Google Cloud Console</li>
                <li>Activer les APIs : Maps JavaScript API, Places API, Geocoding API</li>
                <li>Créer une clé API dans "APIs & Services" > "Credentials"</li>
                <li>Configurer les restrictions de domaine : <code>localhost:3003/*</code></li>
                <li>Activer la facturation (requis même pour usage gratuit)</li>
                <li>Vérifier les quotas et limites</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
