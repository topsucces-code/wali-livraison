'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';
import { useRouter } from 'next/navigation';
import ProfileForm from '@/components/profile/ProfileForm';
import { UserStats } from '@wali/shared';

export default function ProfilePage() {
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { getUserStats, deleteAccount, isLoading: usersLoading } = useUsers();
  const router = useRouter();
  
  const [stats, setStats] = useState<UserStats | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserStats();
    }
  }, [isAuthenticated]);

  const loadUserStats = async () => {
    try {
      const userStats = await getUserStats();
      setStats(userStats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      logout();
      router.push('/');
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
    }
  };

  if (authLoading) {
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Retour au dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
            </div>
            <button
              onClick={logout}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Formulaire de profil */}
            <div className="lg:col-span-2">
              <ProfileForm onSuccess={loadUserStats} />
            </div>

            {/* Statistiques et actions */}
            <div className="space-y-6">
              
              {/* Statistiques utilisateur */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Mes Statistiques</h3>
                
                {stats ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Commandes totales</span>
                      <span className="font-semibold text-orange-600">{stats.totalOrders}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Commandes livrées</span>
                      <span className="font-semibold text-green-600">{stats.completedOrders}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total dépensé</span>
                      <span className="font-semibold text-blue-600">{stats.totalSpent.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Note moyenne</span>
                      <span className="font-semibold text-yellow-600">
                        {stats.averageRating > 0 ? `${stats.averageRating}/5 ⭐` : 'Aucune note'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                  </div>
                )}
              </div>

              {/* Actions rapides */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/addresses')}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📍</span>
                      <div>
                        <p className="font-medium text-gray-900">Mes Adresses</p>
                        <p className="text-sm text-gray-600">Gérer mes adresses de livraison</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => router.push('/orders')}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📦</span>
                      <div>
                        <p className="font-medium text-gray-900">Mes Commandes</p>
                        <p className="text-sm text-gray-600">Historique et suivi</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => router.push('/settings')}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">⚙️</span>
                      <div>
                        <p className="font-medium text-gray-900">Paramètres</p>
                        <p className="text-sm text-gray-600">Notifications et préférences</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Zone de danger */}
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
                <h3 className="text-lg font-semibold text-red-900 mb-4">Zone de Danger</h3>
                
                <p className="text-sm text-gray-600 mb-4">
                  La suppression de votre compte est irréversible. Toutes vos données seront perdues.
                </p>

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Supprimer mon compte
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-red-900">
                      Êtes-vous sûr de vouloir supprimer votre compte ?
                    </p>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={usersLoading}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                      >
                        {usersLoading ? 'Suppression...' : 'Oui, supprimer'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
