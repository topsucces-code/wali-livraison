'use client';

import { useEffect, useState } from 'react';

export default function StatusPage() {
  const [checks, setChecks] = useState({
    nextjs: false,
    react: false,
    googleMaps: false,
    env: false,
    backend: false,
  });

  useEffect(() => {
    // Test Next.js
    setChecks(prev => ({ ...prev, nextjs: true }));

    // Test React
    if (typeof window !== 'undefined') {
      setChecks(prev => ({ ...prev, react: true }));
    }

    // Test variables d'environnement
    if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      setChecks(prev => ({ ...prev, env: true }));
    }

    // Test Google Maps
    const testGoogleMaps = () => {
      if (window.google?.maps) {
        setChecks(prev => ({ ...prev, googleMaps: true }));
      } else {
        setTimeout(testGoogleMaps, 1000);
      }
    };
    testGoogleMaps();

    // Test Backend
    fetch('http://localhost:3001/api/v1/health')
      .then(() => setChecks(prev => ({ ...prev, backend: true })))
      .catch(() => setChecks(prev => ({ ...prev, backend: false })));
  }, []);

  const getStatusIcon = (status: boolean) => status ? '✅' : '❌';
  const getStatusText = (status: boolean) => status ? 'OK' : 'ERREUR';

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🔍 Statut Système WALI Livraison</h1>
      
      <div style={{ marginTop: '30px' }}>
        <h2>Composants Système</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Composant</th>
              <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>Statut</th>
              <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>Next.js</td>
              <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>
                {getStatusIcon(checks.nextjs)} {getStatusText(checks.nextjs)}
              </td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>Framework React</td>
            </tr>
            <tr>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>React</td>
              <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>
                {getStatusIcon(checks.react)} {getStatusText(checks.react)}
              </td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>Bibliothèque UI</td>
            </tr>
            <tr>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>Variables ENV</td>
              <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>
                {getStatusIcon(checks.env)} {getStatusText(checks.env)}
              </td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>Configuration .env.local</td>
            </tr>
            <tr>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>Google Maps API</td>
              <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>
                {getStatusIcon(checks.googleMaps)} {getStatusText(checks.googleMaps)}
              </td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>API de cartographie</td>
            </tr>
            <tr>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>Backend API</td>
              <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>
                {getStatusIcon(checks.backend)} {getStatusText(checks.backend)}
              </td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>Serveur NestJS (Port 3001)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2>Configuration Détaillée</h2>
        <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', marginTop: '10px' }}>
          <h3>Variables d'Environnement</h3>
          <ul style={{ marginTop: '10px' }}>
            <li><strong>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:</strong> {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Configurée' : 'Non configurée'}</li>
            <li><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</li>
          </ul>
        </div>

        <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', marginTop: '10px' }}>
          <h3>URLs de Test</h3>
          <ul style={{ marginTop: '10px' }}>
            <li><a href="/" style={{ color: '#007bff' }}>Page d'accueil</a></li>
            <li><a href="/simple" style={{ color: '#007bff' }}>Test Google Maps simple</a></li>
            <li><a href="/maps-stable" style={{ color: '#007bff' }}>Version Google Maps stable</a></li>
            <li><a href="/debug-maps" style={{ color: '#007bff' }}>Diagnostic Google Maps</a></li>
          </ul>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2>Actions Recommandées</h2>
        {!checks.env && (
          <div style={{ backgroundColor: '#fff3cd', padding: '10px', borderRadius: '5px', marginTop: '10px' }}>
            ⚠️ <strong>Clé API manquante:</strong> Configurez NEXT_PUBLIC_GOOGLE_MAPS_API_KEY dans .env.local
          </div>
        )}
        {!checks.googleMaps && checks.env && (
          <div style={{ backgroundColor: '#f8d7da', padding: '10px', borderRadius: '5px', marginTop: '10px' }}>
            ❌ <strong>Google Maps non chargé:</strong> Vérifiez la clé API dans Google Cloud Console
          </div>
        )}
        {!checks.backend && (
          <div style={{ backgroundColor: '#d1ecf1', padding: '10px', borderRadius: '5px', marginTop: '10px' }}>
            ℹ️ <strong>Backend hors ligne:</strong> L'application fonctionne en mode fallback
          </div>
        )}
        {checks.nextjs && checks.react && checks.env && checks.googleMaps && (
          <div style={{ backgroundColor: '#d4edda', padding: '10px', borderRadius: '5px', marginTop: '10px' }}>
            ✅ <strong>Système opérationnel:</strong> Tous les composants principaux fonctionnent !
          </div>
        )}
      </div>

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <button 
          onClick={() => window.location.reload()}
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
          🔄 Actualiser
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
          🏠 Accueil
        </button>
      </div>

      <div style={{ marginTop: '30px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
        WALI Livraison - Diagnostic Système v1.0
      </div>
    </div>
  );
}
