'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  MapPin,
  Clock,
  CreditCard,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Calculator,
  Truck,
  AlertCircle
} from 'lucide-react';
import {
  OrderPriority,
  PaymentMethod,
  VehicleType,
  Address,
  OrderItem,
  ItemCategory,
  PRIORITY_PRICING,
  VEHICLE_PRICING
} from '@/lib/orders';
import { useWaliOrders } from '@/hooks/useWaliOrders';
import { useWaliAuth } from '@/hooks/useWaliAuth';
import { DynamicPricingDisplay } from '@/components/pricing/DynamicPricingDisplay';
import { AddressSelector } from '@/components/maps/AddressSelector';
import { PaymentMethodSelector } from '@/components/payments/PaymentMethodSelector';
import { PaymentProcessor } from '@/components/payments/PaymentProcessor';
import { usePayments } from '@/hooks/usePayments';

export default function CreateOrderPage() {
  const router = useRouter();
  const { user, isClient } = useWaliAuth();
  const { createOrder, isLoading, error } = useWaliOrders();
  const { initiatePayment } = usePayments();

  const [step, setStep] = useState(1);
  const [orderData, setOrderData] = useState({
    pickupAddress: {
      label: '',
      street: '',
      district: 'Plateau',
      city: 'Abidjan',
      coordinates: { lat: 5.3364, lng: -4.0267 },
      contactName: '',
      contactPhone: '',
      instructions: '',
    } as Address,
    deliveryAddress: {
      label: '',
      street: '',
      district: 'Cocody',
      city: 'Abidjan',
      coordinates: { lat: 5.3442, lng: -3.9874 },
      contactName: '',
      contactPhone: '',
      instructions: '',
    } as Address,
    items: [
      {
        id: '1',
        name: '',
        description: '',
        quantity: 1,
        weight: 1,
        value: 0,
        fragile: false,
        category: ItemCategory.OTHER,
      }
    ] as OrderItem[],
    priority: OrderPriority.STANDARD,
    preferredVehicleType: VehicleType.MOTO,
    paymentMethod: PaymentMethod.CASH,
    notes: '',
    specialInstructions: '',
  });

  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [paymentTransactionId, setPaymentTransactionId] = useState<string>('');

  // Redirection si pas client
  if (user && !isClient) {
    router.push('/wali-dashboard');
    return null;
  }

  const districts = [
    'Plateau', 'Cocody', 'Yopougon', 'Adjamé', 'Treichville',
    'Marcory', 'Koumassi', 'Port-Bouët', 'Bingerville', 'Songon'
  ];

  const vehicleOptions = [
    {
      type: VehicleType.VELO,
      label: 'Vélo',
      description: 'Jusqu\'à 5kg, 10km max',
      price: VEHICLE_PRICING[VehicleType.VELO].basePrice,
      icon: '🚲',
    },
    {
      type: VehicleType.MOTO,
      label: 'Moto',
      description: 'Jusqu\'à 15kg, 30km max',
      price: VEHICLE_PRICING[VehicleType.MOTO].basePrice,
      icon: '🏍️',
    },
    {
      type: VehicleType.VOITURE,
      label: 'Voiture',
      description: 'Jusqu\'à 50kg, 100km max',
      price: VEHICLE_PRICING[VehicleType.VOITURE].basePrice,
      icon: '🚗',
    },
    {
      type: VehicleType.TRICYCLE,
      label: 'Tricycle',
      description: 'Jusqu\'à 100kg, 50km max',
      price: VEHICLE_PRICING[VehicleType.TRICYCLE].basePrice,
      icon: '🛺',
    },
  ];

  const priorityOptions = [
    {
      priority: OrderPriority.STANDARD,
      label: 'Standard',
      description: PRIORITY_PRICING[OrderPriority.STANDARD].estimatedTime,
      multiplier: PRIORITY_PRICING[OrderPriority.STANDARD].multiplier,
      icon: '📦',
    },
    {
      priority: OrderPriority.EXPRESS,
      label: 'Express',
      description: PRIORITY_PRICING[OrderPriority.EXPRESS].estimatedTime,
      multiplier: PRIORITY_PRICING[OrderPriority.EXPRESS].multiplier,
      icon: '⚡',
    },
    {
      priority: OrderPriority.URGENT,
      label: 'Urgent',
      description: PRIORITY_PRICING[OrderPriority.URGENT].estimatedTime,
      multiplier: PRIORITY_PRICING[OrderPriority.URGENT].multiplier,
      icon: '🚨',
    },
  ];

  const paymentOptions = [
    { method: PaymentMethod.CASH, label: 'Espèces', icon: '💵' },
    { method: PaymentMethod.ORANGE_MONEY, label: 'Orange Money', icon: '🟠' },
    { method: PaymentMethod.MTN_MONEY, label: 'MTN Mobile Money', icon: '🟡' },
    { method: PaymentMethod.WAVE, label: 'Wave', icon: '🌊' },
  ];

  const addItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      name: '',
      description: '',
      quantity: 1,
      weight: 1,
      value: 0,
      fragile: false,
      category: ItemCategory.OTHER,
    };
    setOrderData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const removeItem = (itemId: string) => {
    setOrderData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId),
    }));
  };

  const updateItem = (itemId: string, updates: Partial<OrderItem>) => {
    setOrderData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    }));
  };

  const handleCalculatePrice = async () => {
    try {
      await calculatePrice(
        orderData.pickupAddress,
        orderData.deliveryAddress,
        orderData.preferredVehicleType,
        orderData.priority
      );
    } catch (error) {
      console.error('Erreur de calcul:', error);
    }
  };

  const calculateTotalPrice = (): number => {
    // Calcul basique - en production, utiliser le service de tarification
    const basePrice = 1500; // Prix de base en FCFA
    const distanceMultiplier = 1.2;
    const priorityMultiplier = orderData.priority === OrderPriority.EXPRESS ? 1.5 : 1;
    const vehicleMultiplier = orderData.preferredVehicleType === VehicleType.VOITURE ? 2 : 1;

    return Math.round(basePrice * distanceMultiplier * priorityMultiplier * vehicleMultiplier);
  };

  const handleSubmit = async () => {
    try {
      // Créer la commande d'abord
      const newOrder = await createOrder(orderData);

      // Si paiement mobile money, initier le paiement
      if (selectedPaymentMethodId && selectedPaymentMethodId !== 'cash_1') {
        const paymentResponse = await initiatePayment({
          orderId: newOrder.id,
          amount: calculateTotalPrice(),
          currency: 'XOF',
          paymentMethodId: selectedPaymentMethodId,
          description: `Paiement commande ${newOrder.orderNumber}`,
          customerPhone: user?.phone || '',
          customerName: user?.name || '',
        });

        if (paymentResponse.success) {
          setPaymentTransactionId(paymentResponse.transactionId);
          setStep(6); // Aller à l'étape de traitement du paiement
          return;
        }
      }

      // Pour paiement cash ou si erreur, aller directement à la confirmation
      alert(`Commande ${newOrder.orderNumber} créée avec succès !`);
      router.push(`/order/${newOrder.id}`);
    } catch (error) {
      console.error('Erreur de création:', error);
    }
  };

  const nextStep = () => {
    if (step < 6) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Package className="h-12 w-12 text-blue-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">WALI</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Nouvelle Commande</h1>
          <p className="text-gray-600 mt-2">
            Créez votre demande de livraison en quelques étapes
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Étape {Math.min(step, 5)} sur 5</span>
            <span>{Math.round((Math.min(step, 5) / 5) * 100)}%</span>
          </div>
          <Progress value={(Math.min(step, 5) / 5) * 100} className="h-2" />

          <div className="flex justify-between mt-4 text-xs text-gray-500">
            <span className={step >= 1 ? 'text-blue-600 font-medium' : ''}>Adresses</span>
            <span className={step >= 2 ? 'text-blue-600 font-medium' : ''}>Articles</span>
            <span className={step >= 3 ? 'text-blue-600 font-medium' : ''}>Options</span>
            <span className={step >= 4 ? 'text-blue-600 font-medium' : ''}>Paiement</span>
            <span className={step >= 5 ? 'text-blue-600 font-medium' : ''}>Confirmation</span>
          </div>
        </div>

        {/* Étape 1: Adresses */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Adresses de récupération et livraison</span>
              </CardTitle>
              <CardDescription>
                Indiquez où récupérer et livrer votre colis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Sélecteur d'adresse de récupération */}
              <AddressSelector
                title="Adresse de récupération"
                description="Où récupérer votre colis"
                type="pickup"
                placeholder="Rechercher l'adresse de récupération..."
                initialAddress={orderData.pickupAddress}
                onAddressSelect={(address) => setOrderData(prev => ({
                  ...prev,
                  pickupAddress: address
                }))}
              />

              {/* Sélecteur d'adresse de livraison */}
              <AddressSelector
                title="Adresse de livraison"
                description="Où livrer votre colis"
                type="delivery"
                placeholder="Rechercher l'adresse de livraison..."
                initialAddress={orderData.deliveryAddress}
                onAddressSelect={(address) => setOrderData(prev => ({
                  ...prev,
                  deliveryAddress: address
                }))}
              />

              {/* Informations de contact supplémentaires */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-green-900">Contact récupération</h3>
                  <div>
                    <Label htmlFor="pickupContact">Nom du contact</Label>
                    <Input
                      id="pickupContact"
                      placeholder="Nom de la personne"
                      value={orderData.pickupAddress.contactName || ''}
                      onChange={(e) => setOrderData(prev => ({
                        ...prev,
                        pickupAddress: { ...prev.pickupAddress, contactName: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pickupPhone">Téléphone</Label>
                    <Input
                      id="pickupPhone"
                      placeholder="+225 XX XX XX XX XX"
                      value={orderData.pickupAddress.contactPhone || ''}
                      onChange={(e) => setOrderData(prev => ({
                        ...prev,
                        pickupAddress: { ...prev.pickupAddress, contactPhone: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-blue-900">Contact livraison</h3>
                  <div>
                    <Label htmlFor="deliveryContact">Nom du contact</Label>
                    <Input
                      id="deliveryContact"
                      placeholder="Nom de la personne"
                      value={orderData.deliveryAddress.contactName || ''}
                      onChange={(e) => setOrderData(prev => ({
                        ...prev,
                        deliveryAddress: { ...prev.deliveryAddress, contactName: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="deliveryPhone">Téléphone</Label>
                    <Input
                      id="deliveryPhone"
                      placeholder="+225 XX XX XX XX XX"
                      value={orderData.deliveryAddress.contactPhone || ''}
                      onChange={(e) => setOrderData(prev => ({
                        ...prev,
                        deliveryAddress: { ...prev.deliveryAddress, contactPhone: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link href="/wali-dashboard">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Annuler
                  </Link>
                </Button>
                <Button onClick={nextStep}>
                  Continuer
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Étape 2: Articles */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Articles à livrer</span>
              </CardTitle>
              <CardDescription>
                Décrivez ce que vous souhaitez faire livrer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {orderData.items.map((item, index) => (
                <div key={item.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Article {index + 1}</h3>
                    {orderData.items.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nom de l'article *</Label>
                      <Input
                        placeholder="Ex: Attiéké Poisson, Documents..."
                        value={item.name}
                        onChange={(e) => updateItem(item.id, { name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Catégorie</Label>
                      <Select
                        value={item.category}
                        onValueChange={(value) => updateItem(item.id, { category: value as ItemCategory })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ItemCategory.FOOD}>🍽️ Nourriture</SelectItem>
                          <SelectItem value={ItemCategory.DOCUMENTS}>📄 Documents</SelectItem>
                          <SelectItem value={ItemCategory.ELECTRONICS}>📱 Électronique</SelectItem>
                          <SelectItem value={ItemCategory.CLOTHING}>👕 Vêtements</SelectItem>
                          <SelectItem value={ItemCategory.PHARMACY}>💊 Pharmacie</SelectItem>
                          <SelectItem value={ItemCategory.GROCERIES}>🛒 Courses</SelectItem>
                          <SelectItem value={ItemCategory.OTHER}>📦 Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Quantité</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div>
                      <Label>Poids estimé (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={item.weight}
                        onChange={(e) => updateItem(item.id, { weight: parseFloat(e.target.value) || 0.1 })}
                      />
                    </div>
                    <div>
                      <Label>Valeur (FCFA) - optionnel</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Pour assurance"
                        value={item.value || ''}
                        onChange={(e) => updateItem(item.id, { value: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`fragile-${item.id}`}
                        checked={item.fragile}
                        onChange={(e) => updateItem(item.id, { fragile: e.target.checked })}
                      />
                      <Label htmlFor={`fragile-${item.id}`}>Article fragile</Label>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Description (optionnel)</Label>
                      <Textarea
                        placeholder="Détails supplémentaires..."
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addItem}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un article
              </Button>

              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
                <Button onClick={nextStep}>
                  Continuer
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Étape 3: Options */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Options de livraison</span>
              </CardTitle>
              <CardDescription>
                Choisissez le type de véhicule, la priorité et le paiement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Type de véhicule */}
              <div>
                <Label className="text-base font-medium">Type de véhicule</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  {vehicleOptions.map((option) => (
                    <div
                      key={option.type}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        orderData.preferredVehicleType === option.type
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setOrderData(prev => ({ ...prev, preferredVehicleType: option.type }))}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{option.icon}</span>
                          <div>
                            <h4 className="font-medium">{option.label}</h4>
                            <p className="text-sm text-gray-600">{option.description}</p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {option.price} FCFA
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priorité */}
              <div>
                <Label className="text-base font-medium">Priorité de livraison</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  {priorityOptions.map((option) => (
                    <div
                      key={option.priority}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        orderData.priority === option.priority
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setOrderData(prev => ({ ...prev, priority: option.priority }))}
                    >
                      <div className="text-center">
                        <span className="text-2xl">{option.icon}</span>
                        <h4 className="font-medium mt-2">{option.label}</h4>
                        <p className="text-sm text-gray-600">{option.description}</p>
                        {option.multiplier > 1 && (
                          <Badge className="mt-2">
                            +{Math.round((option.multiplier - 1) * 100)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Méthode de paiement */}
              <div>
                <Label className="text-base font-medium">Méthode de paiement</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  {paymentOptions.map((option) => (
                    <div
                      key={option.method}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        orderData.paymentMethod === option.method
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setOrderData(prev => ({ ...prev, paymentMethod: option.method }))}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{option.icon}</span>
                        <span className="font-medium">{option.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes pour le livreur (optionnel)</Label>
                <Textarea
                  id="notes"
                  placeholder="Instructions spéciales, code d'accès, etc."
                  value={orderData.notes}
                  onChange={(e) => setOrderData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              {/* Calcul du prix dynamique */}
              <DynamicPricingDisplay
                pickupAddress={orderData.pickupAddress}
                deliveryAddress={orderData.deliveryAddress}
                vehicleType={orderData.preferredVehicleType}
                priority={orderData.priority}
                onPriceCalculated={(pricingData) => {
                  // Mettre à jour le pricing dans l'état local si nécessaire
                  console.log('Prix calculé:', pricingData);
                }}
              />

              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
                <Button onClick={nextStep}>
                  Continuer
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Étape 4: Paiement */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Méthode de paiement</span>
              </CardTitle>
              <CardDescription>
                Choisissez votre méthode de paiement préférée
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              <PaymentMethodSelector
                selectedMethodId={selectedPaymentMethodId}
                onMethodSelect={setSelectedPaymentMethodId}
                amount={calculateTotalPrice()}
                showAddMethod={true}
              />

              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={!selectedPaymentMethodId}
                >
                  Continuer
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Étape 5: Confirmation */}
        {step === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Confirmation de commande</span>
              </CardTitle>
              <CardDescription>
                Vérifiez les détails avant de confirmer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Résumé */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Adresses */}
                <div className="space-y-4">
                  <h3 className="font-medium">📍 Récupération</h3>
                  <div className="p-3 bg-green-50 rounded-lg text-sm">
                    <p className="font-medium">{orderData.pickupAddress.label}</p>
                    <p>{orderData.pickupAddress.street}</p>
                    <p>{orderData.pickupAddress.district}, {orderData.pickupAddress.city}</p>
                    {orderData.pickupAddress.contactName && (
                      <p>Contact: {orderData.pickupAddress.contactName}</p>
                    )}
                  </div>

                  <h3 className="font-medium">🎯 Livraison</h3>
                  <div className="p-3 bg-blue-50 rounded-lg text-sm">
                    <p className="font-medium">{orderData.deliveryAddress.label}</p>
                    <p>{orderData.deliveryAddress.street}</p>
                    <p>{orderData.deliveryAddress.district}, {orderData.deliveryAddress.city}</p>
                    {orderData.deliveryAddress.contactName && (
                      <p>Contact: {orderData.deliveryAddress.contactName}</p>
                    )}
                  </div>
                </div>

                {/* Articles et options */}
                <div className="space-y-4">
                  <h3 className="font-medium">📦 Articles</h3>
                  <div className="space-y-2">
                    {orderData.items.map((item, index) => (
                      <div key={item.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                        <p className="font-medium">{item.name}</p>
                        <p>Quantité: {item.quantity} • Poids: {item.weight}kg</p>
                        {item.fragile && <Badge variant="outline" className="mt-1">Fragile</Badge>}
                      </div>
                    ))}
                  </div>

                  <h3 className="font-medium">⚙️ Options</h3>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                    <p>Véhicule: {vehicleOptions.find(v => v.type === orderData.preferredVehicleType)?.label}</p>
                    <p>Priorité: {priorityOptions.find(p => p.priority === orderData.priority)?.label}</p>
                    <p>Paiement: {paymentOptions.find(p => p.method === orderData.paymentMethod)?.label}</p>
                  </div>
                </div>
              </div>

              {/* Prix final */}
              {pricing && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-3">💰 Prix total</h3>
                  <div className="text-2xl font-bold text-blue-900">
                    {pricing.totalPrice} FCFA
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Paiement par {paymentOptions.find(p => p.method === orderData.paymentMethod)?.label}
                  </p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-2 text-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? (
                    'Création en cours...'
                  ) : (
                    'Confirmer la commande'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Étape 6: Traitement du paiement */}
        {step === 6 && paymentTransactionId && (
          <PaymentProcessor
            transactionId={paymentTransactionId}
            onPaymentComplete={(transaction) => {
              alert('Paiement réussi ! Votre commande est confirmée.');
              router.push(`/order/${transaction.orderId}`);
            }}
            onPaymentFailed={(transaction) => {
              alert('Échec du paiement. Vous pouvez réessayer ou choisir le paiement en espèces.');
              setStep(4); // Retour à la sélection de paiement
            }}
          />
        )}
      </div>
    </div>
  );
}