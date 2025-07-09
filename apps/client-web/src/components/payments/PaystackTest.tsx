'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Shield
} from 'lucide-react';

// Déclaration du type PaystackPop pour TypeScript
declare global {
  interface Window {
    PaystackPop: {
      setup: (config: any) => {
        openIframe: () => void;
      };
    };
  }
}

export function PaystackTest() {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Données de test
  const [testData, setTestData] = useState({
    email: 'test@wali-livraison.ci',
    amount: 1000, // 1000 FCFA
    name: 'Test User WALI',
    phone: '+225 07 12 34 56 78',
  });

  // Charger le script Paystack
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => setError('Erreur de chargement du script Paystack');
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const testPaystackPayment = () => {
    if (!isScriptLoaded || !window.PaystackPop) {
      setError('Script Paystack non chargé');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    const config = {
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email: testData.email,
      amount: testData.amount * 100, // Paystack utilise les kobo
      currency: 'XOF', // Franc CFA
      ref: `WALI_TEST_${Date.now()}`,
      metadata: {
        custom_fields: [
          {
            display_name: "Nom complet",
            variable_name: "full_name",
            value: testData.name
          },
          {
            display_name: "Téléphone",
            variable_name: "phone",
            value: testData.phone
          }
        ]
      },
      callback: function(response: any) {
        console.log('Réponse Paystack:', response);
        
        if (response.status === 'success') {
          setResult(`✅ Paiement réussi ! 
Référence: ${response.reference}
Montant: ${testData.amount} FCFA
Transaction ID: ${response.trans}`);
        } else {
          setError(`❌ Paiement échoué: ${response.message || 'Erreur inconnue'}`);
        }
        
        setIsLoading(false);
      },
      onClose: function() {
        console.log('Modal Paystack fermée');
        setIsLoading(false);
      },
    };

    try {
      const handler = window.PaystackPop.setup(config);
      handler.openIframe();
    } catch (err: any) {
      setError(`Erreur lors de l'ouverture de Paystack: ${err.message}`);
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span className="text-2xl">💎</span>
          <span>Test Paystack - WALI Livraison</span>
        </CardTitle>
        <CardDescription>
          Testez l'intégration Paystack avec votre clé API
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        
        {/* Statut de la configuration */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2 text-blue-700 mb-2">
            <Shield className="h-4 w-4" />
            <span className="font-medium">Configuration Paystack</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Clé publique:</span>
              <Badge variant={process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.startsWith('pk_test_') ? 'default' : 'destructive'}>
                {process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.startsWith('pk_test_') ? 'Configurée (Test)' : 'Non configurée'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Script Paystack:</span>
              <Badge variant={isScriptLoaded ? 'default' : 'secondary'}>
                {isScriptLoaded ? 'Chargé' : 'En cours...'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Environnement:</span>
              <Badge variant="outline">Test (Sandbox)</Badge>
            </div>
          </div>
        </div>

        {/* Données de test */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Données de test</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={testData.email}
                onChange={(e) => setTestData(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="amount">Montant (FCFA)</Label>
              <Input
                id="amount"
                type="number"
                value={testData.amount}
                onChange={(e) => setTestData(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                type="text"
                value={testData.name}
                onChange={(e) => setTestData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={testData.phone}
                onChange={(e) => setTestData(prev => ({ ...prev, phone: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Cartes de test */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h5 className="font-medium text-yellow-800 mb-2">Cartes de test Paystack</h5>
          <div className="text-sm text-yellow-700 space-y-1">
            <div><strong>Visa (Succès):</strong> 4084084084084081</div>
            <div><strong>Mastercard (Succès):</strong> 5060666666666666666</div>
            <div><strong>Verve (Succès):</strong> 5061020000000000094</div>
            <div><strong>CVV:</strong> 408 | <strong>Expiry:</strong> 12/25 | <strong>PIN:</strong> 1234</div>
          </div>
        </div>

        {/* Résultat */}
        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 text-green-700 mb-2">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Résultat du test</span>
            </div>
            <pre className="text-sm text-green-600 whitespace-pre-wrap">{result}</pre>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-700 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Erreur</span>
            </div>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Action */}
        <div className="flex space-x-3">
          <Button
            onClick={testPaystackPayment}
            disabled={isLoading || !isScriptLoaded || !process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Test en cours...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Tester Paystack ({testData.amount} FCFA)
              </>
            )}
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Instructions:</strong></p>
          <p>1. Cliquez sur "Tester Paystack" pour ouvrir la modal de paiement</p>
          <p>2. Utilisez une des cartes de test ci-dessus</p>
          <p>3. Entrez le CVV, la date d'expiration et le PIN</p>
          <p>4. Confirmez le paiement pour voir le résultat</p>
        </div>
      </CardContent>
    </Card>
  );
}
