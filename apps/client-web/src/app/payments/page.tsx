'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  History, 
  Settings, 
  Plus,
  ArrowLeft,
  Smartphone,
  Banknote,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import {
  PaymentStatus,
  PaymentProvider,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  formatAmount,
  formatPhoneForDisplay,
} from '@/lib/payments';
import { usePayments } from '@/hooks/usePayments';
import { PaymentMethodSelector } from '@/components/payments/PaymentMethodSelector';
import Link from 'next/link';

export default function PaymentsPage() {
  const {
    paymentMethods,
    transactions,
    isLoading,
    error,
    formatPaymentAmount,
    clearError,
  } = usePayments();

  const [activeTab, setActiveTab] = useState('methods');

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case PaymentStatus.FAILED:
        return <XCircle className="h-4 w-4 text-red-500" />;
      case PaymentStatus.PENDING:
      case PaymentStatus.PROCESSING:
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getProviderIcon = (provider: PaymentProvider) => {
    switch (provider) {
      case PaymentProvider.ORANGE_MONEY:
      case PaymentProvider.MTN_MOMO:
      case PaymentProvider.WAVE:
        return <Smartphone className="h-4 w-4" />;
      case PaymentProvider.FLUTTERWAVE:
      case PaymentProvider.PAYSTACK:
        return <CreditCard className="h-4 w-4" />;
      case PaymentProvider.CASH:
        return <Banknote className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const renderTransaction = (transaction: any) => {
    const config = PAYMENT_PROVIDERS[transaction.provider];
    
    return (
      <div key={transaction.id} className="p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: config.color + '20' }}>
              <span className="text-sm">{config.icon}</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{transaction.orderNumber}</h4>
              <p className="text-sm text-gray-600">{config.displayName}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-2">
              {getStatusIcon(transaction.status)}
              <Badge className={PAYMENT_STATUS_COLORS[transaction.status]}>
                {PAYMENT_STATUS_LABELS[transaction.status]}
              </Badge>
            </div>
            <p className="text-lg font-medium text-gray-900 mt-1">
              {formatPaymentAmount(transaction.amount)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{new Date(transaction.initiatedAt).toLocaleDateString('fr-FR')}</span>
          <span>ID: {transaction.id.slice(-8)}</span>
        </div>
        
        {transaction.errorMessage && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {transaction.errorMessage}
          </div>
        )}
      </div>
    );
  };

  const renderPaymentMethod = (method: any) => {
    const config = PAYMENT_PROVIDERS[method.provider];
    
    return (
      <div key={method.id} className="p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: config.color + '20' }}>
              <span className="text-lg">{config.icon}</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{config.displayName}</h4>
              {method.phoneNumber && (
                <p className="text-sm text-gray-600">
                  {formatPhoneForDisplay(method.phoneNumber)}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Ajouté le {new Date(method.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {method.isDefault && (
              <Badge variant="secondary">Par défaut</Badge>
            )}
            <Badge variant={method.isActive ? 'default' : 'secondary'}>
              {method.isActive ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/wali-dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Paiements</h1>
              <p className="text-gray-600">
                Gérez vos méthodes de paiement et consultez l'historique
              </p>
            </div>
          </div>
        </div>

        {/* Erreur globale */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={clearError}>
              ×
            </Button>
          </div>
        )}

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Méthodes</p>
                  <p className="text-2xl font-bold text-gray-900">{paymentMethods.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <History className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Réussies</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {transactions.filter(t => t.status === PaymentStatus.COMPLETED).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contenu principal */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="methods">Méthodes de paiement</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="methods" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Méthodes de paiement</CardTitle>
                <CardDescription>
                  Gérez vos méthodes de paiement Mobile Money
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentMethodSelector
                  selectedMethodId=""
                  onMethodSelect={() => {}}
                  showAddMethod={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Historique des transactions</CardTitle>
                <CardDescription>
                  Consultez l'historique de vos paiements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.map(renderTransaction)}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucune transaction
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Vos transactions de paiement apparaîtront ici
                    </p>
                    <Link href="/order/create">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Créer une commande
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
