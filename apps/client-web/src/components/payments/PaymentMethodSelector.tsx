'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  CreditCard, 
  Smartphone, 
  Banknote, 
  Plus, 
  Check,
  AlertCircle,
  Loader2,
  Star
} from 'lucide-react';
import {
  PaymentProvider,
  WaliPaymentMethod,
  PaymentMethod,
  PAYMENT_PROVIDERS,
  formatPhoneForDisplay,
  detectProviderFromPhone,
  validatePhoneForProvider,
} from '@/lib/payments';
import { usePayments } from '@/hooks/usePayments';

interface PaymentMethodSelectorProps {
  selectedMethodId?: string;
  onMethodSelect: (methodId: string) => void;
  amount?: number;
  showAddMethod?: boolean;
  showCardMethods?: boolean;
  className?: string;
}

export function PaymentMethodSelector({
  selectedMethodId,
  onMethodSelect,
  amount,
  showAddMethod = true,
  showCardMethods = true,
  className = '',
}: PaymentMethodSelectorProps) {
  const {
    paymentMethods,
    isLoading,
    error,
    addPaymentMethod,
    addCardPaymentMethod,
    setDefaultPaymentMethod,
    validatePayment,
    validateCard,
    formatPaymentAmount,
    clearError,
  } = usePayments();

  const [showAddForm, setShowAddForm] = useState(false);
  const [addMethodType, setAddMethodType] = useState<'mobile' | 'card'>('mobile');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cvv: '',
    expiryMonth: '',
    expiryYear: '',
    cardholderName: '',
  });
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const handlePhoneNumberChange = (phone: string) => {
    setNewPhoneNumber(phone);
    setAddError(null);
    
    // Détecter automatiquement le provider
    const detectedProvider = detectProviderFromPhone(phone);
    if (detectedProvider && detectedProvider !== PaymentProvider.CASH) {
      setSelectedProvider(detectedProvider);
    }
  };

  const handleAddMethod = async () => {
    if (addMethodType === 'mobile') {
      return handleAddMobileMethod();
    } else {
      return handleAddCardMethod();
    }
  };

  const handleAddMobileMethod = async () => {
    if (!newPhoneNumber.trim()) {
      setAddError('Veuillez entrer un numéro de téléphone');
      return;
    }

    if (!selectedProvider) {
      setAddError('Veuillez sélectionner un provider de paiement');
      return;
    }

    // Valider le numéro pour le provider sélectionné
    if (!validatePhoneForProvider(newPhoneNumber, selectedProvider)) {
      const config = PAYMENT_PROVIDERS[selectedProvider];
      setAddError(`Numéro invalide pour ${config.displayName}`);
      return;
    }

    try {
      setIsAdding(true);
      setAddError(null);

      const newMethod = await addPaymentMethod(newPhoneNumber, selectedProvider);
      onMethodSelect(newMethod.id);

      // Réinitialiser le formulaire
      resetForm();
    } catch (err: any) {
      setAddError(err.message || 'Erreur lors de l\'ajout de la méthode');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddCardMethod = async () => {
    // Validation des champs de carte
    if (!cardDetails.cardNumber.trim()) {
      setAddError('Veuillez entrer le numéro de carte');
      return;
    }

    if (!cardDetails.cvv.trim()) {
      setAddError('Veuillez entrer le code CVV');
      return;
    }

    if (!cardDetails.expiryMonth || !cardDetails.expiryYear) {
      setAddError('Veuillez entrer la date d\'expiration');
      return;
    }

    if (!cardDetails.cardholderName.trim()) {
      setAddError('Veuillez entrer le nom du titulaire');
      return;
    }

    if (!selectedProvider || (selectedProvider !== PaymentProvider.FLUTTERWAVE && selectedProvider !== PaymentProvider.PAYSTACK)) {
      setAddError('Veuillez sélectionner Flutterwave ou Paystack pour les cartes');
      return;
    }

    // Valider la carte
    const cardValidation = validateCard(
      cardDetails.cardNumber,
      cardDetails.cvv,
      cardDetails.expiryMonth,
      cardDetails.expiryYear
    );

    if (!cardValidation.isValid) {
      setAddError(cardValidation.error || 'Données de carte invalides');
      return;
    }

    try {
      setIsAdding(true);
      setAddError(null);

      const newMethod = await addCardPaymentMethod(cardDetails, selectedProvider as PaymentProvider.FLUTTERWAVE | PaymentProvider.PAYSTACK);
      onMethodSelect(newMethod.id);

      // Réinitialiser le formulaire
      resetForm();
    } catch (err: any) {
      setAddError(err.message || 'Erreur lors de l\'ajout de la carte');
    } finally {
      setIsAdding(false);
    }
  };

  const resetForm = () => {
    setNewPhoneNumber('');
    setSelectedProvider(null);
    setCardDetails({
      cardNumber: '',
      cvv: '',
      expiryMonth: '',
      expiryYear: '',
      cardholderName: '',
    });
    setShowAddForm(false);
    setAddError(null);
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      await setDefaultPaymentMethod(methodId);
    } catch (err) {
      console.error('Erreur lors de la définition par défaut:', err);
    }
  };

  const getProviderIcon = (provider: PaymentProvider) => {
    switch (provider) {
      case PaymentProvider.ORANGE_MONEY:
      case PaymentProvider.MTN_MOMO:
      case PaymentProvider.WAVE:
        return <Smartphone className="h-5 w-5" />;
      case PaymentProvider.CARD:
        return <CreditCard className="h-5 w-5" />;
      case PaymentProvider.CASH:
        return <Banknote className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const renderPaymentMethod = (method: WaliPaymentMethod) => {
    const config = PAYMENT_PROVIDERS[method.provider];
    const isSelected = selectedMethodId === method.id;
    const isValid = amount ? validatePayment(amount, method.phoneNumber || '', method.provider).isValid : true;

    return (
      <div
        key={method.id}
        className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
          isSelected 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300'
        } ${!isValid ? 'opacity-50' : ''}`}
        onClick={() => isValid && onMethodSelect(method.id)}
      >
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center`} style={{ backgroundColor: config.color + '20' }}>
            <span className="text-lg">{config.icon}</span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-gray-900">{config.displayName}</h4>
              {method.isDefault && (
                <Badge variant="secondary" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  Par défaut
                </Badge>
              )}
            </div>
            
            {method.phoneNumber && (
              <p className="text-sm text-gray-600">
                {formatPhoneForDisplay(method.phoneNumber)}
              </p>
            )}

            {method.cardDetails && (
              <p className="text-sm text-gray-600">
                **** **** **** {method.cardDetails.last4} • {method.cardDetails.expiryMonth}/{method.cardDetails.expiryYear}
              </p>
            )}

            <p className="text-xs text-gray-500 mt-1">
              {config.description}
            </p>
          </div>

          {isSelected && (
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <Check className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        {!isValid && amount && (
          <div className="mt-2 flex items-center space-x-1 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs">
              Montant non supporté ({formatPaymentAmount(config.minAmount)} - {formatPaymentAmount(config.maxAmount)})
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="absolute top-2 right-2 flex space-x-1">
          {!method.isDefault && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleSetDefault(method.id);
              }}
              title="Définir par défaut"
            >
              <Star className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderAddMethodForm = () => (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-lg">Ajouter une méthode de paiement</CardTitle>
        <CardDescription>
          {showCardMethods
            ? 'Ajoutez votre numéro mobile money ou votre carte bancaire'
            : 'Ajoutez votre numéro de téléphone mobile money'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Type de méthode */}
        {showCardMethods && (
          <div>
            <Label>Type de paiement</Label>
            <RadioGroup
              value={addMethodType}
              onValueChange={(value) => {
                setAddMethodType(value as 'mobile' | 'card');
                setSelectedProvider(null);
                setAddError(null);
              }}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mobile" id="mobile" />
                <Label htmlFor="mobile" className="flex items-center space-x-2 cursor-pointer">
                  <Smartphone className="h-4 w-4" />
                  <span>Mobile Money</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center space-x-2 cursor-pointer">
                  <CreditCard className="h-4 w-4" />
                  <span>Carte bancaire</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Formulaire Mobile Money */}
        {addMethodType === 'mobile' && (
          <>
            <div>
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+225 XX XX XX XX XX"
                value={newPhoneNumber}
                onChange={(e) => handlePhoneNumberChange(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Provider de paiement</Label>
              <RadioGroup
                value={selectedProvider || ''}
                onValueChange={(value) => setSelectedProvider(value as PaymentProvider)}
                className="mt-2"
              >
                {Object.entries(PAYMENT_PROVIDERS)
                  .filter(([key]) =>
                    key !== PaymentProvider.CASH &&
                    key !== PaymentProvider.CARD &&
                    key !== PaymentProvider.FLUTTERWAVE &&
                    key !== PaymentProvider.PAYSTACK
                  )
                  .map(([key, config]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <RadioGroupItem value={key} id={key} />
                      <Label htmlFor={key} className="flex items-center space-x-2 cursor-pointer">
                        <span className="text-lg">{config.icon}</span>
                        <span>{config.displayName}</span>
                      </Label>
                    </div>
                  ))}
              </RadioGroup>
            </div>
          </>
        )}

        {/* Formulaire Carte bancaire */}
        {addMethodType === 'card' && (
          <>
            <div>
              <Label>Provider de paiement</Label>
              <RadioGroup
                value={selectedProvider || ''}
                onValueChange={(value) => setSelectedProvider(value as PaymentProvider)}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={PaymentProvider.FLUTTERWAVE} id="flutterwave" />
                  <Label htmlFor="flutterwave" className="flex items-center space-x-2 cursor-pointer">
                    <span className="text-lg">🌍</span>
                    <div>
                      <span>Flutterwave</span>
                      <p className="text-xs text-gray-500">Cartes + Mobile Money panafricain</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={PaymentProvider.PAYSTACK} id="paystack" />
                  <Label htmlFor="paystack" className="flex items-center space-x-2 cursor-pointer">
                    <span className="text-lg">💎</span>
                    <div>
                      <span>Paystack</span>
                      <p className="text-xs text-gray-500">Cartes + Virements bancaires</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="cardNumber">Numéro de carte</Label>
                <Input
                  id="cardNumber"
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardDetails.cardNumber}
                  onChange={(e) => setCardDetails(prev => ({ ...prev, cardNumber: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="expiryMonth">Mois</Label>
                <Input
                  id="expiryMonth"
                  type="text"
                  placeholder="MM"
                  maxLength={2}
                  value={cardDetails.expiryMonth}
                  onChange={(e) => setCardDetails(prev => ({ ...prev, expiryMonth: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="expiryYear">Année</Label>
                <Input
                  id="expiryYear"
                  type="text"
                  placeholder="YY"
                  maxLength={2}
                  value={cardDetails.expiryYear}
                  onChange={(e) => setCardDetails(prev => ({ ...prev, expiryYear: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  type="text"
                  placeholder="123"
                  maxLength={4}
                  value={cardDetails.cvv}
                  onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="cardholderName">Nom du titulaire</Label>
                <Input
                  id="cardholderName"
                  type="text"
                  placeholder="John Doe"
                  value={cardDetails.cardholderName}
                  onChange={(e) => setCardDetails(prev => ({ ...prev, cardholderName: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
          </>
        )}

        {/* Erreur */}
        {addError && (
          <div className="flex items-center space-x-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{addError}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            onClick={handleAddMethod}
            disabled={isAdding || !selectedProvider || (
              addMethodType === 'mobile' ? !newPhoneNumber.trim() :
              !cardDetails.cardNumber.trim() || !cardDetails.cvv.trim() || !cardDetails.cardholderName.trim()
            )}
            className="flex-1"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Ajouter
          </Button>
          <Button
            variant="outline"
            onClick={resetForm}
          >
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={className}>
      
      {/* Erreur globale */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={clearError}>
            ×
          </Button>
        </div>
      )}

      {/* Méthodes existantes */}
      {paymentMethods.length > 0 && (
        <div className="space-y-3 mb-4">
          <h3 className="font-medium text-gray-900">Méthodes de paiement</h3>
          {paymentMethods.map(renderPaymentMethod)}
        </div>
      )}

      {/* Bouton d'ajout ou formulaire */}
      {showAddMethod && (
        <div>
          {showAddForm ? (
            renderAddMethodForm()
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowAddForm(true)}
              className="w-full border-dashed"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une méthode de paiement
            </Button>
          )}
        </div>
      )}

      {/* État de chargement */}
      {isLoading && paymentMethods.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Chargement des méthodes de paiement...</span>
        </div>
      )}

      {/* État vide */}
      {!isLoading && paymentMethods.length === 0 && !showAddForm && (
        <div className="text-center py-8">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune méthode de paiement
          </h3>
          <p className="text-gray-600 mb-4">
            Ajoutez votre première méthode de paiement pour continuer
          </p>
          {showAddMethod && (
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une méthode
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
