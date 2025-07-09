'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Search, 
  Navigation, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { GoogleMap } from './GoogleMap';
import { Address } from '@/lib/orders';

interface AddressSelectorProps {
  title: string;
  description?: string;
  initialAddress?: Partial<Address>;
  onAddressSelect: (address: Address) => void;
  placeholder?: string;
  type?: 'pickup' | 'delivery';
  className?: string;
}

interface PlaceResult {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: { lat: number; lng: number };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

export function AddressSelector({
  title,
  description,
  initialAddress,
  onAddressSelect,
  placeholder = "Rechercher une adresse...",
  type = 'pickup',
  className = '',
}: AddressSelectorProps) {
  const [searchQuery, setSearchQuery] = useState(initialAddress?.street || '');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(
    initialAddress ? {
      id: initialAddress.id || '',
      label: initialAddress.label || '',
      street: initialAddress.street || '',
      district: initialAddress.district || '',
      city: initialAddress.city || 'Abidjan',
      coordinates: initialAddress.coordinates || { lat: 5.3364, lng: -4.0267 },
      contactName: initialAddress.contactName,
      contactPhone: initialAddress.contactPhone,
      instructions: initialAddress.instructions,
    } : null
  );
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 5.3364, lng: -4.0267 });
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const autocompleteService = useRef<google.maps.places.AutocompleteService>();
  const placesService = useRef<google.maps.places.PlacesService>();

  // Initialisation des services Google Places
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      
      // Créer un div temporaire pour PlacesService
      const div = document.createElement('div');
      placesService.current = new google.maps.places.PlacesService(div);
    }
  }, []);

  // Recherche d'adresses avec autocomplete
  const searchAddresses = useCallback(async (query: string) => {
    if (!query.trim() || !autocompleteService.current) return;

    setIsSearching(true);
    
    try {
      const request = {
        input: query,
        componentRestrictions: { country: 'ci' }, // Limiter à la Côte d'Ivoire
        types: ['address'],
        bounds: new google.maps.LatLngBounds(
          new google.maps.LatLng(5.0, -5.0), // Sud-Ouest d'Abidjan
          new google.maps.LatLng(5.7, -3.5)  // Nord-Est d'Abidjan
        ),
      };

      autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          // Convertir les prédictions en résultats utilisables
          const results: PlaceResult[] = predictions.map(prediction => ({
            place_id: prediction.place_id,
            formatted_address: prediction.description,
            geometry: {
              location: { lat: 0, lng: 0 } // Sera mis à jour avec getDetails
            },
            address_components: []
          }));
          
          setSearchResults(results);
        } else {
          setSearchResults([]);
        }
        setIsSearching(false);
      });
    } catch (error) {
      console.error('Erreur de recherche:', error);
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchQuery.length >= 3) {
        searchAddresses(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchAddresses]);

  // Sélection d'un résultat de recherche
  const selectSearchResult = useCallback(async (result: PlaceResult) => {
    if (!placesService.current) return;

    try {
      const request = {
        placeId: result.place_id,
        fields: ['geometry', 'formatted_address', 'address_components', 'name']
      };

      placesService.current.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const address = parseGooglePlaceToAddress(place);
          setSelectedAddress(address);
          setSearchQuery(address.street);
          setSearchResults([]);
          setMapCenter(address.coordinates);
          onAddressSelect(address);
        }
      });
    } catch (error) {
      console.error('Erreur de sélection:', error);
    }
  }, [onAddressSelect]);

  // Conversion d'un Google Place en Address
  const parseGooglePlaceToAddress = (place: google.maps.places.PlaceResult): Address => {
    const components = place.address_components || [];
    
    let district = '';
    let city = 'Abidjan';
    
    // Extraire les composants d'adresse
    components.forEach(component => {
      if (component.types.includes('sublocality') || component.types.includes('neighborhood')) {
        district = component.long_name;
      } else if (component.types.includes('locality')) {
        city = component.long_name;
      }
    });

    // Si pas de district trouvé, essayer de deviner depuis l'adresse
    if (!district && place.formatted_address) {
      const commonDistricts = ['Plateau', 'Cocody', 'Yopougon', 'Adjamé', 'Treichville', 'Marcory', 'Koumassi'];
      const foundDistrict = commonDistricts.find(d => 
        place.formatted_address!.toLowerCase().includes(d.toLowerCase())
      );
      if (foundDistrict) {
        district = foundDistrict;
      }
    }

    return {
      id: place.place_id || '',
      label: type === 'pickup' ? 'Récupération' : 'Livraison',
      street: place.formatted_address || '',
      district: district || 'Plateau',
      city,
      coordinates: {
        lat: place.geometry?.location?.lat() || 5.3364,
        lng: place.geometry?.location?.lng() || -4.0267,
      },
    };
  };

  // Utiliser la position actuelle
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setIsUsingCurrentLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        // Géocodage inverse pour obtenir l'adresse
        try {
          const geocoder = new google.maps.Geocoder();
          const response = await geocoder.geocode({ location: coords });
          
          if (response.results[0]) {
            const address: Address = {
              id: '',
              label: type === 'pickup' ? 'Récupération' : 'Livraison',
              street: response.results[0].formatted_address,
              district: 'Plateau', // Par défaut
              city: 'Abidjan',
              coordinates: coords,
            };

            setSelectedAddress(address);
            setSearchQuery(address.street);
            setMapCenter(coords);
            onAddressSelect(address);
          }
        } catch (error) {
          console.error('Erreur de géocodage:', error);
        }
        
        setIsUsingCurrentLocation(false);
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        alert('Impossible d\'obtenir votre position. Vérifiez les permissions.');
        setIsUsingCurrentLocation(false);
      }
    );
  };

  // Sélection sur la carte
  const handleMapLocationSelect = (location: { lat: number; lng: number; address?: string }) => {
    const address: Address = {
      id: '',
      label: type === 'pickup' ? 'Récupération' : 'Livraison',
      street: location.address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
      district: 'Plateau', // Par défaut
      city: 'Abidjan',
      coordinates: location,
    };

    setSelectedAddress(address);
    setSearchQuery(address.street);
    onAddressSelect(address);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className={`h-5 w-5 ${type === 'pickup' ? 'text-green-600' : 'text-blue-600'}`} />
          <span>{title}</span>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Barre de recherche */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>
          
          {/* Résultats de recherche */}
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.place_id}
                  onClick={() => selectSearchResult(result)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {result.formatted_address}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={useCurrentLocation}
            disabled={isUsingCurrentLocation}
            className="flex-1"
          >
            {isUsingCurrentLocation ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4 mr-2" />
            )}
            Ma position
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMap(!showMap)}
            className="flex-1"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {showMap ? 'Masquer' : 'Voir'} carte
          </Button>
        </div>

        {/* Adresse sélectionnée */}
        {selectedAddress && (
          <div className={`p-3 rounded-lg border-2 ${
            type === 'pickup' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start space-x-2">
              <CheckCircle className={`h-4 w-4 mt-1 ${
                type === 'pickup' ? 'text-green-600' : 'text-blue-600'
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {selectedAddress.street}
                </p>
                <p className="text-xs text-gray-600">
                  {selectedAddress.district}, {selectedAddress.city}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Carte */}
        {showMap && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Sélectionnez sur la carte</Label>
            <GoogleMap
              center={mapCenter}
              zoom={15}
              height="300px"
              enableLocationSelection
              showCurrentLocation
              onLocationSelect={handleMapLocationSelect}
              markers={selectedAddress ? [{
                position: selectedAddress.coordinates,
                title: selectedAddress.label,
                icon: type === 'pickup' ? 
                  'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#10B981"/>
                      <circle cx="12" cy="9" r="2.5" fill="white"/>
                    </svg>
                  `) :
                  'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#3B82F6"/>
                      <circle cx="12" cy="9" r="2.5" fill="white"/>
                    </svg>
                  `)
              }] : []}
              className="rounded-lg border"
            />
            <p className="text-xs text-gray-500">
              Cliquez sur la carte pour sélectionner une adresse précise
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
