'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, X } from 'lucide-react';
import { useCurrentPosition } from '@/hooks/useGeolocation';
import { toast } from 'sonner';

export interface AddressResult {
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
  components?: {
    street?: string;
    city?: string;
    district?: string;
    country?: string;
  };
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (address: AddressResult) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showCurrentLocationButton?: boolean;
  restrictToIvoryCoast?: boolean;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Entrez une adresse...',
  className = '',
  disabled = false,
  showCurrentLocationButton = true,
  restrictToIvoryCoast = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { position, isLoading: isGeoLoading, refetch: getCurrentPos } = useCurrentPosition(false);

  // Initialisation de l'autocomplete Google Places
  useEffect(() => {
    if (!inputRef.current || !window.google?.maps?.places) {
      return;
    }

    const options: google.maps.places.AutocompleteOptions = {
      fields: ['place_id', 'formatted_address', 'geometry', 'address_components'],
      types: ['address'],
    };

    // Restriction à la Côte d'Ivoire
    if (restrictToIvoryCoast) {
      options.componentRestrictions = { country: 'ci' };
    }

    // Créer l'instance d'autocomplete
    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, options);
    autocompleteRef.current = autocomplete;

    // Gestionnaire de sélection d'adresse
    const handlePlaceSelect = () => {
      const place = autocomplete.getPlace();
      
      if (!place.geometry?.location) {
        toast.error('Impossible de localiser cette adresse');
        return;
      }

      // Extraire les composants d'adresse
      const components: AddressResult['components'] = {};
      if (place.address_components) {
        place.address_components.forEach((component) => {
          const types = component.types;
          
          if (types.includes('route')) {
            components.street = component.long_name;
          } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
            components.city = component.long_name;
          } else if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
            components.district = component.long_name;
          } else if (types.includes('country')) {
            components.country = component.long_name;
          }
        });
      }

      const addressResult: AddressResult = {
        address: place.formatted_address || value,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        placeId: place.place_id,
        components,
      };

      onChange(addressResult.address);
      onAddressSelect(addressResult);
    };

    autocomplete.addListener('place_changed', handlePlaceSelect);
    setIsLoaded(true);

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [value, onChange, onAddressSelect, restrictToIvoryCoast]);

  // Géocodage inverse pour obtenir l'adresse depuis les coordonnées
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<AddressResult | null> => {
    if (!window.google?.maps) {
      return null;
    }

    const geocoder = new google.maps.Geocoder();
    
    try {
      const response = await geocoder.geocode({
        location: { lat, lng },
        language: 'fr',
        region: 'CI',
      });

      if (response.results.length > 0) {
        const result = response.results[0];
        
        // Extraire les composants d'adresse
        const components: AddressResult['components'] = {};
        result.address_components.forEach((component) => {
          const types = component.types;
          
          if (types.includes('route')) {
            components.street = component.long_name;
          } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
            components.city = component.long_name;
          } else if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
            components.district = component.long_name;
          } else if (types.includes('country')) {
            components.country = component.long_name;
          }
        });

        return {
          address: result.formatted_address,
          lat,
          lng,
          placeId: result.place_id,
          components,
        };
      }
    } catch (error) {
      console.error('Erreur de géocodage inverse:', error);
    }

    return null;
  }, []);

  // Utiliser la position actuelle
  const handleUseCurrentLocation = useCallback(async () => {
    try {
      const currentPos = position || await getCurrentPos();
      
      if (!currentPos) {
        toast.error('Impossible d\'obtenir votre position');
        return;
      }

      // Vérifier si la position est en Côte d'Ivoire
      if (restrictToIvoryCoast && !isInIvoryCoast(currentPos)) {
        toast.error('Votre position semble être en dehors de la Côte d\'Ivoire');
        return;
      }

      const addressResult = await reverseGeocode(currentPos.lat, currentPos.lng);
      
      if (addressResult) {
        onChange(addressResult.address);
        onAddressSelect(addressResult);
        toast.success('Position actuelle utilisée');
      } else {
        toast.error('Impossible de déterminer l\'adresse de votre position');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'obtention de votre position');
    }
  }, [position, getCurrentPos, restrictToIvoryCoast, reverseGeocode, onChange, onAddressSelect]);

  // Effacer l'adresse
  const handleClear = useCallback(() => {
    onChange('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [onChange]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10 pr-20"
        />

        {/* Boutons d'action */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          
          {showCurrentLocationButton && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleUseCurrentLocation}
              disabled={isGeoLoading}
              className="h-6 w-6 p-0"
              title="Utiliser ma position actuelle"
            >
              <Navigation className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Indicateur de chargement de l'API */}
      {!isLoaded && typeof window !== 'undefined' && window.google?.maps && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md mt-1 p-2 text-sm text-gray-500">
          Chargement de l'autocomplete...
        </div>
      )}
    </div>
  );
};

// Fonction utilitaire pour vérifier si une position est en Côte d'Ivoire
function isInIvoryCoast(position: { lat: number; lng: number }): boolean {
  const bounds = {
    north: 10.74,
    south: 4.34,
    east: -2.49,
    west: -8.60,
  };

  return (
    position.lat >= bounds.south &&
    position.lat <= bounds.north &&
    position.lng >= bounds.west &&
    position.lng <= bounds.east
  );
}

// Hook pour utiliser l'autocomplete dans d'autres composants
export function useAddressAutocomplete() {
  const [address, setAddress] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<AddressResult | null>(null);

  const handleAddressChange = useCallback((value: string) => {
    setAddress(value);
    if (!value) {
      setSelectedAddress(null);
    }
  }, []);

  const handleAddressSelect = useCallback((addressResult: AddressResult) => {
    setSelectedAddress(addressResult);
  }, []);

  const reset = useCallback(() => {
    setAddress('');
    setSelectedAddress(null);
  }, []);

  return {
    address,
    selectedAddress,
    handleAddressChange,
    handleAddressSelect,
    reset,
  };
}
