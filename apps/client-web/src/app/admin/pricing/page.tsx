'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  DollarSign, 
  TrendingUp, 
  MapPin,
  Clock,
  Car,
  Tag,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { 
  VehicleType, 
  OrderPriority,
  VEHICLE_PRICING,
  PRIORITY_PRICING,
  ABIDJAN_ZONES
} from '@/lib/orders';

export default function PricingAdminPage() {
  const [vehiclePricing, setVehiclePricing] = useState(VEHICLE_PRICING);
  const [priorityPricing, setPriorityPricing] = useState(PRIORITY_PRICING);
  const [zonePricing, setZonePricing] = useState(ABIDJAN_ZONES);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Simulation de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Ici on sauvegarderait en base de données
      console.log('Sauvegarde des paramètres:', {
        vehiclePricing,
        priorityPricing,
        zonePricing
      });
      
      setLastSaved(new Date());
      alert('Paramètres sauvegardés avec succès !');
    } catch (error) {
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const updateVehiclePrice = (vehicleType: VehicleType, field: string, value: number) => {
    setVehiclePricing(prev => ({
      ...prev,
      [vehicleType]: {
        ...prev[vehicleType],
        [field]: value
      }
    }));
  };

  const updatePriorityMultiplier = (priority: OrderPriority, multiplier: number) => {
    setPriorityPricing(prev => ({
      ...prev,
      [priority]: {
        ...prev[priority],
        multiplier
      }
    }));
  };

  const updateZoneMultiplier = (zone: string, multiplier: number) => {
    setZonePricing(prev => ({
      ...prev,
      [zone]: {
        ...prev[zone],
        multiplier
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Administration des Prix</h1>
            <p className="text-gray-600 mt-2">
              Configurez les tarifs et paramètres de pricing WALI Livraison
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {lastSaved && (
              <div className="text-sm text-gray-600">
                Dernière sauvegarde: {lastSaved.toLocaleTimeString('fr-FR')}
              </div>
            )}
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Car className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Types véhicules</p>
                  <p className="text-xl font-bold">{Object.keys(vehiclePricing).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Niveaux priorité</p>
                  <p className="text-xl font-bold">{Object.keys(priorityPricing).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Zones Abidjan</p>
                  <p className="text-xl font-bold">{Object.keys(zonePricing).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Prix moyen</p>
                  <p className="text-xl font-bold">
                    {Math.round(Object.values(vehiclePricing).reduce((sum, v) => sum + v.basePrice, 0) / Object.keys(vehiclePricing).length)} FCFA
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration */}
        <Tabs defaultValue="vehicles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="vehicles">Véhicules</TabsTrigger>
            <TabsTrigger value="priority">Priorités</TabsTrigger>
            <TabsTrigger value="zones">Zones</TabsTrigger>
            <TabsTrigger value="promotions">Promotions</TabsTrigger>
          </TabsList>

          {/* Configuration véhicules */}
          <TabsContent value="vehicles">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Car className="h-5 w-5" />
                  <span>Tarification par véhicule</span>
                </CardTitle>
                <CardDescription>
                  Configurez les prix de base et par kilomètre pour chaque type de véhicule
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(vehiclePricing).map(([vehicleType, pricing]) => (
                    <div key={vehicleType} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">{vehicleType}</h3>
                        <Badge variant="outline">{pricing.description}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor={`${vehicleType}-base`}>Prix de base (FCFA)</Label>
                          <Input
                            id={`${vehicleType}-base`}
                            type="number"
                            value={pricing.basePrice}
                            onChange={(e) => updateVehiclePrice(
                              vehicleType as VehicleType, 
                              'basePrice', 
                              parseInt(e.target.value) || 0
                            )}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`${vehicleType}-km`}>Prix/km (FCFA)</Label>
                          <Input
                            id={`${vehicleType}-km`}
                            type="number"
                            value={pricing.pricePerKm}
                            onChange={(e) => updateVehiclePrice(
                              vehicleType as VehicleType, 
                              'pricePerKm', 
                              parseInt(e.target.value) || 0
                            )}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`${vehicleType}-weight`}>Poids max (kg)</Label>
                          <Input
                            id={`${vehicleType}-weight`}
                            type="number"
                            value={pricing.maxWeight}
                            onChange={(e) => updateVehiclePrice(
                              vehicleType as VehicleType, 
                              'maxWeight', 
                              parseInt(e.target.value) || 0
                            )}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`${vehicleType}-distance`}>Distance max (km)</Label>
                          <Input
                            id={`${vehicleType}-distance`}
                            type="number"
                            value={pricing.maxDistance}
                            onChange={(e) => updateVehiclePrice(
                              vehicleType as VehicleType, 
                              'maxDistance', 
                              parseInt(e.target.value) || 0
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration priorités */}
          <TabsContent value="priority">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Tarification par priorité</span>
                </CardTitle>
                <CardDescription>
                  Ajustez les multiplicateurs selon l'urgence de livraison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(priorityPricing).map(([priority, config]) => (
                    <div key={priority} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-medium">{priority}</h3>
                          <p className="text-sm text-gray-600">{config.description}</p>
                        </div>
                        <Badge className={
                          config.multiplier > 1.5 ? 'bg-red-100 text-red-800' :
                          config.multiplier > 1.2 ? 'bg-orange-100 text-orange-800' :
                          'bg-green-100 text-green-800'
                        }>
                          {config.estimatedTime}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`${priority}-multiplier`}>Multiplicateur</Label>
                          <Input
                            id={`${priority}-multiplier`}
                            type="number"
                            step="0.1"
                            min="0.5"
                            max="3.0"
                            value={config.multiplier}
                            onChange={(e) => updatePriorityMultiplier(
                              priority as OrderPriority, 
                              parseFloat(e.target.value) || 1.0
                            )}
                          />
                        </div>
                        
                        <div className="flex items-end">
                          <div className="text-sm text-gray-600">
                            Supplément: {Math.round((config.multiplier - 1) * 100)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration zones */}
          <TabsContent value="zones">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Tarification par zone</span>
                </CardTitle>
                <CardDescription>
                  Ajustez les prix selon la difficulté d'accès des communes d'Abidjan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(zonePricing).map(([zone, config]) => (
                    <div key={zone} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{config.name}</h3>
                        <Badge className={
                          config.multiplier > 1.3 ? 'bg-red-100 text-red-800' :
                          config.multiplier > 1.1 ? 'bg-orange-100 text-orange-800' :
                          'bg-green-100 text-green-800'
                        }>
                          x{config.multiplier}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{config.description}</p>
                      
                      <div>
                        <Label htmlFor={`${zone}-multiplier`}>Multiplicateur</Label>
                        <Input
                          id={`${zone}-multiplier`}
                          type="number"
                          step="0.1"
                          min="0.8"
                          max="2.0"
                          value={config.multiplier}
                          onChange={(e) => updateZoneMultiplier(
                            zone, 
                            parseFloat(e.target.value) || 1.0
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration promotions */}
          <TabsContent value="promotions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Tag className="h-5 w-5" />
                  <span>Codes promotionnels</span>
                </CardTitle>
                <CardDescription>
                  Gérez les codes promo et offres spéciales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  
                  {/* Codes actifs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg border-green-200 bg-green-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold">WALI2024</span>
                        <Badge className="bg-green-100 text-green-800">Actif</Badge>
                      </div>
                      <p className="text-sm text-green-700 mb-2">15% de réduction (max 1000 FCFA)</p>
                      <div className="text-xs text-green-600">
                        Utilisé 45/1000 fois • Expire le 31/12/2024
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg border-blue-200 bg-blue-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold">NOUVEAU</span>
                        <Badge className="bg-blue-100 text-blue-800">Actif</Badge>
                      </div>
                      <p className="text-sm text-blue-700 mb-2">500 FCFA de réduction</p>
                      <div className="text-xs text-blue-600">
                        Utilisé 123/500 fois • Expire le 31/12/2024
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg border-purple-200 bg-purple-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold">LIVRAISON</span>
                        <Badge className="bg-purple-100 text-purple-800">Actif</Badge>
                      </div>
                      <p className="text-sm text-purple-700 mb-2">Livraison gratuite</p>
                      <div className="text-xs text-purple-600">
                        Utilisé 67/200 fois • Expire le 31/12/2024
                      </div>
                    </div>
                  </div>

                  {/* Bouton d'ajout */}
                  <Button className="w-full" variant="outline">
                    <Tag className="h-4 w-4 mr-2" />
                    Créer un nouveau code promo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Alertes */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-900">Attention</h3>
                <p className="text-sm text-yellow-800 mt-1">
                  Les modifications de prix affectent immédiatement toutes les nouvelles commandes. 
                  Assurez-vous de tester les calculs avant de sauvegarder.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
