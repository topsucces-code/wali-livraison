'use client';

import { useState } from 'react';
import { PriceCalculator } from '@/components/price-calculator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, TestTube, CheckCircle } from 'lucide-react';

export default function TestAddressesPage() {
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  const testAddresses = [
    {
      id: 'plateau-cocody',
      name: 'Plateau → Cocody',
      pickup: 'Plateau, Abidjan',
      delivery: 'Cocody Riviera, Abidjan',
      description: 'Trajet classique centre-ville vers zone résidentielle',
      expectedDistance: '~8 km',
      expectedPrice: '2600-3000 FCFA'
    },
    {
      id: 'marcory-yopougon',
      name: 'Marcory → Yopougon',
      pickup: 'Marcory Zone 4, Abidjan',
      delivery: 'Yopougon Selmer, Abidjan',
      description: 'Trajet inter-communes populaires',
      expectedDistance: '~12 km',
      expectedPrice: '3400-4000 FCFA'
    },
    {
      id: 'treichville-adjame',
      name: 'Treichville → Adjamé',
      pickup: 'Treichville, Abidjan',
      delivery: 'Adjamé Marché, Abidjan',
      description: 'Trajet commercial centre-ville',
      expectedDistance: '~6 km',
      expectedPrice: '2200-2600 FCFA'
    },
    {
      id: 'deux-plateaux-angre',
      name: 'Deux Plateaux → Angré',
      pickup: 'Deux Plateaux Vallon, Abidjan',
      delivery: 'Angré 8ème Tranche, Abidjan',
      description: 'Trajet zones résidentielles haut standing',
      expectedDistance: '~5 km',
      expectedPrice: '2000-2400 FCFA'
    },
    {
      id: 'port-bouet-koumassi',
      name: 'Port-Bouët → Koumassi',
      pickup: 'Port-Bouët Aéroport, Abidjan',
      delivery: 'Koumassi Remblais, Abidjan',
      description: 'Trajet aéroport vers zone industrielle',
      expectedDistance: '~10 km',
      expectedPrice: '3000-3600 FCFA'
    }
  ];

  const runTest = (test: any) => {
    setSelectedTest(test.id);
    
    // Simuler le remplissage automatique des champs
    const pickupInput = document.querySelector('#pickup') as HTMLInputElement;
    const deliveryInput = document.querySelector('#delivery') as HTMLInputElement;
    
    if (pickupInput && deliveryInput) {
      // Effacer les champs
      pickupInput.value = '';
      deliveryInput.value = '';
      
      // Déclencher les événements de changement
      pickupInput.dispatchEvent(new Event('input', { bubbles: true }));
      deliveryInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Remplir avec les nouvelles adresses après un délai
      setTimeout(() => {
        pickupInput.value = test.pickup;
        pickupInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        setTimeout(() => {
          deliveryInput.value = test.delivery;
          deliveryInput.dispatchEvent(new Event('input', { bubbles: true }));
        }, 500);
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Test des Adresses Réelles d'Abidjan
          </h1>
          <p className="text-gray-600">
            Testez le calculateur de prix avec des adresses réelles de Côte d'Ivoire
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Tests prédéfinis */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TestTube className="h-5 w-5" />
                  <span>Tests Prédéfinis</span>
                </CardTitle>
                <CardDescription>
                  Cliquez sur un test pour remplir automatiquement les adresses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testAddresses.map((test) => (
                    <Card 
                      key={test.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTest === test.id ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => runTest(test)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{test.name}</h4>
                            {selectedTest === test.id && (
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          
                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3 text-green-600" />
                              <span>{test.pickup}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3 text-red-600" />
                              <span>{test.delivery}</span>
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-500">{test.description}</p>
                          
                          <div className="flex space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {test.expectedDistance}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {test.expectedPrice}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-sm text-blue-900 mb-2">💡 Comment tester :</h4>
                  <ol className="text-xs text-blue-800 space-y-1">
                    <li>1. Cliquez sur un test prédéfini</li>
                    <li>2. Attendez le géocodage automatique</li>
                    <li>3. Vérifiez l'affichage de la carte</li>
                    <li>4. Calculez le prix</li>
                    <li>5. Comparez avec le prix estimé</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calculateur de prix */}
          <div className="lg:col-span-2">
            <PriceCalculator onPriceCalculated={(result) => {
              console.log('Prix calculé pour le test:', result);
            }} />
          </div>
        </div>

        {/* Instructions détaillées */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Guide de Test Complet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">✅ Points à Vérifier :</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600">•</span>
                    <span>Le géocodage automatique fonctionne (indicateurs de chargement)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600">•</span>
                    <span>Les coordonnées s'affichent sous les champs d'adresse</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600">•</span>
                    <span>La carte se centre automatiquement sur les markers</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600">•</span>
                    <span>Les markers pickup (vert) et delivery (rouge) s'affichent</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600">•</span>
                    <span>Le zoom s'adapte automatiquement à la distance</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600">•</span>
                    <span>Le calcul de prix utilise les vraies coordonnées</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600">•</span>
                    <span>Les prix sont réalistes pour le marché ivoirien</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-3">🚨 Erreurs Possibles :</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start space-x-2">
                    <span className="text-red-600">•</span>
                    <span>Adresse non trouvée → Vérifier l'orthographe</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-red-600">•</span>
                    <span>Carte ne se charge pas → Vérifier la clé API Google Maps</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-red-600">•</span>
                    <span>Géocodage lent → Normal, attendre 1-2 secondes</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-red-600">•</span>
                    <span>Prix incohérent → Backend en mode fallback</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-red-600">•</span>
                    <span>Erreurs console → Ouvrir F12 pour diagnostiquer</span>
                  </li>
                </ul>

                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <strong>Note :</strong> Si le backend n'est pas disponible, l'application utilise 
                    un calcul de prix local basé sur la distance géographique.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
