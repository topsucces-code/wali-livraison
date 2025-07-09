'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Script from 'next/script';

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: string | null;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: null,
});

export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
  }
  return context;
};

interface GoogleMapsProviderProps {
  children: React.ReactNode;
}

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Vérifier si Google Maps est déjà chargé
  useEffect(() => {
    if (window.google?.maps) {
      setIsLoaded(true);
      setScriptLoaded(true);
    }
  }, []);

  const handleScriptLoad = () => {
    console.log('✅ Google Maps API loaded successfully');
    setScriptLoaded(true);

    // Vérifier que l'API est vraiment disponible avec un délai
    setTimeout(() => {
      if (window.google?.maps) {
        setIsLoaded(true);
        setLoadError(null);
      } else {
        setLoadError('Google Maps API loaded but not available');
      }
    }, 100);
  };

  const handleScriptError = (error: any) => {
    console.error('❌ Failed to load Google Maps API:', error);
    setLoadError('Failed to load Google Maps API');
    setIsLoaded(false);
  };

  if (!apiKey) {
    return (
      <GoogleMapsContext.Provider value={{ isLoaded: false, loadError: 'Google Maps API key not configured' }}>
        {children}
      </GoogleMapsContext.Provider>
    );
  }

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {!scriptLoaded && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&language=fr&region=CI&loading=async`}
          strategy="afterInteractive"
          onLoad={handleScriptLoad}
          onError={handleScriptError}
        />
      )}
      {children}
    </GoogleMapsContext.Provider>
  );
};
