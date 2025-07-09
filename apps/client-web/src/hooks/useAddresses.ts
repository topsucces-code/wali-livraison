'use client';

import { useState, useCallback } from 'react';
import { 
  Address, 
  CreateAddressRequest, 
  UpdateAddressRequest,
  GeocodeResult,
  ReverseGeocodeResult 
} from '@wali/shared';
import { useAuth } from './useAuth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface UseAddressesState {
  isLoading: boolean;
  error: string | null;
}

export const useAddresses = () => {
  const { authenticatedFetch } = useAuth();
  const [state, setState] = useState<UseAddressesState>({
    isLoading: false,
    error: null,
  });

  // Récupérer toutes les adresses de l'utilisateur
  const getAddresses = useCallback(async (): Promise<Address[]> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/addresses`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la récupération des adresses');
      }

      const addresses = await response.json();
      setState(prev => ({ ...prev, isLoading: false }));
      return addresses;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, [authenticatedFetch]);

  // Récupérer une adresse par ID
  const getAddressById = useCallback(async (addressId: string): Promise<Address> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/addresses/${addressId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Adresse non trouvée');
      }

      const address = await response.json();
      setState(prev => ({ ...prev, isLoading: false }));
      return address;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, [authenticatedFetch]);

  // Créer une nouvelle adresse
  const createAddress = useCallback(async (data: CreateAddressRequest): Promise<Address> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/addresses`, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création de l\'adresse');
      }

      const address = await response.json();
      setState(prev => ({ ...prev, isLoading: false }));
      return address;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, [authenticatedFetch]);

  // Mettre à jour une adresse
  const updateAddress = useCallback(async (
    addressId: string, 
    data: UpdateAddressRequest
  ): Promise<Address> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/addresses/${addressId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la mise à jour de l\'adresse');
      }

      const address = await response.json();
      setState(prev => ({ ...prev, isLoading: false }));
      return address;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, [authenticatedFetch]);

  // Supprimer une adresse
  const deleteAddress = useCallback(async (addressId: string): Promise<{ message: string }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/addresses/${addressId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression de l\'adresse');
      }

      const result = await response.json();
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, [authenticatedFetch]);

  // Définir une adresse comme par défaut
  const setDefaultAddress = useCallback(async (addressId: string): Promise<Address> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/addresses/${addressId}/default`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la définition de l\'adresse par défaut');
      }

      const address = await response.json();
      setState(prev => ({ ...prev, isLoading: false }));
      return address;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, [authenticatedFetch]);

  // Géocoder une adresse
  const geocodeAddress = useCallback(async (address: string): Promise<GeocodeResult> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/addresses/geocode`, {
        method: 'POST',
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Impossible de géolocaliser cette adresse');
      }

      const result = await response.json();
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, [authenticatedFetch]);

  // Géocodage inverse
  const reverseGeocode = useCallback(async (
    latitude: number, 
    longitude: number
  ): Promise<ReverseGeocodeResult> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/addresses/reverse-geocode`, {
        method: 'POST',
        body: JSON.stringify({ latitude, longitude }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Impossible de trouver une adresse pour ces coordonnées');
      }

      const result = await response.json();
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, [authenticatedFetch]);

  // Obtenir la position actuelle de l'utilisateur
  const getCurrentLocation = useCallback((): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('La géolocalisation n\'est pas supportée par ce navigateur'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          let message = 'Erreur de géolocalisation';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Permission de géolocalisation refusée';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Position non disponible';
              break;
            case error.TIMEOUT:
              message = 'Délai de géolocalisation dépassé';
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }, []);

  return {
    // État
    ...state,

    // Actions
    getAddresses,
    getAddressById,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    geocodeAddress,
    reverseGeocode,
    getCurrentLocation,

    // Utilitaires
    clearError: () => setState(prev => ({ ...prev, error: null })),
  };
};
