'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface GeolocationPosition {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export interface UseGeolocationReturn {
  position: GeolocationPosition | null;
  error: GeolocationError | null;
  isLoading: boolean;
  isSupported: boolean;
  getCurrentPosition: () => Promise<GeolocationPosition>;
  watchPosition: () => void;
  clearWatch: () => void;
}

export function useGeolocation(
  options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000, // 5 minutes
  }
): UseGeolocationReturn {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Vérifier si la géolocalisation est supportée
  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  /**
   * Convertit une position native en notre format
   */
  const convertPosition = useCallback((pos: GeolocationPosition): GeolocationPosition => {
    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      timestamp: pos.timestamp,
    };
  }, []);

  /**
   * Convertit une erreur native en notre format
   */
  const convertError = useCallback((err: GeolocationPositionError): GeolocationError => {
    const messages = {
      [err.PERMISSION_DENIED]: 'Accès à la géolocalisation refusé',
      [err.POSITION_UNAVAILABLE]: 'Position non disponible',
      [err.TIMEOUT]: 'Délai de géolocalisation dépassé',
    };

    return {
      code: err.code,
      message: messages[err.code] || 'Erreur de géolocalisation inconnue',
    };
  }, []);

  /**
   * Obtient la position actuelle
   */
  const getCurrentPosition = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!isSupported) {
        const error = {
          code: 0,
          message: 'Géolocalisation non supportée par ce navigateur',
        };
        setError(error);
        reject(error);
        return;
      }

      setIsLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const convertedPos = convertPosition(pos);
          setPosition(convertedPos);
          setIsLoading(false);
          resolve(convertedPos);
        },
        (err) => {
          const convertedError = convertError(err);
          setError(convertedError);
          setIsLoading(false);
          reject(convertedError);
        },
        options
      );
    });
  }, [isSupported, options, convertPosition, convertError]);

  /**
   * Démarre le suivi de position
   */
  const watchPosition = useCallback(() => {
    if (!isSupported) {
      const error = {
        code: 0,
        message: 'Géolocalisation non supportée par ce navigateur',
      };
      setError(error);
      return;
    }

    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }

    setError(null);

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const convertedPos = convertPosition(pos);
        setPosition(convertedPos);
        setIsLoading(false);
      },
      (err) => {
        const convertedError = convertError(err);
        setError(convertedError);
        setIsLoading(false);
      },
      options
    );

    setWatchId(id);
    setIsLoading(true);
  }, [isSupported, watchId, options, convertPosition, convertError]);

  /**
   * Arrête le suivi de position
   */
  const clearWatch = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsLoading(false);
    }
  }, [watchId]);

  // Nettoyage au démontage du composant
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    position,
    error,
    isLoading,
    isSupported,
    getCurrentPosition,
    watchPosition,
    clearWatch,
  };
}

// Hook spécialisé pour obtenir la position une seule fois
export function useCurrentPosition(autoFetch = true) {
  const {
    position,
    error,
    isLoading,
    isSupported,
    getCurrentPosition,
  } = useGeolocation();

  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    if (autoFetch && !hasAttempted && isSupported) {
      setHasAttempted(true);
      getCurrentPosition().catch(() => {
        // Erreur déjà gérée par le hook
      });
    }
  }, [autoFetch, hasAttempted, isSupported, getCurrentPosition]);

  return {
    position,
    error,
    isLoading,
    isSupported,
    refetch: getCurrentPosition,
  };
}

// Hook pour vérifier si une position est dans une zone de service
export function useServiceArea() {
  const isInServiceArea = useCallback((position: GeolocationPosition): boolean => {
    // Zone de service principale: Grand Abidjan
    const abidjanBounds = {
      north: 5.45,
      south: 5.20,
      east: -3.85,
      west: -4.15,
    };

    const isInAbidjan = 
      position.lat >= abidjanBounds.south &&
      position.lat <= abidjanBounds.north &&
      position.lng >= abidjanBounds.west &&
      position.lng <= abidjanBounds.east;

    if (isInAbidjan) {
      return true;
    }

    // Autres villes de Côte d'Ivoire (zones étendues)
    const ivoryCoastBounds = {
      north: 10.74,
      south: 4.34,
      east: -2.49,
      west: -8.60,
    };

    return (
      position.lat >= ivoryCoastBounds.south &&
      position.lat <= ivoryCoastBounds.north &&
      position.lng >= ivoryCoastBounds.west &&
      position.lng <= ivoryCoastBounds.east
    );
  }, []);

  const getServiceAreaMessage = useCallback((position: GeolocationPosition): string => {
    if (isInServiceArea(position)) {
      // Déterminer la zone spécifique
      if (position.lat >= 5.20 && position.lat <= 5.45 && 
          position.lng >= -4.15 && position.lng <= -3.85) {
        return 'Vous êtes dans la zone de service d\'Abidjan';
      }
      return 'Vous êtes dans notre zone de service en Côte d\'Ivoire';
    }
    
    return 'Vous êtes en dehors de notre zone de service actuelle';
  }, [isInServiceArea]);

  return {
    isInServiceArea,
    getServiceAreaMessage,
  };
}

// Hook pour calculer la distance entre deux points
export function useDistanceCalculator() {
  const calculateDistance = useCallback((
    pos1: GeolocationPosition,
    pos2: GeolocationPosition
  ): number => {
    const R = 6371; // Rayon de la Terre en kilomètres
    const dLat = toRadians(pos2.lat - pos1.lat);
    const dLng = toRadians(pos2.lng - pos1.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(pos1.lat)) * Math.cos(toRadians(pos2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const formatDistance = useCallback((distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  }, []);

  return {
    calculateDistance,
    formatDistance,
  };
}

// Fonction utilitaire pour convertir en radians
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
