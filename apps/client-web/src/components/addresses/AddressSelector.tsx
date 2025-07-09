'use client';

import { useState, useEffect } from 'react';
import { Address } from '@wali/shared';
import { useAddresses } from '@/hooks/useAddresses';

interface AddressSelectorProps {
  selectedAddress?: Address;
  onAddressSelect: (address: Address) => void;
  onAddNewAddress?: () => void;
  label?: string;
  required?: boolean;
}

export default function AddressSelector({
  selectedAddress,
  onAddressSelect,
  onAddNewAddress,
  label = "Adresse de livraison",
  required = false
}: AddressSelectorProps) {
  const { getAddresses, isLoading } = useAddresses();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const userAddresses = await getAddresses();
      setAddresses(userAddresses);
      
      // Sélectionner automatiquement l'adresse par défaut si aucune n'est sélectionnée
      if (!selectedAddress && userAddresses.length > 0) {
        const defaultAddress = userAddresses.find(addr => addr.isDefault) || userAddresses[0];
        onAddressSelect(defaultAddress);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des adresses:', error);
    }
  };

  const formatAddress = (address: Address): string => {
    const parts = [address.street];
    if (address.district) parts.push(address.district);
    parts.push(address.city);
    return parts.join(', ');
  };

  const handleAddressSelect = (address: Address) => {
    onAddressSelect(address);
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && '*'}
        </label>
        <div className="animate-pulse bg-gray-200 h-12 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && '*'}
      </label>
      
      <div className="relative">
        {/* Bouton de sélection */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-left shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
        >
          <div className="flex justify-between items-center">
            <div className="flex-1">
              {selectedAddress ? (
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedAddress.label || 'Adresse'}
                    {selectedAddress.isDefault && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                        Par défaut
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatAddress(selectedAddress)}
                  </div>
                </div>
              ) : (
                <span className="text-gray-500">Sélectionner une adresse</span>
              )}
            </div>
            <div className="ml-2">
              <svg
                className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>

        {/* Menu déroulant */}
        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
            {addresses.length === 0 ? (
              <div className="px-4 py-3 text-center text-gray-500">
                <p className="mb-2">Aucune adresse enregistrée</p>
                {onAddNewAddress && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onAddNewAddress();
                    }}
                    className="text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Ajouter une adresse
                  </button>
                )}
              </div>
            ) : (
              <>
                {addresses.map((address) => (
                  <button
                    key={address.id}
                    onClick={() => handleAddressSelect(address)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                      selectedAddress?.id === address.id ? 'bg-orange-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {address.label || 'Adresse'}
                          {address.isDefault && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                              Par défaut
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatAddress(address)}
                        </div>
                        {address.landmark && (
                          <div className="text-xs text-gray-400 mt-1">
                            📍 {address.landmark}
                          </div>
                        )}
                      </div>
                      {selectedAddress?.id === address.id && (
                        <div className="ml-2 text-orange-600">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
                
                {/* Bouton d'ajout d'adresse */}
                {onAddNewAddress && (
                  <div className="border-t border-gray-200 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onAddNewAddress();
                      }}
                      className="w-full text-left px-4 py-3 text-orange-600 hover:bg-orange-50 focus:bg-orange-50 focus:outline-none font-medium"
                    >
                      + Ajouter une nouvelle adresse
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
