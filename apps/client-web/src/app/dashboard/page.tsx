'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirection en cours
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">WALI Livraison</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Bonjour, {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={() => window.location.href = '/profile'}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Mon Profil
              </button>
              <button
                onClick={logout}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Bienvenue sur WALI Livraison ! 🎉
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Votre plateforme de livraison en Côte d'Ivoire
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-orange-600 text-4xl mb-4">🍕</div>
                  <h3 className="text-xl font-semibold mb-2">Restaurants</h3>
                  <p className="text-gray-600">Commandez vos plats préférés</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-orange-600 text-4xl mb-4">🛒</div>
                  <h3 className="text-xl font-semibold mb-2">Courses</h3>
                  <p className="text-gray-600">Faites vos courses en ligne</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-orange-600 text-4xl mb-4">📦</div>
                  <h3 className="text-xl font-semibold mb-2">Colis</h3>
                  <p className="text-gray-600">Envoyez vos colis rapidement</p>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <button className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg text-lg font-medium block w-full">
                  Commencer une livraison
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => window.location.href = '/addresses'}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2"
                  >
                    <span>📍</span>
                    <span>Mes Adresses</span>
                  </button>

                  <button
                    onClick={() => window.location.href = '/orders'}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2"
                  >
                    <span>📦</span>
                    <span>Mes Commandes</span>
                  </button>
                </div>
              </div>

              <div className="mt-8 p-4 bg-green-100 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">✅ Authentification Réussie !</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>Utilisateur :</strong> {user?.firstName} {user?.lastName}</p>
                  <p><strong>Téléphone :</strong> {user?.phone}</p>
                  <p><strong>Email :</strong> {user?.email || 'Non renseigné'}</p>
                  <p><strong>Rôle :</strong> {user?.role}</p>
                  <p><strong>Statut :</strong> {user?.isVerified ? 'Vérifié' : 'Non vérifié'}</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-100 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">🔧 Module d'Authentification Fonctionnel</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>✅ Inscription par SMS avec code OTP</p>
                  <p>✅ Connexion sécurisée avec tokens JWT</p>
                  <p>✅ Validation des numéros ivoiriens (+225)</p>
                  <p>✅ Gestion automatique des sessions</p>
                  <p>✅ Interface utilisateur responsive</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
