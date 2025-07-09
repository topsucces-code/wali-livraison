'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, MapPin, Clock, Package, Loader2, AlertCircle, CheckCircle, Navigation, Route } from 'lucide-react';
import { usePriceCalculator } from '@/hooks/useOrders';
import { OrderType } from '@wali/shared';
import { SimpleMap, LatLng, SimpleMapMarker } from '@/components/maps/SimpleMap';
import { useGoogleMaps } from '@/components/maps/GoogleMapsProvider';

interface PriceCalculatorProps {
  onPriceCalculated?: (result: any) => void;
}

export function PriceCalculator({ onPriceCalculated }: PriceCalculatorProps) {
  const { isCalculating, priceResult, calculatePrice, resetCalculation } = usePriceCalculator();
  const { isLoaded: isMapsLoaded } = useGoogleMaps();

  const [formData, setFormData] = useState({
    type: OrderType.DELIVERY,
    pickupAddress: '',
    deliveryAddress: '',
  });

  const [pickupCoords, setPickupCoords] = useState<LatLng | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<LatLng | null>(null);
  const [isGeocodingPickup, setIsGeocodingPickup] = useState(false);
  const [isGeocodingDelivery, setIsGeocodingDelivery] = useState(false);
  const [geocodingErrors, setGeocodingErrors] = useState<{
    pickup?: string;
    delivery?: string;
  }>({});
  const [mapCenter, setMapCenter] = useState<LatLng>({ lat: 5.3364, lng: -4.0267 }); // Plateau, Abidjan
  const [mapZoom, setMapZoom] = useState(13);

  // Calculer automatiquement le centre et zoom de la carte
  useEffect(() => {
    if (pickupCoords && deliveryCoords) {
      // Calculer le centre entre les deux points
      const centerLat = (pickupCoords.lat + deliveryCoords.lat) / 2;
      const centerLng = (pickupCoords.lng + deliveryCoords.lng) / 2;
      setMapCenter({ lat: centerLat, lng: centerLng });

      // Calculer le zoom approprié basé sur la distance
      const latDiff = Math.abs(pickupCoords.lat - deliveryCoords.lat);
      const lngDiff = Math.abs(pickupCoords.lng - deliveryCoords.lng);
      const maxDiff = Math.max(latDiff, lngDiff);

      let zoom = 13;
      if (maxDiff > 0.1) zoom = 10;
      else if (maxDiff > 0.05) zoom = 11;
      else if (maxDiff > 0.02) zoom = 12;
      else if (maxDiff > 0.01) zoom = 13;
      else zoom = 14;

      setMapZoom(zoom);
    } else if (pickupCoords) {
      setMapCenter(pickupCoords);
      setMapZoom(15);
    } else if (deliveryCoords) {
      setMapCenter(deliveryCoords);
      setMapZoom(15);
    }
  }, [pickupCoords, deliveryCoords]);

  const handleCalculate = async () => {
    // Validation des adresses
    if (!formData.pickupAddress || !formData.deliveryAddress) {
      alert('Veuillez remplir les deux adresses');
      return;
    }

    // Vérifier que les adresses ont été géocodées
    if (!pickupCoords && formData.pickupAddress.length > 5) {
      alert('Adresse de récupération non trouvée. Veuillez vérifier l\'orthographe.');
      return;
    }

    if (!deliveryCoords && formData.deliveryAddress.length > 5) {
      alert('Adresse de livraison non trouvée. Veuillez vérifier l\'orthographe.');
      return;
    }

    // Utiliser les coordonnées réelles si disponibles, sinon coordonnées par défaut d'Abidjan
    const pickupLat = pickupCoords?.lat || 5.3364; // Plateau
    const pickupLng = pickupCoords?.lng || -4.0267;
    const deliveryLat = deliveryCoords?.lat || 5.3400; // Cocody
    const deliveryLng = deliveryCoords?.lng || -4.0300;

    try {
      const result = await calculatePrice({
        type: formData.type,
        pickupLatitude: pickupLat,
        pickupLongitude: pickupLng,
        deliveryLatitude: deliveryLat,
        deliveryLongitude: deliveryLng,
        items: formData.type === OrderType.SHOPPING ? [
          { name: 'Article exemple', quantity: 1, unitPrice: 1000 }
        ] : undefined,
      });

      onPriceCalculated?.(result);
    } catch (error) {
      // Gestion d'erreur améliorée
      console.error('Erreur de calcul de prix:', error);

      // Si le backend n'est pas disponible, utiliser un calcul local
      const distance = Math.sqrt(
        Math.pow(pickupLat - deliveryLat, 2) +
        Math.pow(pickupLng - deliveryLng, 2)
      ) * 111; // Conversion approximative en km

      const basePrice = formData.type === OrderType.DELIVERY ? 1000 :
                       formData.type === OrderType.FOOD ? 1500 : 2000;
      const deliveryFee = distance * 200; // 200 FCFA par km
      const totalAmount = basePrice + deliveryFee;

      const fallbackResult = {
        basePrice,
        deliveryFee,
        serviceFee: 0,
        totalAmount,
        distance,
        estimatedDuration: distance * 3, // 3 min par km
        breakdown: {
          distanceFee: deliveryFee,
          timeFee: 0,
          typeFee: 0,
          itemsFee: 0,
        }
      };

      onPriceCalculated?.(fallbackResult);

      // Afficher un message d'information
      alert('⚠️ Calcul en mode hors ligne. Les prix peuvent varier lors de la commande réelle.');
    }
  };

  // Géocodage d'adresse amélioré avec gestion d'erreurs
  const geocodeAddress = async (address: string, type: 'pickup' | 'delivery'): Promise<LatLng | null> => {
    if (!isMapsLoaded || !window.google?.maps) {
      setGeocodingErrors(prev => ({
        ...prev,
        [type]: 'Google Maps non disponible'
      }));
      return null;
    }

    const geocoder = new google.maps.Geocoder();

    try {
      // Améliorer la requête de géocodage pour la Côte d'Ivoire
      const queries = [
        `${address}, Abidjan, Côte d'Ivoire`,
        `${address}, Côte d'Ivoire`,
        `${address}, CI`,
        address
      ];

      for (const query of queries) {
        try {
          const response = await geocoder.geocode({
            address: query,
            region: 'CI',
            componentRestrictions: {
              country: 'CI'
            }
          });

          if (response.results.length > 0) {
            const result = response.results[0];
            const location = result.geometry.location;

            // Vérifier que le résultat est en Côte d'Ivoire
            const isInCoteDIvoire = result.address_components.some(
              component => component.types.includes('country') &&
              (component.short_name === 'CI' || component.long_name.includes('Côte'))
            );

            if (isInCoteDIvoire) {
              // Effacer l'erreur précédente
              setGeocodingErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[type];
                return newErrors;
              });

              return {
                lat: location.lat(),
                lng: location.lng(),
              };
            }
          }
        } catch (queryError) {
          console.warn(`Échec géocodage pour "${query}":`, queryError);
          continue;
        }
      }

      // Aucun résultat trouvé
      setGeocodingErrors(prev => ({
        ...prev,
        [type]: `Adresse "${address}" non trouvée en Côte d'Ivoire`
      }));
      return null;

    } catch (error) {
      console.error('Erreur de géocodage:', error);
      setGeocodingErrors(prev => ({
        ...prev,
        [type]: 'Erreur lors de la recherche d\'adresse'
      }));
      return null;
    }
  };

  // Géocoder les adresses avec debounce et indicateurs de chargement
  const handleAddressChange = async (field: 'pickupAddress' | 'deliveryAddress', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Réinitialiser les coordonnées et erreurs si l'adresse est trop courte
    if (value.length < 5) {
      if (field === 'pickupAddress') {
        setPickupCoords(null);
        setIsGeocodingPickup(false);
      } else {
        setDeliveryCoords(null);
        setIsGeocodingDelivery(false);
      }
      setGeocodingErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field === 'pickupAddress' ? 'pickup' : 'delivery'];
        return newErrors;
      });
      return;
    }

    // Géocoder seulement si l'adresse est assez longue
    if (value.length >= 5) {
      const type = field === 'pickupAddress' ? 'pickup' : 'delivery';

      // Activer l'indicateur de chargement
      if (type === 'pickup') {
        setIsGeocodingPickup(true);
      } else {
        setIsGeocodingDelivery(true);
      }

      // Debounce: attendre 1 seconde avant de géocoder
      setTimeout(async () => {
        const coords = await geocodeAddress(value, type);

        // Désactiver l'indicateur de chargement
        if (type === 'pickup') {
          setIsGeocodingPickup(false);
          if (coords) setPickupCoords(coords);
        } else {
          setIsGeocodingDelivery(false);
          if (coords) setDeliveryCoords(coords);
        }
      }, 1000);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calculator className="h-5 w-5" />
          <span>Calculateur de Prix WALI</span>
        </CardTitle>
        <CardDescription>
          Obtenez un devis instantané pour votre livraison en Côte d'Ivoire
        </CardDescription>

        {/* Indicateur Google Maps */}
        <div className="flex items-center space-x-2 mt-2">
          {isMapsLoaded ? (
            <Badge variant="secondary" className="text-green-700 bg-green-100">
              <CheckCircle className="h-3 w-3 mr-1" />
              Google Maps activé
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-orange-700 bg-orange-100">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Chargement Google Maps...
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type de livraison */}
        <div>
          <Label>Type de livraison</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={OrderType.DELIVERY}>
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4" />
                  <span>Livraison Express</span>
                </div>
              </SelectItem>
              <SelectItem value={OrderType.FOOD}>
                <div className="flex items-center space-x-2">
                  <span>🍽️</span>
                  <span>Livraison de Repas</span>
                </div>
              </SelectItem>
              <SelectItem value={OrderType.SHOPPING}>
                <div className="flex items-center space-x-2">
                  <span>🛒</span>
                  <span>Courses et Achats</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Adresses avec indicateurs améliorés */}
        <div className="space-y-6">
          {/* Adresse de récupération */}
          <div>
            <Label htmlFor="pickup" className="flex items-center space-x-2">
              <span>Adresse de récupération</span>
              {isGeocodingPickup && (
                <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
              )}
              {pickupCoords && !isGeocodingPickup && (
                <CheckCircle className="h-3 w-3 text-green-500" />
              )}
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="pickup"
                placeholder="Ex: Plateau, Rue des Jardins, Abidjan"
                value={formData.pickupAddress}
                onChange={(e) => handleAddressChange('pickupAddress', e.target.value)}
                className={`pl-10 ${geocodingErrors.pickup ? 'border-red-500' : pickupCoords ? 'border-green-500' : ''}`}
              />
            </div>
            {geocodingErrors.pickup && (
              <Alert className="mt-2 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {geocodingErrors.pickup}
                </AlertDescription>
              </Alert>
            )}
            {pickupCoords && !geocodingErrors.pickup && (
              <p className="text-xs text-green-600 mt-1 flex items-center space-x-1">
                <Navigation className="h-3 w-3" />
                <span>Adresse trouvée: {pickupCoords.lat.toFixed(4)}, {pickupCoords.lng.toFixed(4)}</span>
              </p>
            )}
          </div>

          {/* Adresse de livraison */}
          <div>
            <Label htmlFor="delivery" className="flex items-center space-x-2">
              <span>Adresse de livraison</span>
              {isGeocodingDelivery && (
                <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
              )}
              {deliveryCoords && !isGeocodingDelivery && (
                <CheckCircle className="h-3 w-3 text-green-500" />
              )}
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="delivery"
                placeholder="Ex: Cocody, Riviera Golf, Abidjan"
                value={formData.deliveryAddress}
                onChange={(e) => handleAddressChange('deliveryAddress', e.target.value)}
                className={`pl-10 ${geocodingErrors.delivery ? 'border-red-500' : deliveryCoords ? 'border-green-500' : ''}`}
              />
            </div>
            {geocodingErrors.delivery && (
              <Alert className="mt-2 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {geocodingErrors.delivery}
                </AlertDescription>
              </Alert>
            )}
            {deliveryCoords && !geocodingErrors.delivery && (
              <p className="text-xs text-green-600 mt-1 flex items-center space-x-1">
                <Navigation className="h-3 w-3" />
                <span>Adresse trouvée: {deliveryCoords.lat.toFixed(4)}, {deliveryCoords.lng.toFixed(4)}</span>
              </p>
            )}
          </div>

          {/* Message d'aide */}
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              💡 <strong>Astuce :</strong> Saisissez des adresses précises d'Abidjan pour un calcul de prix exact.
              Exemples : "Plateau", "Cocody Riviera", "Marcory Zone 4", "Yopougon Selmer".
            </AlertDescription>
          </Alert>
        </div>

        {/* Bouton de calcul */}
        <Button
          onClick={handleCalculate}
          disabled={isCalculating || !formData.pickupAddress || !formData.deliveryAddress}
          className="w-full"
        >
          {isCalculating ? 'Calcul en cours...' : 'Calculer le Prix'}
        </Button>

        {/* Carte de visualisation améliorée */}
        {isMapsLoaded && (pickupCoords || deliveryCoords) && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Route className="h-5 w-5 text-blue-600" />
                <span>Aperçu du Trajet</span>
              </CardTitle>
              <CardDescription>
                Visualisation de votre itinéraire de livraison
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Informations du trajet */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {pickupCoords && (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Récupération:</span>
                      <span className="text-gray-600">{formData.pickupAddress}</span>
                    </div>
                  )}
                  {deliveryCoords && (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="font-medium">Livraison:</span>
                      <span className="text-gray-600">{formData.deliveryAddress}</span>
                    </div>
                  )}
                </div>

                {/* Carte interactive */}
                <div className="relative">
                  <SimpleMap
                    center={mapCenter}
                    zoom={mapZoom}
                    height="300px"
                    markers={[
                      ...(pickupCoords ? [{
                        id: 'pickup',
                        position: pickupCoords,
                        title: `Récupération: ${formData.pickupAddress}`,
                        color: 'green' as const,
                      }] : []),
                      ...(deliveryCoords ? [{
                        id: 'delivery',
                        position: deliveryCoords,
                        title: `Livraison: ${formData.deliveryAddress}`,
                        color: 'red' as const,
                      }] : []),
                    ]}
                    className="border rounded-lg shadow-sm"
                  />

                  {/* Distance estimée */}
                  {pickupCoords && deliveryCoords && (
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
                      <div className="text-xs text-gray-600">Distance estimée</div>
                      <div className="font-semibold text-sm">
                        {(() => {
                          const distance = Math.sqrt(
                            Math.pow(pickupCoords.lat - deliveryCoords.lat, 2) +
                            Math.pow(pickupCoords.lng - deliveryCoords.lng, 2)
                          ) * 111; // Approximation en km
                          return `~${distance.toFixed(1)} km`;
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Résultat amélioré */}
        {priceResult && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-green-800">
                <Package className="h-5 w-5" />
                <span>Devis de Livraison</span>
              </CardTitle>
              <CardDescription className="text-green-700">
                Estimation basée sur votre itinéraire
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Informations du trajet */}
                <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Trajet</span>
                  </div>
                  <span className="text-sm text-green-700">
                    {priceResult.distance.toFixed(1)} km • {Math.round(priceResult.estimatedDuration)} min
                  </span>
                </div>

                {/* Détail des prix */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Prix de base:</span>
                    <span className="font-medium">{priceResult.basePrice.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Frais de livraison:</span>
                    <span className="font-medium">{Math.round(priceResult.deliveryFee).toLocaleString()} FCFA</span>
                  </div>
                  {priceResult.serviceFee && priceResult.serviceFee > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Frais de service:</span>
                      <span className="font-medium">{Math.round(priceResult.serviceFee).toLocaleString()} FCFA</span>
                    </div>
                  )}

                  <hr className="border-green-200" />

                  <div className="flex justify-between items-center text-lg font-bold text-green-800">
                    <span>Total:</span>
                    <span>{Math.round(priceResult.totalAmount).toLocaleString()} FCFA</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <Button className="flex-1" size="sm">
                    Commander Maintenant
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetCalculation}>
                    Nouveau Calcul
                  </Button>
                </div>

                {/* Détail des frais */}
                <details className="mt-4">
                  <summary className="text-xs text-green-700 cursor-pointer hover:text-green-800">
                    📊 Voir le détail des frais
                  </summary>
                  <div className="mt-3 space-y-2 text-xs bg-white/60 p-3 rounded-lg">
                    <div className="flex justify-between">
                      <span>Frais de distance:</span>
                      <span className="font-medium">{Math.round(priceResult.breakdown.distanceFee)} FCFA</span>
                    </div>
                    {priceResult.breakdown.timeFee > 0 && (
                      <div className="flex justify-between">
                        <span>Frais de temps:</span>
                        <span className="font-medium">{Math.round(priceResult.breakdown.timeFee)} FCFA</span>
                      </div>
                    )}
                    {priceResult.breakdown.typeFee > 0 && (
                      <div className="flex justify-between">
                        <span>Frais de type:</span>
                        <span className="font-medium">{Math.round(priceResult.breakdown.typeFee)} FCFA</span>
                      </div>
                    )}
                    {priceResult.breakdown.itemsFee > 0 && (
                      <div className="flex justify-between">
                        <span>Frais d'articles:</span>
                        <span className="font-medium">{Math.round(priceResult.breakdown.itemsFee)} FCFA</span>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informations tarifaires */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Prix de base: 1000 FCFA (Livraison), 1500 FCFA (Repas), 2000 FCFA (Courses)</p>
          <p>• 200 FCFA/km après les 2 premiers kilomètres gratuits</p>
          <p>• Majorations: Nuit (+50%), Weekend (+30%)</p>
        </div>
      </CardContent>
    </Card>
  );
}
