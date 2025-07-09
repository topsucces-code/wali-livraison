'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Smartphone, 
  ArrowLeft,
  TestTube,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { PaystackTest } from '@/components/payments/PaystackTest';
import { FlutterwavePayment } from '@/components/payments/FlutterwavePayment';
import { PaymentRequest, PaymentResponse } from '@/lib/payments';
import Link from 'next/link';

export default function PaymentsTestPage() {
  const [activeTab, setActiveTab] = useState('paystack');
  const [testResults, setTestResults] = useState<{[key: string]: any}>({});

  // Données de test communes
  const testRequest: PaymentRequest = {
    orderId: 'TEST_ORDER_001',
    amount: 1500,
    currency: 'XOF',
    paymentMethodId: 'test_method',
    description: 'Test de paiement WALI Livraison',
    customerPhone: '+225 07 12 34 56 78',
    customerName: 'Test User WALI',
    customerEmail: 'test@wali-livraison.ci',
  };

  const handlePaymentSuccess = (provider: string) => (response: PaymentResponse) => {
    console.log(`Succès ${provider}:`, response);
    setTestResults(prev => ({
      ...prev,
      [provider]: {
        success: true,
        response,
        timestamp: new Date().toISOString(),
      }
    }));
  };

  const handlePaymentError = (provider: string) => (error: string) => {
    console.log(`Erreur ${provider}:`, error);
    setTestResults(prev => ({
      ...prev,
      [provider]: {
        success: false,
        error,
        timestamp: new Date().toISOString(),
      }
    }));
  };

  const providers = [
    {
      id: 'paystack',
      name: 'Paystack',
      icon: '💎',
      description: 'Solutions de paiement optimisées pour l\'Afrique',
      status: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.startsWith('pk_test_') ? 'configured' : 'not_configured',
    },
    {
      id: 'flutterwave',
      name: 'Flutterwave',
      icon: '🌍',
      description: 'Solutions de paiement panafricaines',
      status: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY?.startsWith('FLWPUBK_TEST') ? 'configured' : 'not_configured',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/payments">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux paiements
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
                <TestTube className="h-8 w-8" />
                <span>Test des Paiements</span>
              </h1>
              <p className="text-gray-600">
                Testez les intégrations de paiement WALI Livraison
              </p>
            </div>
          </div>
        </div>

        {/* Statut des providers */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Statut des Providers</CardTitle>
            <CardDescription>
              Vérifiez la configuration de vos providers de paiement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map((provider) => (
                <div key={provider.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{provider.icon}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{provider.name}</h4>
                      <p className="text-sm text-gray-600">{provider.description}</p>
                    </div>
                  </div>
                  <Badge variant={provider.status === 'configured' ? 'default' : 'secondary'}>
                    {provider.status === 'configured' ? 'Configuré' : 'Non configuré'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Résultats des tests */}
        {Object.keys(testResults).length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Résultats des Tests</CardTitle>
              <CardDescription>
                Historique des tests de paiement effectués
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(testResults).map(([provider, result]: [string, any]) => (
                  <div key={provider} className={`p-4 border rounded-lg ${
                    result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium capitalize">{provider}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(result.timestamp).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    
                    {result.success ? (
                      <div className="text-sm text-green-700">
                        <p><strong>Transaction ID:</strong> {result.response.transactionId}</p>
                        <p><strong>Provider ID:</strong> {result.response.providerTransactionId}</p>
                        <p><strong>Statut:</strong> {result.response.status}</p>
                        <p><strong>Message:</strong> {result.response.message}</p>
                      </div>
                    ) : (
                      <div className="text-sm text-red-700">
                        <p><strong>Erreur:</strong> {result.error}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tests des providers */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paystack" className="flex items-center space-x-2">
              <span>💎</span>
              <span>Paystack</span>
            </TabsTrigger>
            <TabsTrigger value="flutterwave" className="flex items-center space-x-2">
              <span>🌍</span>
              <span>Flutterwave</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paystack" className="mt-6">
            <PaystackTest />
          </TabsContent>

          <TabsContent value="flutterwave" className="mt-6">
            <FlutterwavePayment
              request={testRequest}
              onPaymentSuccess={handlePaymentSuccess('flutterwave')}
              onPaymentError={handlePaymentError('flutterwave')}
              onCancel={() => console.log('Test Flutterwave annulé')}
            />
          </TabsContent>
        </Tabs>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Instructions de Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Paystack - Cartes de Test</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Visa (Succès):</strong> 4084084084084081</p>
                <p><strong>Mastercard (Succès):</strong> 5060666666666666666</p>
                <p><strong>Verve (Succès):</strong> 5061020000000000094</p>
                <p><strong>CVV:</strong> 408 | <strong>Expiry:</strong> 12/25 | <strong>PIN:</strong> 1234</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Flutterwave - Cartes de Test</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Visa (Succès):</strong> 4187427415564246</p>
                <p><strong>Mastercard (Succès):</strong> 5531886652142950</p>
                <p><strong>CVV:</strong> 564 | <strong>Expiry:</strong> 09/32 | <strong>PIN:</strong> 3310</p>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Ces tests utilisent les environnements sandbox des providers. 
                Aucun argent réel ne sera débité.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
