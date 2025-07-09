'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, AlertCircle } from 'lucide-react';
import { useGoogleMaps } from './GoogleMapsProvider';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface SimpleMapMarker {
  id: string;
  position: LatLng;
  title: string;
  color?: 'red' | 'green' | 'blue' | 'orange';
}

interface SimpleMapProps {
  center?: LatLng;
  zoom?: number;
  height?: string;
  width?: string;
  markers?: SimpleMapMarker[];
  onMapClick?: (position: LatLng) => void;
  className?: string;
}

export const SimpleMap: React.FC<SimpleMapProps> = ({
  center = { lat: 5.3364, lng: -4.0267 }, // Plateau, Abidjan
  zoom = 13,
  height = '400px',
  width = '100%',
  markers = [],
  onMapClick,
  className = '',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const { isLoaded, loadError } = useGoogleMaps();
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Le chargement est maintenant géré par le GoogleMapsProvider

  // Initialiser la carte quand Google Maps est chargé
  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    try {
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

      // Gestionnaire de clic
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

      console.log('✅ Carte simple initialisée avec succès');
    } catch (err) {
      console.error('❌ Erreur d\'initialisation de la carte:', err);
    }
  }, [isLoaded, center, zoom, onMapClick, map]);

  // Gérer les markers
  useEffect(() => {
    if (!map) return;

    // Supprimer les anciens markers de manière sécurisée
    markersRef.current.forEach(marker => {
      try {
        if (marker && marker.setMap) {
          marker.setMap(null);
        }
      } catch (e) {
        // Ignorer les erreurs de suppression
        console.warn('Erreur lors de la suppression du marker:', e);
      }
    });
    markersRef.current = [];

    // Ajouter les nouveaux markers (avec fallback pour compatibilité)
    markers.forEach((markerData) => {
      try {
        // Essayer d'utiliser AdvancedMarkerElement si disponible
        if (google.maps.marker?.AdvancedMarkerElement) {
          const marker = new google.maps.marker.AdvancedMarkerElement({
            position: markerData.position,
            map,
            title: markerData.title,
          });
          markersRef.current.push(marker as any);
        } else {
          // Fallback vers Marker classique
          const marker = new google.maps.Marker({
            position: markerData.position,
            map,
            title: markerData.title,
            icon: getMarkerIcon(markerData.color || 'red'),
          });
          markersRef.current.push(marker);
        }
      } catch (error) {
        // En cas d'erreur, utiliser Marker classique
        const marker = new google.maps.Marker({
          position: markerData.position,
          map,
          title: markerData.title,
          icon: getMarkerIcon(markerData.color || 'red'),
        });
        markersRef.current.push(marker);
      }
    });
  }, [map, markers]);

  // Fonction pour obtenir l'icône du marker
  const getMarkerIcon = (color: string) => {
    const colors = {
      red: '#EF4444',
      green: '#10B981',
      blue: '#3B82F6',
      orange: '#EA580C',
    };

    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 2C11.6 2 8 5.6 8 10C8 16 16 30 16 30S24 16 24 10C24 5.6 20.4 2 16 2Z" fill="${colors[color] || colors.red}" stroke="#FFFFFF" stroke-width="2"/>
          <circle cx="16" cy="10" r="4" fill="#FFFFFF"/>
        </svg>
      `),
      scaledSize: new google.maps.Size(32, 32),
      anchor: new google.maps.Point(16, 32),
    };
  };

  if (loadError) {
    return (
      <div
        className={`flex items-center justify-center bg-red-50 border border-red-200 rounded-lg ${className}`}
        style={{ height, width }}
      >
        <div className="text-center text-red-600">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ height, width }}
      >
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-gray-600">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height, width }} className={className}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
    </div>
  );
};

// Hook pour vérifier si Google Maps est disponible (utilise maintenant le Provider)
export function useGoogleMapsLoaded() {
  return useGoogleMaps();
}
