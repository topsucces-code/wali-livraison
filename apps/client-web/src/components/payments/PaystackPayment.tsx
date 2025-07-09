'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Building, 
  Smartphone,
  Loader2, 
  Shield,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  PaymentProvider,
  formatAmount,
} from '@/lib/payments';

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

interface PaystackPaymentProps {
  request: PaymentRequest;
  onPaymentSuccess: (response: PaymentResponse) => void;
  onPaymentError: (error: string) => void;
  onCancel: () => void;
  className?: string;
}

export function PaystackPayment({
  request,
  onPaymentSuccess,
  onPaymentError,
  onCancel,
  className = '',
}: PaystackPaymentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Charger le script Paystack
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initiatePayment = () => {
    if (!isScriptLoaded || !window.PaystackPop) {
      onPaymentError('Erreur de chargement de Paystack');
      return;
    }

    setIsLoading(true);

    const config = {
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_your-public-key',
      email: request.customerEmail || `${request.customerPhone}@wali-livraison.ci`,
      amount: request.amount * 100, // Paystack utilise les kobo
      currency: request.currency,
      ref: `WALI_${request.orderId}_${Date.now()}`,
      metadata: {
        order_id: request.orderId,
        order_number: `WAL-${request.orderId}`,
        customer_name: request.customerName,
        customer_phone: request.customerPhone,
      },
      callback: function(response: any) {
        console.log('Réponse Paystack:', response);
        
        if (response.status === 'success') {
          // Paiement réussi
          const paymentResponse: PaymentResponse = {
            success: true,
            transactionId: config.ref,
            providerTransactionId: response.reference,
            status: PaymentStatus.COMPLETED,
            message: 'Paiement Paystack réussi',
          };
          
          onPaymentSuccess(paymentResponse);
        } else {
          // Paiement échoué
          onPaymentError('Échec du paiement Paystack');
        }
        
        setIsLoading(false);
      },
      onClose: function() {
        console.log('Modal Paystack fermée');
        setIsLoading(false);
      },
    };

    const handler = window.PaystackPop.setup(config);
    handler.openIframe();
  };

  const paymentMethods = [
    {
      id: 'card',
      name: 'Cartes bancaires',
      description: 'Visa, Mastercard, Verve',
      icon: <CreditCard className="h-5 w-5" />,
      color: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'bank',
      name: 'Virement bancaire',
      description: 'Transfert direct depuis votre banque',
      icon: <Building className="h-5 w-5" />,
      color: 'bg-purple-100 text-purple-800',
    },
    {
      id: 'ussd',
      name: 'USSD',
      description: 'Paiement via codes USSD bancaires',
      icon: <Smartphone className="h-5 w-5" />,
      color: 'bg-green-100 text-green-800',
    },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span className="text-2xl">💎</span>
          <span>Paystack</span>
        </CardTitle>
        <CardDescription>
          Payez {formatAmount(request.amount)} avec Paystack - Solutions de paiement optimisées pour l'Afrique
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        
        {/* Méthodes de paiement disponibles */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Méthodes de paiement disponibles</h4>
          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                <div className="text-gray-600">
                  {method.icon}
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{method.name}</h5>
                  <p className="text-sm text-gray-600">{method.description}</p>
                </div>
                <Badge className={method.color}>
                  Disponible
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Avantages Paystack */}
        <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
          <div className="flex items-center space-x-2 text-cyan-700 mb-2">
            <Shield className="h-4 w-4" />
            <span className="font-medium">Pourquoi choisir Paystack ?</span>
          </div>
          <ul className="text-sm text-cyan-600 space-y-1">
            <li className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3" />
              <span>Taux de succès de 99% pour les paiements</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3" />
              <span>Support des principales banques africaines</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3" />
              <span>Interface optimisée pour les utilisateurs africains</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3" />
              <span>Traitement instantané et sécurisé</span>
            </li>
          </ul>
        </div>

        {/* Informations de transaction */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Détails de la transaction</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Commande</span>
              <span className="font-medium">WAL-{request.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Montant</span>
              <span className="font-medium text-lg">{formatAmount(request.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Devise</span>
              <span className="font-medium">{request.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Frais de transaction</span>
              <span className="font-medium text-green-600">1.5% + 100 FCFA</span>
            </div>
          </div>
        </div>

        {/* Banques supportées */}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <h5 className="font-medium text-gray-900 mb-2">Banques supportées</h5>
          <div className="text-xs text-gray-600 grid grid-cols-2 gap-1">
            <span>• Ecobank</span>
            <span>• UBA</span>
            <span>• Access Bank</span>
            <span>• Zenith Bank</span>
            <span>• GTBank</span>
            <span>• First Bank</span>
            <span>• Stanbic IBTC</span>
            <span>• Et plus...</span>
          </div>
        </div>

        {/* Sécurité */}
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 text-green-700">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Paiement 100% sécurisé</span>
          </div>
          <p className="text-xs text-green-600 mt-1">
            Certifié PCI DSS Level 1 - Le plus haut niveau de sécurité pour les paiements
          </p>
        </div>

        {/* Statut du script */}
        {!isScriptLoaded && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2 text-yellow-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Chargement de Paystack...</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <Button
            onClick={initiatePayment}
            disabled={isLoading || !isScriptLoaded}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Ouverture...
              </>
            ) : (
              <>
                <span className="text-lg mr-2">💎</span>
                Payer avec Paystack
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Annuler
          </Button>
        </div>

        {/* Note sur la disponibilité */}
        <div className="text-xs text-gray-500 text-center">
          <p>
            Paystack est optimisé pour les paiements au Nigeria, Ghana, Afrique du Sud et Côte d'Ivoire
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
