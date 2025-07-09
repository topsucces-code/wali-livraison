'use client';

import { useState, useEffect } from 'react';
import { useAddresses } from '@/hooks/useAddresses';
import {
  CreateAddressRequest,
  UpdateAddressRequest,
  Address,
  IVORY_COAST_CITIES,
  ABIDJAN_DISTRICTS
} from '@wali/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Navigation, X } from 'lucide-react';

interface AddressFormProps {
  address?: Address;
  onSuccess?: (address: Address) => void;
  onCancel?: () => void;
}

export default function AddressForm({ address, onSuccess, onCancel }: AddressFormProps) {
  const { 
    createAddress, 
    updateAddress, 
    geocodeAddress, 
    getCurrentLocation,
    isLoading, 
    error, 
    clearError 
  } = useAddresses();

  const [formData, setFormData] = useState<CreateAddressRequest>({
    label: '',
    street: '',
    city: 'Abidjan',
    district: '',
    landmark: '',
    latitude: 5.3364, // Coordonnées par défaut d'Abidjan
    longitude: -4.0267,
    isDefault: false,
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isGeolocating, setIsGeolocating] = useState(false);

  // Initialiser le formulaire avec les données de l'adresse existante
  useEffect(() => {
    if (address) {
      setFormData({
        label: address.label || '',
        street: address.street,
        city: address.city,
        district: address.district || '',
        landmark: address.landmark || '',
        latitude: address.latitude,
        longitude: address.longitude,
        isDefault: address.isDefault,
      });
    }
  }, [address]);

  const handleInputChange = (field: keyof CreateAddressRequest, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearError();
    setValidationErrors([]);
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.street.trim() || formData.street.length < 5) {
      errors.push('La rue doit contenir au moins 5 caractères');
    }

    if (!formData.city) {
      errors.push('La ville est requise');
    }

    if (formData.city === 'Abidjan' && !formData.district) {
      errors.push('Le quartier est obligatoire pour Abidjan');
    }

    if (formData.latitude < -90 || formData.latitude > 90) {
      errors.push('La latitude doit être comprise entre -90 et 90');
    }

    if (formData.longitude < -180 || formData.longitude > 180) {
      errors.push('La longitude doit être comprise entre -180 et 180');
    }

    return errors;
  };

  const handleGeocodeAddress = async () => {
    if (!formData.street.trim() || !formData.city) {
      setValidationErrors(['Veuillez remplir la rue et la ville avant de géolocaliser']);
      return;
    }

    setIsGeolocating(true);
    try {
      const addressString = `${formData.street}, ${formData.district ? formData.district + ', ' : ''}${formData.city}`;
      const result = await geocodeAddress(addressString);
      
      setFormData(prev => ({
        ...prev,
        latitude: result.latitude,
        longitude: result.longitude,
        city: result.city,
        district: result.district || prev.district,
      }));

      setValidationErrors([]);
    } catch (error) {
      console.error('Erreur géocodage:', error);
    } finally {
      setIsGeolocating(false);
    }
  };

  const handleGetCurrentLocation = async () => {
    setIsGeolocating(true);
    try {
      const location = await getCurrentLocation();
      setFormData(prev => ({
        ...prev,
        latitude: location.latitude,
        longitude: location.longitude,
      }));
      setValidationErrors([]);
    } catch (error) {
      setValidationErrors([error instanceof Error ? error.message : 'Erreur de géolocalisation']);
    } finally {
      setIsGeolocating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Validation côté client
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      let result: Address;
      if (address) {
        // Mise à jour
        const updateData: UpdateAddressRequest = {};
        if (formData.label !== address.label) updateData.label = formData.label;
        if (formData.street !== address.street) updateData.street = formData.street;
        if (formData.city !== address.city) updateData.city = formData.city;
        if (formData.district !== address.district) updateData.district = formData.district;
        if (formData.landmark !== address.landmark) updateData.landmark = formData.landmark;
        if (formData.latitude !== address.latitude) updateData.latitude = formData.latitude;
        if (formData.longitude !== address.longitude) updateData.longitude = formData.longitude;
        if (formData.isDefault !== address.isDefault) updateData.isDefault = formData.isDefault;

        result = await updateAddress(address.id, updateData);
      } else {
        // Création
        result = await createAddress(formData);
      }

      onSuccess?.(result);
    } catch (error) {
      console.error('Erreur sauvegarde adresse:', error);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl">
            {address ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
          </CardTitle>
          {onCancel && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Affichage des erreurs */}
        {(error || validationErrors.length > 0) && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-md">
            {error && <p className="font-medium">{error}</p>}
            {validationErrors.map((err, index) => (
              <p key={index} className="text-sm">{err}</p>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Libellé */}
          <div className="space-y-2">
            <Label htmlFor="label">Libellé (optionnel)</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => handleInputChange('label', e.target.value)}
              placeholder="Maison, Bureau, Chez maman..."
            />
          </div>

          {/* Rue */}
          <div className="space-y-2">
            <Label htmlFor="street">Rue et numéro *</Label>
            <Input
              id="street"
              value={formData.street}
              onChange={(e) => handleInputChange('street', e.target.value)}
              placeholder="Rue des Jardins, Résidence Les Palmiers, Villa 12"
              required
            />
          </div>

          {/* Ville et Quartier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Ville *</Label>
              <Select value={formData.city} onValueChange={(value) => handleInputChange('city', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une ville" />
                </SelectTrigger>
                <SelectContent>
                  {IVORY_COAST_CITIES.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">
                Quartier {formData.city === 'Abidjan' && '*'}
              </Label>
              {formData.city === 'Abidjan' ? (
                <Select
                  value={formData.district}
                  onValueChange={(value) => handleInputChange('district', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un quartier" />
                  </SelectTrigger>
                  <SelectContent>
                    {ABIDJAN_DISTRICTS.map(district => (
                      <SelectItem key={district} value={district}>{district}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  placeholder="Quartier ou zone"
                />
              )}
            </div>
          </div>

          {/* Point de repère */}
          <div className="space-y-2">
            <Label htmlFor="landmark">Point de repère (optionnel)</Label>
            <Input
              id="landmark"
              value={formData.landmark}
              onChange={(e) => handleInputChange('landmark', e.target.value)}
              placeholder="Près de la pharmacie du carrefour, face à l'école..."
            />
          </div>

          {/* Coordonnées GPS */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Coordonnées GPS</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude" className="text-xs text-muted-foreground">
                  Latitude
                </Label>
                <Input
                  type="number"
                  id="latitude"
                  value={formData.latitude}
                  onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value))}
                  step="0.000001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude" className="text-xs text-muted-foreground">
                  Longitude
                </Label>
                <Input
                  type="number"
                  id="longitude"
                  value={formData.longitude}
                  onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value))}
                  step="0.000001"
                  required
                />
              </div>
            </div>

            {/* Boutons de géolocalisation */}
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleGeocodeAddress}
                disabled={isGeolocating}
                className="flex-1"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {isGeolocating ? 'Géolocalisation...' : 'Géolocaliser l\'adresse'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleGetCurrentLocation}
                disabled={isGeolocating}
                className="flex-1"
              >
                <Navigation className="w-4 h-4 mr-2" />
                {isGeolocating ? 'Localisation...' : 'Ma position'}
              </Button>
            </div>
          </div>

          {/* Adresse par défaut */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDefault"
              checked={formData.isDefault}
              onCheckedChange={(checked) => handleInputChange('isDefault', checked)}
            />
            <Label htmlFor="isDefault" className="text-sm font-normal">
              Définir comme adresse par défaut
            </Label>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Annuler
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Enregistrement...' : (address ? 'Modifier' : 'Créer')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
