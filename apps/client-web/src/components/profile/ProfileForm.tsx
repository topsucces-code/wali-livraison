'use client';

import { useState, useEffect } from 'react';
import { useUsers } from '@/hooks/useUsers';
import { UpdateProfileRequest } from '@wali/shared';

interface ProfileFormProps {
  onSuccess?: () => void;
}

export default function ProfileForm({ onSuccess }: ProfileFormProps) {
  const { 
    currentUser, 
    updateProfile, 
    uploadAvatar, 
    validateProfileData, 
    isLoading, 
    error, 
    clearError 
  } = useUsers();

  const [formData, setFormData] = useState<UpdateProfileRequest>({
    firstName: '',
    lastName: '',
    email: '',
    avatar: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Initialiser le formulaire avec les données utilisateur
  useEffect(() => {
    if (currentUser) {
      setFormData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        avatar: currentUser.avatar || '',
      });
    }
  }, [currentUser]);

  const handleInputChange = (field: keyof UpdateProfileRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearError();
    setValidationErrors([]);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation du fichier
    if (!file.type.startsWith('image/')) {
      setValidationErrors(['Veuillez sélectionner un fichier image']);
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      setValidationErrors(['L\'image ne doit pas dépasser 5MB']);
      return;
    }

    try {
      const avatarUrl = await uploadAvatar(file);
      setFormData(prev => ({ ...prev, avatar: avatarUrl }));
    } catch (error) {
      console.error('Erreur upload avatar:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Validation côté client
    const errors = validateProfileData(formData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Préparer les données modifiées uniquement
    const changedData: UpdateProfileRequest = {};
    if (formData.firstName !== currentUser?.firstName) {
      changedData.firstName = formData.firstName;
    }
    if (formData.lastName !== currentUser?.lastName) {
      changedData.lastName = formData.lastName;
    }
    if (formData.email !== currentUser?.email) {
      changedData.email = formData.email;
    }
    if (formData.avatar !== currentUser?.avatar) {
      changedData.avatar = formData.avatar;
    }

    // Si aucune modification
    if (Object.keys(changedData).length === 0) {
      setIsEditing(false);
      return;
    }

    try {
      await updateProfile(changedData);
      setIsEditing(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
    }
  };

  const handleCancel = () => {
    // Restaurer les données originales
    if (currentUser) {
      setFormData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        avatar: currentUser.avatar || '',
      });
    }
    setIsEditing(false);
    clearError();
    setValidationErrors([]);
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Mon Profil</h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Modifier
          </button>
        ) : (
          <div className="space-x-2">
            <button
              onClick={handleCancel}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
            >
              Annuler
            </button>
          </div>
        )}
      </div>

      {/* Affichage des erreurs */}
      {(error || validationErrors.length > 0) && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error && <p>{error}</p>}
          {validationErrors.map((err, index) => (
            <p key={index}>{err}</p>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center space-x-6">
          <div className="shrink-0">
            {formData.avatar ? (
              <img
                className="h-20 w-20 object-cover rounded-full"
                src={formData.avatar}
                alt="Avatar"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-orange-600 flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {formData.firstName?.[0]}{formData.lastName?.[0]}
                </span>
              </div>
            )}
          </div>
          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo de profil
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
            </div>
          )}
        </div>

        {/* Informations personnelles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              Prénom *
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              disabled={!isEditing}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100"
              required
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Nom *
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              disabled={!isEditing}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            disabled={!isEditing}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100"
          />
        </div>

        {/* Informations en lecture seule */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Téléphone
            </label>
            <input
              type="text"
              value={currentUser.phone}
              disabled
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Rôle
            </label>
            <input
              type="text"
              value={currentUser.role}
              disabled
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"
            />
          </div>
        </div>

        {/* Statut de vérification */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Statut :</span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            currentUser.isVerified 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {currentUser.isVerified ? '✓ Vérifié' : '⏳ En attente de vérification'}
          </span>
        </div>

        {/* Bouton de soumission */}
        {isEditing && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
