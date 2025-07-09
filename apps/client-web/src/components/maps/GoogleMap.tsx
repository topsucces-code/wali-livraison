'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface GoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  width?: string;
  onMapLoad?: (map: google.maps.Map) => void;
  onLocationSelect?: (location: { lat: number; lng: number; address?: string }) => void;
  markers?: Array<{
    position: { lat: number; lng: number };
    title?: string;
    icon?: string;
    onClick?: () => void;
  }>;
  showCurrentLocation?: boolean;
  enableLocationSelection?: boolean;
  className?: string;
}

// Configuration par défaut pour Abidjan
const ABIDJAN_CENTER = { lat: 5.3364, lng: -4.0267 };
const DEFAULT_ZOOM = 12;

// Clé API Google Maps (à remplacer par votre vraie clé)
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE';

export function GoogleMap({
  center = ABIDJAN_CENTER,
  zoom = DEFAULT_ZOOM,
  height = '400px',
  width = '100%',
  onMapLoad,
  onLocationSelect,
  markers = [],
  showCurrentLocation = false,
  enableLocationSelection = false,
  className = '',
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLocationMarker, setCurrentLocationMarker] = useState<google.maps.Marker | null>(null);
  const [selectedLocationMarker, setSelectedLocationMarker] = useState<google.maps.Marker | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Initialisation de Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places', 'geometry'],
        });

        await loader.load();
        setIsLoaded(true);
      } catch (err) {
        console.error('Erreur de chargement Google Maps:', err);
        setError('Impossible de charger Google Maps. Vérifiez votre connexion internet.');
      }
    };

    if (!isLoaded && !error) {
      initMap();
    }
  }, [isLoaded, error]);

  // Création de la carte
  useEffect(() => {
    if (isLoaded && mapRef.current && !map) {
      const newMap = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      });

      setMap(newMap);
      onMapLoad?.(newMap);

      // Gestion des clics sur la carte pour sélection de lieu
      if (enableLocationSelection) {
        newMap.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            const position = {
              lat: event.latLng.lat(),
              lng: event.latLng.lng(),
            };
            
            handleLocationSelection(position, newMap);
          }
        });
      }
    }
  }, [isLoaded, map, center, zoom, onMapLoad, enableLocationSelection]);

  // Gestion de la sélection de lieu
  const handleLocationSelection = useCallback(async (
    position: { lat: number; lng: number },
    mapInstance: google.maps.Map
  ) => {
    // Supprimer le marqueur précédent
    if (selectedLocationMarker) {
      selectedLocationMarker.setMap(null);
    }

    // Créer un nouveau marqueur
    const marker = new google.maps.Marker({
      position,
      map: mapInstance,
      title: 'Lieu sélectionné',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#3B82F6"/>
            <circle cx="12" cy="9" r="2.5" fill="white"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(24, 24),
      },
    });

    setSelectedLocationMarker(marker);

    // Géocodage inverse pour obtenir l'adresse
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ location: position });
      
      if (response.results[0]) {
        onLocationSelect?.({
          ...position,
          address: response.results[0].formatted_address,
        });
      } else {
        onLocationSelect?.(position);
      }
    } catch (error) {
      console.error('Erreur de géocodage:', error);
      onLocationSelect?.(position);
    }
  }, [selectedLocationMarker, onLocationSelect]);

  // Affichage de la position actuelle
  useEffect(() => {
    if (map && showCurrentLocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const currentPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            // Supprimer le marqueur précédent
            if (currentLocationMarker) {
              currentLocationMarker.setMap(null);
            }

            // Créer le marqueur de position actuelle
            const marker = new google.maps.Marker({
              position: currentPos,
              map,
              title: 'Votre position',
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10" cy="10" r="8" fill="#10B981" stroke="white" stroke-width="2"/>
                    <circle cx="10" cy="10" r="3" fill="white"/>
                  </svg>
                `),
                scaledSize: new google.maps.Size(20, 20),
              },
            });

            setCurrentLocationMarker(marker);

            // Centrer la carte sur la position actuelle
            map.setCenter(currentPos);
          },
          (error) => {
            console.error('Erreur de géolocalisation:', error);
          }
        );
      }
    }
  }, [map, showCurrentLocation, currentLocationMarker]);

  // Gestion des marqueurs personnalisés
  useEffect(() => {
    if (map) {
      // Supprimer les anciens marqueurs
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Créer les nouveaux marqueurs
      markers.forEach((markerData) => {
        const marker = new google.maps.Marker({
          position: markerData.position,
          map,
          title: markerData.title,
          icon: markerData.icon,
        });

        if (markerData.onClick) {
          marker.addListener('click', markerData.onClick);
        }

        markersRef.current.push(marker);
      });
    }
  }, [map, markers]);

  // Nettoyage
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      if (currentLocationMarker) {
        currentLocationMarker.setMap(null);
      }
      if (selectedLocationMarker) {
        selectedLocationMarker.setMap(null);
      }
    };
  }, []);

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg ${className}`}
        style={{ height, width }}
      >
        <div className="text-center p-4">
          <div className="text-red-600 mb-2">⚠️</div>
          <p className="text-sm text-gray-600">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setIsLoaded(false);
            }}
            className="mt-2 text-blue-600 text-sm hover:underline"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg ${className}`}
        style={{ height, width }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className={`rounded-lg overflow-hidden ${className}`}
      style={{ height, width }}
    />
  );
}
