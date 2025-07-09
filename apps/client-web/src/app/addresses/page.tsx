'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAddresses } from '@/hooks/useAddresses';
import { useRouter } from 'next/navigation';
import { Address } from '@wali/shared';
import AddressForm from '@/components/addresses/AddressForm';
import AddressList from '@/components/addresses/AddressList';

export default function AddressesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { getAddresses, isLoading: addressesLoading } = useAddresses();
  const router = useRouter();
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAddresses();
    }
  }, [isAuthenticated]);

  const loadAddresses = async () => {
    try {
      const userAddresses = await getAddresses();
      setAddresses(userAddresses);
    } catch (error) {
      console.error('Erreur lors du chargement des adresses:', error);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setShowForm(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setShowForm(true);
  };

  const handleFormSuccess = (address: Address) => {
    setShowForm(false);
    setEditingAddress(null);
    loadAddresses(); // Recharger la liste
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAddress(null);
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
              <h1 className="text-2xl font-bold text-gray-900">Mes Adresses</h1>
            </div>
            <button
              onClick={handleAddAddress}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              + Nouvelle adresse
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Formulaire d'ajout/modification */}
          {showForm && (
            <div className="mb-8">
              <AddressForm
                address={editingAddress || undefined}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          )}

          {/* Liste des adresses */}
          {!showForm && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Mes adresses de livraison
                </h2>
                <span className="text-sm text-gray-500">
                  {addresses.length} adresse{addresses.length !== 1 ? 's' : ''}
                </span>
              </div>

              {addressesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                </div>
              ) : (
                <AddressList
                  addresses={addresses}
                  onEdit={handleEditAddress}
                  onRefresh={loadAddresses}
                />
              )}

              {/* Bouton d'ajout si aucune adresse */}
              {!addressesLoading && addresses.length === 0 && (
                <div className="text-center">
                  <button
                    onClick={handleAddAddress}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg text-lg font-medium"
                  >
                    Ajouter ma première adresse
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Informations utiles */}
          {!showForm && (
            <div className="mt-8 bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                💡 Conseils pour vos adresses
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <h4 className="font-medium mb-2">📍 Précision de localisation</h4>
                  <p>
                    Utilisez les boutons de géolocalisation pour obtenir des coordonnées précises 
                    et faciliter la livraison.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">🏠 Points de repère</h4>
                  <p>
                    Ajoutez des points de repère (pharmacie, école, carrefour) pour aider 
                    nos livreurs à vous trouver facilement.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">⭐ Adresse par défaut</h4>
                  <p>
                    Définissez votre adresse principale comme par défaut pour accélérer 
                    vos commandes futures.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">🗺️ Zones de livraison</h4>
                  <p>
                    Nous livrons dans toute la Côte d'Ivoire. Les coordonnées GPS doivent 
                    être situées sur le territoire ivoirien.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
