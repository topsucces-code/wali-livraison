'use client';

import { useState } from 'react';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Smartphone, 
  Building, 
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

interface FlutterwavePaymentProps {
  request: PaymentRequest;
  onPaymentSuccess: (response: PaymentResponse) => void;
  onPaymentError: (error: string) => void;
  onCancel: () => void;
  className?: string;
}

export function FlutterwavePayment({
  request,
  onPaymentSuccess,
  onPaymentError,
  onCancel,
  className = '',
}: FlutterwavePaymentProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Configuration Flutterwave
  const config = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-your-public-key',
    tx_ref: `WALI_${request.orderId}_${Date.now()}`,
    amount: request.amount,
    currency: request.currency,
    payment_options: 'card,mobilemoney,ussd,banktransfer',
    customer: {
      email: request.customerEmail || `${request.customerPhone}@wali-livraison.ci`,
      phone_number: request.customerPhone,
      name: request.customerName,
    },
    customizations: {
      title: 'WALI Livraison',
      description: request.description,
      logo: `${process.env.NEXT_PUBLIC_APP_URL}/icons/wali-logo-192.png`,
    },
    meta: {
      order_id: request.orderId,
      order_number: `WAL-${request.orderId}`,
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  const initiatePayment = () => {
    setIsLoading(true);
    
    handleFlutterPayment({
      callback: (response) => {
        console.log('Réponse Flutterwave:', response);
        
        if (response.status === 'successful') {
          // Paiement réussi
          const paymentResponse: PaymentResponse = {
            success: true,
            transactionId: config.tx_ref,
            providerTransactionId: response.transaction_id?.toString() || response.flw_ref,
            status: PaymentStatus.COMPLETED,
            message: 'Paiement Flutterwave réussi',
          };
          
          onPaymentSuccess(paymentResponse);
        } else if (response.status === 'cancelled') {
          // Paiement annulé
          onPaymentError('Paiement annulé par l\'utilisateur');
        } else {
          // Paiement échoué
          onPaymentError('Échec du paiement Flutterwave');
        }
        
        closePaymentModal();
        setIsLoading(false);
      },
      onClose: () => {
        console.log('Modal Flutterwave fermée');
        setIsLoading(false);
      },
    });
  };

  const paymentMethods = [
    {
      id: 'card',
      name: 'Carte bancaire',
      description: 'Visa, Mastercard, Verve',
      icon: <CreditCard className="h-5 w-5" />,
      color: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'mobilemoney',
      name: 'Mobile Money',
      description: 'Orange Money, MTN MoMo, Airtel Money',
      icon: <Smartphone className="h-5 w-5" />,
      color: 'bg-green-100 text-green-800',
    },
    {
      id: 'banktransfer',
      name: 'Virement bancaire',
      description: 'Transfert direct depuis votre banque',
      icon: <Building className="h-5 w-5" />,
      color: 'bg-purple-100 text-purple-800',
    },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span className="text-2xl">🌍</span>
          <span>Flutterwave</span>
        </CardTitle>
        <CardDescription>
          Payez {formatAmount(request.amount)} avec Flutterwave - Solutions de paiement panafricaines
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

        {/* Avantages Flutterwave */}
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center space-x-2 text-orange-700 mb-2">
            <Shield className="h-4 w-4" />
            <span className="font-medium">Pourquoi choisir Flutterwave ?</span>
          </div>
          <ul className="text-sm text-orange-600 space-y-1">
            <li className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3" />
              <span>Accepte toutes les cartes africaines et internationales</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3" />
              <span>Support Mobile Money dans 20+ pays africains</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3" />
              <span>Transactions sécurisées et chiffrées</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3" />
              <span>Traitement instantané des paiements</span>
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
              <span className="font-medium text-green-600">1.4%</span>
            </div>
          </div>
        </div>

        {/* Sécurité */}
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 text-green-700">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Paiement 100% sécurisé</span>
          </div>
          <p className="text-xs text-green-600 mt-1">
            Vos données sont protégées par le chiffrement SSL et les standards PCI DSS
          </p>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <Button
            onClick={initiatePayment}
            disabled={isLoading}
            className="flex-1 bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Ouverture...
              </>
            ) : (
              <>
                <span className="text-lg mr-2">🌍</span>
                Payer avec Flutterwave
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

        {/* Note sur les devises */}
        <div className="text-xs text-gray-500 text-center">
          <p>
            Flutterwave supporte les paiements en FCFA, Naira, Cedi, Rand et autres devises africaines
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
