'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Calculator, Package } from 'lucide-react';
import { usePriceCalculator } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { OrderType } from '@wali/shared';

interface DeliveryFormData {
  pickupAddress: string;
  deliveryAddress: string;
  itemName: string;
  itemDescription: string;
  notes: string;
}

export function DeliveryForm() {
  const { isAuthenticated } = useAuth();
  const { isCalculating, priceResult, calculatePrice, resetCalculation } = usePriceCalculator();

  const [formData, setFormData] = useState<DeliveryFormData>({
    pickupAddress: '',
    deliveryAddress: '',
    itemName: '',
    itemDescription: '',
    notes: '',
  });

  const handleInputChange = (field: keyof DeliveryFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculatePrice = async () => {
    if (!formData.pickupAddress || !formData.deliveryAddress) {
      alert('Veuillez remplir les adresses de récupération et de livraison');
      return;
    }

    try {
      // Pour l'instant, utilisons des coordonnées simulées
      // TODO: Intégrer la géolocalisation réelle
      await calculatePrice({
        type: OrderType.DELIVERY,
        pickupLatitude: 5.3364, // Coordonnées d'Abidjan
        pickupLongitude: -4.0267,
        deliveryLatitude: 5.3400,
        deliveryLongitude: -4.0300,
        items: [{
          name: formData.itemName,
          description: formData.itemDescription,
          quantity: 1,
          unitPrice: 0, // Prix sera calculé par le backend
        }],
      });
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  };

  const handleCreateOrder = () => {
    if (!isAuthenticated) {
      // Rediriger vers la page d'authentification pour créer la commande
      window.location.href = '/auth?redirect=/orders/create';
      return;
    }

    // TODO: Implémenter la création de commande réelle
    // Pour l'instant, rediriger vers le dashboard
    window.location.href = '/dashboard';
  };

  return (
    <div className="space-y-6">
      {/* Formulaire principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Adresses */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="pickupAddress">Adresse de récupération *</Label>
            <div className="relative mt-1">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="pickupAddress"
                placeholder="Où récupérer le colis ?"
                value={formData.pickupAddress}
                onChange={(e) => handleInputChange('pickupAddress', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="deliveryAddress">Adresse de livraison *</Label>
            <div className="relative mt-1">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="deliveryAddress"
                placeholder="Où livrer le colis ?"
                value={formData.deliveryAddress}
                onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Détails du colis */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="itemName">Nom de l'article *</Label>
            <div className="relative mt-1">
              <Package className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="itemName"
                placeholder="Qu'est-ce que vous envoyez ?"
                value={formData.itemName}
                onChange={(e) => handleInputChange('itemName', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="itemDescription">Description (optionnel)</Label>
            <Textarea
              id="itemDescription"
              placeholder="Décrivez votre colis..."
              value={formData.itemDescription}
              onChange={(e) => handleInputChange('itemDescription', e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Instructions spéciales (optionnel)</Label>
        <Textarea
          id="notes"
          placeholder="Instructions pour le livreur..."
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          rows={2}
        />
      </div>

      {/* Bouton de calcul */}
      <div className="flex justify-center">
        <Button
          onClick={handleCalculatePrice}
          disabled={isCalculating || !formData.pickupAddress || !formData.deliveryAddress}
          className="flex items-center space-x-2"
          size="lg"
        >
          <Calculator className="h-4 w-4" />
          <span>{isCalculating ? 'Calcul en cours...' : 'Calculer le Prix'}</span>
        </Button>
      </div>

      {/* Résultat du calcul */}
      {priceResult && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-primary">Prix de la Livraison</CardTitle>
            <CardDescription>
              Distance: {priceResult.distance} km • Durée estimée: {priceResult.estimatedDuration} min
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Prix de base:</span>
                <span>{priceResult.basePrice.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span>Frais de livraison:</span>
                <span>{priceResult.deliveryFee.toLocaleString()} FCFA</span>
              </div>
              <hr />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span className="text-primary">{priceResult.totalAmount.toLocaleString()} FCFA</span>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <Button 
                onClick={handleCalculatePrice}
                variant="outline"
                className="flex-1"
              >
                Recalculer
              </Button>
              <Button 
                onClick={handleCreateOrder}
                className="flex-1"
              >
                Créer la Commande
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations utiles */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Conseils pour votre livraison</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Soyez précis dans vos adresses pour éviter les retards</li>
          <li>• Ajoutez des points de repère dans les instructions</li>
          <li>• Vérifiez que votre téléphone est joignable</li>
          <li>• Les livraisons sont disponibles 7j/7 de 6h à 22h</li>
        </ul>
      </div>
    </div>
  );
}
