'use client';

import { useState } from 'react';
import { Address } from '@wali/shared';
import { useAddresses } from '@/hooks/useAddresses';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Edit, Star, Trash2, Copy, ExternalLink } from 'lucide-react';

interface AddressListProps {
  addresses: Address[];
  onEdit?: (address: Address) => void;
  onRefresh?: () => void;
}

export default function AddressList({ addresses, onEdit, onRefresh }: AddressListProps) {
  const { deleteAddress, setDefaultAddress, isLoading } = useAddresses();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const handleDelete = async (address: Address) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'adresse "${address.label || address.street}" ?`)) {
      return;
    }

    setDeletingId(address.id);
    try {
      await deleteAddress(address.id);
      onRefresh?.();
    } catch (error) {
      console.error('Erreur suppression adresse:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (address: Address) => {
    if (address.isDefault) return;

    setSettingDefaultId(address.id);
    try {
      await setDefaultAddress(address.id);
      onRefresh?.();
    } catch (error) {
      console.error('Erreur définition adresse par défaut:', error);
    } finally {
      setSettingDefaultId(null);
    }
  };

  const formatAddress = (address: Address): string => {
    const parts = [address.street];
    if (address.district) parts.push(address.district);
    parts.push(address.city);
    return parts.join(', ');
  };

  if (addresses.length === 0) {
    return (
      <div className="text-center py-12">
        <MapPin className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucune adresse</h3>
        <p className="text-muted-foreground mb-6">
          Vous n'avez pas encore ajouté d'adresse de livraison
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {addresses.map((address) => (
        <Card
          key={address.id}
          className={`${
            address.isDefault ? 'border-primary' : ''
          }`}
        >
          <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {/* En-tête avec libellé et badge par défaut */}
              <div className="flex items-center space-x-3 mb-2">
                {address.label && (
                  <h3 className="text-lg font-semibold text-gray-900">
                    {address.label}
                  </h3>
                )}
                {address.isDefault && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Par défaut
                  </span>
                )}
              </div>

              {/* Adresse complète */}
              <p className="text-gray-700 mb-2">
                {formatAddress(address)}
              </p>

              {/* Point de repère */}
              {address.landmark && (
                <p className="text-sm text-gray-500 mb-2">
                  📍 {address.landmark}
                </p>
              )}

              {/* Coordonnées GPS */}
              <p className="text-xs text-gray-400">
                GPS: {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col space-y-2 ml-4">
              {/* Bouton Modifier */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit?.(address)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>

              {/* Bouton Définir par défaut */}
              {!address.isDefault && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSetDefault(address)}
                  disabled={settingDefaultId === address.id}
                >
                  <Star className="w-4 h-4 mr-2" />
                  {settingDefaultId === address.id ? 'Définition...' : 'Par défaut'}
                </Button>
              )}

              {/* Bouton Supprimer */}
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(address)}
                disabled={deletingId === address.id}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deletingId === address.id ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>

          {/* Carte miniature (placeholder) */}
          <div className="mt-4 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-1">🗺️</div>
              <p className="text-sm">Carte interactive</p>
              <p className="text-xs">
                {address.city} - {address.district || 'Centre-ville'}
              </p>
            </div>
          </div>

            {/* Actions rapides */}
            <div className="mt-4 flex space-x-4 text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const url = `https://www.google.com/maps?q=${address.latitude},${address.longitude}`;
                  window.open(url, '_blank');
                }}
                className="h-auto p-2"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Voir sur Google Maps
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const addressText = formatAddress(address);
                  navigator.clipboard.writeText(addressText);
                  alert('Adresse copiée dans le presse-papiers');
                }}
                className="h-auto p-2"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copier l'adresse
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
