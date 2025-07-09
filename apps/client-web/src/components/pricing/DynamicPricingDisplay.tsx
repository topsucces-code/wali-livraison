'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calculator, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  CloudRain,
  Car,
  Users,
  Zap,
  Tag,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { 
  Address, 
  VehicleType, 
  OrderPriority 
} from '@/lib/orders';
import { advancedPricingEngine } from '@/lib/advanced-pricing';

interface DynamicPricingDisplayProps {
  pickupAddress: Address;
  deliveryAddress: Address;
  vehicleType: VehicleType;
  priority: OrderPriority;
  onPriceCalculated?: (pricing: any) => void;
}

export function DynamicPricingDisplay({
  pickupAddress,
  deliveryAddress,
  vehicleType,
  priority,
  onPriceCalculated
}: DynamicPricingDisplayProps) {
  const [pricing, setPricing] = useState<any>(null);
  const [promotionCode, setPromotionCode] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<Date>(new Date());

  useEffect(() => {
    calculatePrice();
  }, [pickupAddress, deliveryAddress, vehicleType, priority, scheduledTime]);

  const calculatePrice = async () => {
    if (!pickupAddress.street || !deliveryAddress.street) return;
    
    setIsCalculating(true);
    
    try {
      // Simulation d'un délai pour l'effet de calcul
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const result = advancedPricingEngine.calculateAdvancedPrice(
        pickupAddress,
        deliveryAddress,
        vehicleType,
        priority,
        scheduledTime,
        promotionCode || undefined
      );
      
      setPricing(result);
      onPriceCalculated?.(result);
    } catch (error) {
      console.error('Erreur de calcul:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const applyPromotionCode = () => {
    calculatePrice();
  };

  const getFactorIcon = (factorName: string) => {
    switch (factorName) {
      case 'timeOfDay': return <Clock className="h-4 w-4" />;
      case 'traffic': return <Car className="h-4 w-4" />;
      case 'weather': return <CloudRain className="h-4 w-4" />;
      case 'demand': return <TrendingUp className="h-4 w-4" />;
      case 'driverAvailability': return <Users className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getFactorLabel = (factorName: string) => {
    switch (factorName) {
      case 'timeOfDay': return 'Heure';
      case 'dayOfWeek': return 'Jour';
      case 'traffic': return 'Trafic';
      case 'weather': return 'Météo';
      case 'demand': return 'Demande';
      case 'driverAvailability': return 'Disponibilité';
      default: return factorName;
    }
  };

  const getFactorColor = (value: number) => {
    if (value > 1.2) return 'text-red-600';
    if (value > 1.1) return 'text-orange-600';
    if (value < 0.95) return 'text-green-600';
    return 'text-gray-600';
  };

  if (isCalculating) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Calcul du prix en cours...</p>
            <p className="text-sm text-gray-500 mt-1">
              Analyse du trafic, météo et disponibilité des livreurs
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pricing) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calculator className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Remplissez les adresses pour voir le prix</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Prix principal */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Prix de livraison</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-blue-900">
              {pricing.totalPrice} FCFA
            </div>
            {pricing.promotion && (
              <div className="text-sm text-green-600 mt-1">
                Économie de {pricing.promotion.discount} FCFA avec {pricing.promotion.code}
              </div>
            )}
          </div>
          
          {/* Estimation de temps */}
          <div className="p-3 bg-white rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Temps estimé</span>
              <Badge variant="outline">
                {pricing.timeEstimate.confidence}% de confiance
              </Badge>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {pricing.timeEstimate.estimatedMinutes} minutes
            </div>
            {pricing.timeEstimate.factors.length > 0 && (
              <div className="text-xs text-gray-600 mt-1">
                Facteurs: {pricing.timeEstimate.factors.join(', ')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Code promotionnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Tag className="h-5 w-5" />
            <span>Code promotionnel</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Entrez votre code promo"
              value={promotionCode}
              onChange={(e) => setPromotionCode(e.target.value.toUpperCase())}
            />
            <Button onClick={applyPromotionCode} variant="outline">
              Appliquer
            </Button>
          </div>
          
          {pricing.promotion && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Code appliqué: {pricing.promotion.code}</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                {pricing.promotion.description}
              </p>
            </div>
          )}
          
          {/* Codes disponibles */}
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Codes disponibles:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-gray-50 rounded">
                <span className="font-mono font-bold">WALI2024</span>
                <p className="text-gray-600">15% de réduction</p>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <span className="font-mono font-bold">NOUVEAU</span>
                <p className="text-gray-600">500 FCFA offerts</p>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <span className="font-mono font-bold">LIVRAISON</span>
                <p className="text-gray-600">Livraison gratuite</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Facteurs de prix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Facteurs de tarification</span>
          </CardTitle>
          <CardDescription>
            Prix ajusté selon les conditions en temps réel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(pricing.appliedFactors).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="flex items-center justify-center mb-1">
                  {getFactorIcon(key)}
                </div>
                <div className="text-sm font-medium">{getFactorLabel(key)}</div>
                <div className={`text-lg font-bold ${getFactorColor(value as number)}`}>
                  {value === 1 ? '=' : value > 1 ? '+' : '-'}
                  {Math.abs(((value as number) - 1) * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
          
          {/* Indicateur de demande */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Demande actuelle</span>
              <Badge className={
                pricing.appliedFactors.demand > 1.3 ? 'bg-red-100 text-red-800' :
                pricing.appliedFactors.demand > 1.1 ? 'bg-orange-100 text-orange-800' :
                'bg-green-100 text-green-800'
              }>
                {pricing.appliedFactors.demand > 1.3 ? 'Très forte' :
                 pricing.appliedFactors.demand > 1.1 ? 'Forte' : 'Normale'}
              </Badge>
            </div>
            <Progress 
              value={Math.min(pricing.appliedFactors.demand * 50, 100)} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Détail des prix */}
      <Card>
        <CardHeader>
          <CardTitle>Détail du calcul</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {pricing.breakdown.map((item: any, index: number) => (
              <div key={index} className="flex justify-between text-sm">
                <span className={item.amount < 0 ? 'text-green-600' : 'text-gray-700'}>
                  {item.label}
                </span>
                <span className={`font-medium ${item.amount < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                  {item.amount > 0 ? '+' : ''}{item.amount} FCFA
                </span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span>{pricing.totalPrice} FCFA</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Programmation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Programmer la livraison</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="scheduledTime">Heure souhaitée</Label>
              <Input
                id="scheduledTime"
                type="datetime-local"
                value={scheduledTime.toISOString().slice(0, 16)}
                onChange={(e) => setScheduledTime(new Date(e.target.value))}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            
            {scheduledTime > new Date() && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 text-blue-800">
                  <Info className="h-4 w-4" />
                  <span className="text-sm font-medium">Livraison programmée</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Prix calculé pour {scheduledTime.toLocaleDateString('fr-FR')} à {scheduledTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conseils d'optimisation */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-900 flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Conseils pour économiser</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-yellow-800">
            {pricing.appliedFactors.timeOfDay > 1.2 && (
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-4 w-4" />
                <span>Évitez les heures de pointe pour économiser jusqu'à 40%</span>
              </div>
            )}
            {pricing.appliedFactors.demand > 1.3 && (
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Forte demande actuellement, prix réduits en soirée</span>
              </div>
            )}
            {!pricing.promotion && (
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4" />
                <span>Utilisez un code promo pour des réductions jusqu'à 15%</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
