'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  CreditCard, 
  Loader2, 
  AlertCircle,
  Shield,
  Lock
} from 'lucide-react';
import {
  PaymentProvider,
  PaymentRequest,
  PaymentResponse,
  CardType,
  PAYMENT_PROVIDERS,
} from '@/lib/payments';
import { usePayments } from '@/hooks/usePayments';

interface CardPaymentFormProps {
  request: PaymentRequest;
  onPaymentSuccess: (response: PaymentResponse) => void;
  onPaymentError: (error: string) => void;
  onCancel: () => void;
  className?: string;
}

export function CardPaymentForm({
  request,
  onPaymentSuccess,
  onPaymentError,
  onCancel,
  className = '',
}: CardPaymentFormProps) {
  const { initiateCardPayment, validateCard, formatPaymentAmount } = usePayments();
  
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider.FLUTTERWAVE | PaymentProvider.PAYSTACK>(PaymentProvider.FLUTTERWAVE);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cvv: '',
    expiryMonth: '',
    expiryYear: '',
    pin: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPinField, setShowPinField] = useState(false);

  const handleCardNumberChange = (value: string) => {
    // Formater le numéro de carte avec des espaces
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardDetails(prev => ({ ...prev, cardNumber: formatted }));
    setError(null);
  };

  const handleExpiryChange = (field: 'expiryMonth' | 'expiryYear', value: string) => {
    const cleaned = value.replace(/\D/g, '');
    setCardDetails(prev => ({ ...prev, [field]: cleaned }));
    setError(null);
  };

  const handleCvvChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    setCardDetails(prev => ({ ...prev, cvv: cleaned }));
    setError(null);
  };

  const handleSubmit = async () => {
    // Validation des champs
    if (!cardDetails.cardNumber.trim()) {
      setError('Veuillez entrer le numéro de carte');
      return;
    }

    if (!cardDetails.cvv.trim()) {
      setError('Veuillez entrer le code CVV');
      return;
    }

    if (!cardDetails.expiryMonth || !cardDetails.expiryYear) {
      setError('Veuillez entrer la date d\'expiration');
      return;
    }

    // Validation de la carte
    const cardValidation = validateCard(
      cardDetails.cardNumber.replace(/\s/g, ''),
      cardDetails.cvv,
      cardDetails.expiryMonth,
      cardDetails.expiryYear
    );

    if (!cardValidation.isValid) {
      setError(cardValidation.error || 'Données de carte invalides');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const response = await initiateCardPayment(
        request,
        {
          cardNumber: cardDetails.cardNumber.replace(/\s/g, ''),
          cvv: cardDetails.cvv,
          expiryMonth: cardDetails.expiryMonth,
          expiryYear: cardDetails.expiryYear,
          pin: cardDetails.pin || undefined,
        },
        selectedProvider
      );

      if (response.success) {
        onPaymentSuccess(response);
      } else {
        // Vérifier si un PIN est requis
        if (response.error?.code === 'PIN_REQUIRED') {
          setShowPinField(true);
          setError('Veuillez entrer votre PIN de carte');
        } else {
          onPaymentError(response.error?.message || 'Erreur lors du paiement');
        }
      }
    } catch (err: any) {
      onPaymentError(err.message || 'Erreur lors du paiement par carte');
    } finally {
      setIsProcessing(false);
    }
  };

  const getCardTypeIcon = (cardNumber: string): string => {
    const cleaned = cardNumber.replace(/\D/g, '');
    if (cleaned.startsWith('4')) return '💳'; // Visa
    if (cleaned.startsWith('5') || cleaned.startsWith('2')) return '💳'; // Mastercard
    if (cleaned.startsWith('506') || cleaned.startsWith('507') || cleaned.startsWith('508') || cleaned.startsWith('627')) return '💳'; // Verve
    if (cleaned.startsWith('34') || cleaned.startsWith('37')) return '💳'; // Amex
    return '💳';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <span>Paiement par carte</span>
        </CardTitle>
        <CardDescription>
          Payez {formatPaymentAmount(request.amount)} avec votre carte bancaire
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        
        {/* Sélection du provider */}
        <div>
          <Label>Provider de paiement</Label>
          <RadioGroup
            value={selectedProvider}
            onValueChange={(value) => setSelectedProvider(value as PaymentProvider.FLUTTERWAVE | PaymentProvider.PAYSTACK)}
            className="mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={PaymentProvider.FLUTTERWAVE} id="flutterwave" />
              <Label htmlFor="flutterwave" className="flex items-center space-x-2 cursor-pointer">
                <span className="text-lg">🌍</span>
                <div>
                  <span className="font-medium">Flutterwave</span>
                  <p className="text-xs text-gray-500">Cartes internationales et africaines</p>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={PaymentProvider.PAYSTACK} id="paystack" />
              <Label htmlFor="paystack" className="flex items-center space-x-2 cursor-pointer">
                <span className="text-lg">💎</span>
                <div>
                  <span className="font-medium">Paystack</span>
                  <p className="text-xs text-gray-500">Optimisé pour l'Afrique</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Informations de carte */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="cardNumber">Numéro de carte</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardDetails.cardNumber}
                onChange={(e) => handleCardNumberChange(e.target.value)}
                maxLength={19}
                className="mt-1 pr-10"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-lg">{getCardTypeIcon(cardDetails.cardNumber)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="expiryMonth">Mois</Label>
              <Input
                id="expiryMonth"
                type="text"
                placeholder="MM"
                value={cardDetails.expiryMonth}
                onChange={(e) => handleExpiryChange('expiryMonth', e.target.value)}
                maxLength={2}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="expiryYear">Année</Label>
              <Input
                id="expiryYear"
                type="text"
                placeholder="YY"
                value={cardDetails.expiryYear}
                onChange={(e) => handleExpiryChange('expiryYear', e.target.value)}
                maxLength={2}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                type="text"
                placeholder="123"
                value={cardDetails.cvv}
                onChange={(e) => handleCvvChange(e.target.value)}
                maxLength={4}
                className="mt-1"
              />
            </div>
          </div>

          {/* Champ PIN (si requis) */}
          {showPinField && (
            <div>
              <Label htmlFor="pin">PIN de carte</Label>
              <Input
                id="pin"
                type="password"
                placeholder="****"
                value={cardDetails.pin}
                onChange={(e) => setCardDetails(prev => ({ ...prev, pin: e.target.value }))}
                maxLength={4}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Entrez le PIN de votre carte pour autoriser le paiement
              </p>
            </div>
          )}
        </div>

        {/* Sécurité */}
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 text-green-700">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Paiement sécurisé</span>
          </div>
          <p className="text-xs text-green-600 mt-1">
            Vos informations de carte sont chiffrées et sécurisées par {PAYMENT_PROVIDERS[selectedProvider].displayName}
          </p>
        </div>

        {/* Erreur */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <Button
            onClick={handleSubmit}
            disabled={isProcessing || !cardDetails.cardNumber.trim() || !cardDetails.cvv.trim()}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Payer {formatPaymentAmount(request.amount)}
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Annuler
          </Button>
        </div>

        {/* Informations sur les frais */}
        <div className="text-xs text-gray-500 text-center">
          <p>
            Frais de transaction : {PAYMENT_PROVIDERS[selectedProvider].fees.percentage}% 
            {PAYMENT_PROVIDERS[selectedProvider].fees.fixed > 0 && 
              ` + ${formatPaymentAmount(PAYMENT_PROVIDERS[selectedProvider].fees.fixed)}`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
