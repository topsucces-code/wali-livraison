'use client';

import React, { useState, useCallback } from 'react';
import { MapContainer, LatLng, MapMarker } from './MapContainer';
import { AddressAutocomplete, AddressResult } from './AddressAutocomplete';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, Check } from 'lucide-react';
import { useCurrentPosition } from '@/hooks/useGeolocation';
import { toast } from 'sonner';

interface AddressPickerProps {
  title?: string;
  description?: string;
  onAddressSelect: (address: AddressResult) => void;
  initialAddress?: string;
  initialPosition?: LatLng;
  markerType?: 'pickup' | 'delivery';
  className?: string;
}

export const AddressPicker: React.FC<AddressPickerProps> = ({
  title = 'Sélectionner une adresse',
  description = 'Tapez une adresse ou cliquez sur la carte',
  onAddressSelect,
  initialAddress = '',
  initialPosition,
  markerType = 'pickup',
  className = '',
}) => {
  const [address, setAddress] = useState(initialAddress);
  const [selectedPosition, setSelectedPosition] = useState<LatLng | null>(initialPosition || null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const { position: userPosition } = useCurrentPosition();

  // Position par défaut (Plateau, Abidjan)
  const defaultCenter: LatLng = userPosition || { lat: 5.3364, lng: -4.0267 };

  // Gestionnaire de sélection d'adresse via autocomplete
  const handleAddressSelect = useCallback((addressResult: AddressResult) => {
    setAddress(addressResult.address);
    setSelectedPosition({ lat: addressResult.lat, lng: addressResult.lng });
    setIsConfirmed(false);
  }, []);

  // Gestionnaire de clic sur la carte
  const handleMapClick = useCallback(async (position: LatLng) => {
    setSelectedPosition(position);
    setIsConfirmed(false);

    // Géocodage inverse pour obtenir l'adresse
    if (window.google?.maps) {
      const geocoder = new google.maps.Geocoder();
      
      try {
        const response = await geocoder.geocode({
          location: position,
          language: 'fr',
          region: 'CI',
        });

        if (response.results.length > 0) {
          const result = response.results[0];
          setAddress(result.formatted_address);
        } else {
          setAddress(`${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`);
        }
      } catch (error) {
        console.error('Erreur de géocodage inverse:', error);
        setAddress(`${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`);
      }
    } else {
      setAddress(`${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`);
    }
  }, []);

  // Confirmer la sélection
  const handleConfirm = useCallback(() => {
    if (!selectedPosition) {
      toast.error('Veuillez sélectionner une adresse');
      return;
    }

    const addressResult: AddressResult = {
      address,
      lat: selectedPosition.lat,
      lng: selectedPosition.lng,
    };

    onAddressSelect(addressResult);
    setIsConfirmed(true);
    toast.success('Adresse confirmée');
  }, [address, selectedPosition, onAddressSelect]);

  // Utiliser la position actuelle
  const handleUseCurrentLocation = useCallback(async () => {
    if (!userPosition) {
      toast.error('Position actuelle non disponible');
      return;
    }

    setSelectedPosition(userPosition);
    setIsConfirmed(false);

    // Géocodage inverse
    if (window.google?.maps) {
      const geocoder = new google.maps.Geocoder();
      
      try {
        const response = await geocoder.geocode({
          location: userPosition,
          language: 'fr',
          region: 'CI',
        });

        if (response.results.length > 0) {
          setAddress(response.results[0].formatted_address);
        }
      } catch (error) {
        console.error('Erreur de géocodage inverse:', error);
      }
    }

    toast.success('Position actuelle utilisée');
  }, [userPosition]);

  // Créer les markers pour la carte
  const markers: MapMarker[] = selectedPosition ? [{
    id: 'selected',
    position: selectedPosition,
    title: address || 'Adresse sélectionnée',
    type: markerType,
  }] : [];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>{title}</span>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Champ d'autocomplete */}
        <div>
          <Label htmlFor="address-input">Adresse</Label>
          <AddressAutocomplete
            value={address}
            onChange={setAddress}
            onAddressSelect={handleAddressSelect}
            placeholder="Tapez une adresse..."
            className="mt-1"
          />
        </div>

        {/* Carte interactive */}
        <div>
          <Label>Carte interactive</Label>
          <div className="mt-1 border rounded-lg overflow-hidden">
            <MapContainer
              center={selectedPosition || defaultCenter}
              zoom={selectedPosition ? 16 : 13}
              height="300px"
              markers={markers}
              onMapClick={handleMapClick}
              showUserLocation={true}
              className="w-full"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Cliquez sur la carte pour sélectionner une adresse précise
          </p>
        </div>

        {/* Informations sur la sélection */}
        {selectedPosition && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Adresse sélectionnée
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {address}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Coordonnées: {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
                </p>
              </div>
              
              {isConfirmed && (
                <div className="flex items-center text-green-600">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex space-x-2">
          {userPosition && (
            <Button
              type="button"
              variant="outline"
              onClick={handleUseCurrentLocation}
              className="flex items-center space-x-2"
            >
              <Navigation className="h-4 w-4" />
              <span>Ma position</span>
            </Button>
          )}
          
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedPosition || isConfirmed}
            className="flex items-center space-x-2 flex-1"
          >
            <Check className="h-4 w-4" />
            <span>
              {isConfirmed ? 'Adresse confirmée' : 'Confirmer l\'adresse'}
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant pour sélectionner deux adresses (pickup et delivery)
interface DualAddressPickerProps {
  onPickupSelect: (address: AddressResult) => void;
  onDeliverySelect: (address: AddressResult) => void;
  pickupAddress?: string;
  deliveryAddress?: string;
  className?: string;
}

export const DualAddressPicker: React.FC<DualAddressPickerProps> = ({
  onPickupSelect,
  onDeliverySelect,
  pickupAddress = '',
  deliveryAddress = '',
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'pickup' | 'delivery'>('pickup');

  return (
    <div className={className}>
      {/* Onglets */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('pickup')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'pickup'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📍 Adresse de récupération
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('delivery')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'delivery'
              ? 'border-red-500 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          🎯 Adresse de livraison
        </button>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'pickup' && (
        <AddressPicker
          title="Adresse de récupération"
          description="Où récupérer le colis ?"
          onAddressSelect={onPickupSelect}
          initialAddress={pickupAddress}
          markerType="pickup"
        />
      )}

      {activeTab === 'delivery' && (
        <AddressPicker
          title="Adresse de livraison"
          description="Où livrer le colis ?"
          onAddressSelect={onDeliverySelect}
          initialAddress={deliveryAddress}
          markerType="delivery"
        />
      )}

      {/* Résumé des adresses sélectionnées */}
      {(pickupAddress || deliveryAddress) && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Résumé des adresses
          </h4>
          <div className="space-y-2 text-sm">
            {pickupAddress && (
              <div className="flex items-start space-x-2">
                <span className="text-green-600">📍</span>
                <div>
                  <span className="font-medium">Récupération:</span>
                  <p className="text-gray-600">{pickupAddress}</p>
                </div>
              </div>
            )}
            {deliveryAddress && (
              <div className="flex items-start space-x-2">
                <span className="text-red-600">🎯</span>
                <div>
                  <span className="font-medium">Livraison:</span>
                  <p className="text-gray-600">{deliveryAddress}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
