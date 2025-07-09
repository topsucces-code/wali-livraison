'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Loader2, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Types pour les coordonnées
export interface LatLng {
  lat: number;
  lng: number;
}

// Types pour les markers
export interface MapMarker {
  id: string;
  position: LatLng;
  title: string;
  type: 'pickup' | 'delivery' | 'driver' | 'user';
  icon?: string;
}

// Props du composant Map
interface MapProps {
  center: LatLng;
  zoom: number;
  markers?: MapMarker[];
  onMapClick?: (position: LatLng) => void;
  onMarkerClick?: (marker: MapMarker) => void;
  showUserLocation?: boolean;
  showTraffic?: boolean;
  className?: string;
}

// Composant Map interne (utilise l'API Google Maps directement)
const Map: React.FC<MapProps> = ({
  center,
  zoom,
  markers = [],
  onMapClick,
  onMarkerClick,
  showUserLocation = true,
  showTraffic = false,
  className = '',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Initialisation de la carte
  useEffect(() => {
    if (!mapRef.current || map) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center,
      zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    setMap(mapInstance);

    // Gestionnaire de clic sur la carte
    if (onMapClick) {
      mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          onMapClick({
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
          });
        }
      });
    }
  }, [center, zoom, onMapClick, map]);

  // Géolocalisation de l'utilisateur
  useEffect(() => {
    if (!showUserLocation) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(userPos);

          // Centrer la carte sur la position de l'utilisateur si c'est Abidjan
          if (isInAbidjan(userPos)) {
            map?.setCenter(userPos);
            map?.setZoom(15);
          }
        },
        (error) => {
          console.warn('Géolocalisation échouée:', error);
          // Position par défaut : Plateau, Abidjan
          const defaultPos = { lat: 5.3364, lng: -4.0267 };
          setUserLocation(defaultPos);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    }
  }, [showUserLocation, map]);

  // Gestion des markers
  useEffect(() => {
    if (!map) return;

    // Supprimer les anciens markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Ajouter les nouveaux markers
    markers.forEach((markerData) => {
      const marker = new google.maps.Marker({
        position: markerData.position,
        map,
        title: markerData.title,
        icon: getMarkerIcon(markerData.type),
        animation: markerData.type === 'driver' ? google.maps.Animation.BOUNCE : undefined,
      });

      // Gestionnaire de clic sur le marker
      if (onMarkerClick) {
        marker.addListener('click', () => onMarkerClick(markerData));
      }

      markersRef.current.push(marker);
    });

    // Ajouter le marker de position utilisateur
    if (userLocation && showUserLocation) {
      const userMarker = new google.maps.Marker({
        position: userLocation,
        map,
        title: 'Votre position',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="8" fill="#3B82F6" stroke="#FFFFFF" stroke-width="2"/>
              <circle cx="10" cy="10" r="3" fill="#FFFFFF"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(20, 20),
          anchor: new google.maps.Point(10, 10),
        },
      });

      markersRef.current.push(userMarker);
    }
  }, [map, markers, userLocation, showUserLocation, onMarkerClick]);

  // Affichage du trafic
  useEffect(() => {
    if (!map) return;

    const trafficLayer = new google.maps.TrafficLayer();
    if (showTraffic) {
      trafficLayer.setMap(map);
    } else {
      trafficLayer.setMap(null);
    }

    return () => trafficLayer.setMap(null);
  }, [map, showTraffic]);

  return <div ref={mapRef} className={`w-full h-full ${className}`} />;
};

// Fonction pour obtenir l'icône du marker selon le type
const getMarkerIcon = (type: MapMarker['type']): google.maps.Icon => {
  const icons = {
    pickup: {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 2C11.6 2 8 5.6 8 10C8 16 16 30 16 30S24 16 24 10C24 5.6 20.4 2 16 2Z" fill="#10B981" stroke="#FFFFFF" stroke-width="2"/>
          <circle cx="16" cy="10" r="4" fill="#FFFFFF"/>
        </svg>
      `),
      scaledSize: new google.maps.Size(32, 32),
      anchor: new google.maps.Point(16, 32),
    },
    delivery: {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 2C11.6 2 8 5.6 8 10C8 16 16 30 16 30S24 16 24 10C24 5.6 20.4 2 16 2Z" fill="#EF4444" stroke="#FFFFFF" stroke-width="2"/>
          <circle cx="16" cy="10" r="4" fill="#FFFFFF"/>
        </svg>
      `),
      scaledSize: new google.maps.Size(32, 32),
      anchor: new google.maps.Point(16, 32),
    },
    driver: {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 2C11.6 2 8 5.6 8 10C8 16 16 30 16 30S24 16 24 10C24 5.6 20.4 2 16 2Z" fill="#F59E0B" stroke="#FFFFFF" stroke-width="2"/>
          <path d="M12 8H20L18 12H14L12 8Z" fill="#FFFFFF"/>
          <circle cx="14" cy="14" r="1" fill="#FFFFFF"/>
          <circle cx="18" cy="14" r="1" fill="#FFFFFF"/>
        </svg>
      `),
      scaledSize: new google.maps.Size(32, 32),
      anchor: new google.maps.Point(16, 32),
    },
    user: {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="#FFFFFF" stroke-width="2"/>
          <circle cx="12" cy="12" r="4" fill="#FFFFFF"/>
        </svg>
      `),
      scaledSize: new google.maps.Size(24, 24),
      anchor: new google.maps.Point(12, 12),
    },
  };

  return icons[type];
};

// Fonction pour vérifier si une position est à Abidjan
const isInAbidjan = (position: LatLng): boolean => {
  const abidjanBounds = {
    north: 5.45,
    south: 5.20,
    east: -3.85,
    west: -4.15,
  };

  return (
    position.lat >= abidjanBounds.south &&
    position.lat <= abidjanBounds.north &&
    position.lng >= abidjanBounds.west &&
    position.lng <= abidjanBounds.east
  );
};

// Composant de rendu conditionnel pour le statut de chargement
const MapStatus: React.FC<{ status: Status }> = ({ status }) => {
  switch (status) {
    case Status.LOADING:
      return (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-gray-600">Chargement de la carte...</p>
          </div>
        </div>
      );
    case Status.FAILURE:
      return (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <div className="text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <p className="text-sm text-red-600">Erreur de chargement de la carte</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Réessayer
            </Button>
          </div>
        </div>
      );
    default:
      return null;
  }
};

// Props du composant principal MapContainer
export interface MapContainerProps extends Omit<MapProps, 'center' | 'zoom'> {
  center?: LatLng;
  zoom?: number;
  height?: string;
  width?: string;
}

// Composant principal MapContainer avec wrapper Google Maps
export const MapContainer: React.FC<MapContainerProps> = ({
  center = { lat: 5.3364, lng: -4.0267 }, // Plateau, Abidjan par défaut
  zoom = 13,
  height = '400px',
  width = '100%',
  className = '',
  ...mapProps
}) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ height, width }}
      >
        <div className="text-center">
          <MapPin className="h-8 w-8 mx-auto mb-2 text-red-500" />
          <p className="text-sm text-red-600">Clé API Google Maps manquante</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height, width }} className={className}>
      <Wrapper
        apiKey={apiKey}
        render={(status) => <MapStatus status={status} />}
        libraries={['places', 'geometry']}
        language="fr"
        region="CI"
      >
        <Map center={center} zoom={zoom} {...mapProps} />
      </Wrapper>
    </div>
  );
};
