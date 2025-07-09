'use client';

import { useEffect, useRef, useState } from 'react';

export default function SimplePage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState('Chargement...');

  useEffect(() => {
    // Fonction d'initialisation globale
    (window as any).initSimpleMap = () => {
      if (!mapRef.current) return;
      
      try {
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 5.3364, lng: -4.0267 },
          zoom: 13,
        });

        new google.maps.Marker({
          position: { lat: 5.3364, lng: -4.0267 },
          map,
          title: 'WALI Livraison - Plateau, Abidjan',
        });

        setStatus('✅ Google Maps fonctionne !');
      } catch (error) {
        setStatus(`❌ Erreur: ${error}`);
      }
    };

    // Charger Google Maps si pas déjà fait
    if (!window.google?.maps) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBgNfqhT6lk47eh3gA0Oc9uxsB16r5lTMY&callback=initSimpleMap`;
      script.async = true;
      script.defer = true;
      script.onerror = () => setStatus('❌ Erreur de chargement Google Maps');
      document.head.appendChild(script);
    } else {
      (window as any).initSimpleMap();
    }
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🗺️ Test Google Maps Ultra-Simple</h1>
      <p>Statut: {status}</p>
      
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '400px', 
          backgroundColor: '#f0f0f0',
          border: '1px solid #ccc',
          marginTop: '20px'
        }}
      />

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h3>Instructions :</h3>
        <ul>
          <li>Cette page teste Google Maps de la manière la plus simple possible</li>
          <li>Si cette page fonctionne, le problème vient des composants complexes</li>
          <li>Si cette page ne fonctionne pas, le problème vient de la clé API</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => window.location.href = '/maps-stable'}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Version Stable
        </button>
        
        <button 
          onClick={() => window.location.href = '/'}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Accueil
        </button>
      </div>
    </div>
  );
}
