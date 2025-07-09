'use client';

import { useState, useCallback } from 'react';
import { UpdateProfileRequest, UserStats, PublicUser } from '@wali/shared';
import { useAuth } from './useAuth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface UseUsersState {
  isLoading: boolean;
  error: string | null;
}

export const useUsers = () => {
  const { authenticatedFetch, user: currentUser } = useAuth();
  const [state, setState] = useState<UseUsersState>({
    isLoading: false,
    error: null,
  });

  // Mise à jour du profil utilisateur
  const updateProfile = useCallback(async (data: UpdateProfileRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la mise à jour du profil');
      }

      const updatedUser = await response.json();
      setState(prev => ({ ...prev, isLoading: false }));
      return updatedUser;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, [authenticatedFetch]);

  // Récupération des statistiques utilisateur
  const getUserStats = useCallback(async (): Promise<UserStats> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/users/stats`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la récupération des statistiques');
      }

      const stats = await response.json();
      setState(prev => ({ ...prev, isLoading: false }));
      return stats;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, [authenticatedFetch]);

  // Récupération d'un utilisateur par ID (profil public)
  const getUserById = useCallback(async (userId: string): Promise<PublicUser> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/users/${userId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Utilisateur non trouvé');
      }

      const user = await response.json();
      setState(prev => ({ ...prev, isLoading: false }));
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, [authenticatedFetch]);

  // Suppression du compte utilisateur
  const deleteAccount = useCallback(async (): Promise<{ message: string }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/users/account`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression du compte');
      }

      const result = await response.json();
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, [authenticatedFetch]);

  // Upload d'avatar (simulation pour l'instant)
  const uploadAvatar = useCallback(async (file: File): Promise<string> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // TODO: Implémenter l'upload réel vers un service de stockage
      // Pour l'instant, on simule avec une URL temporaire
      const avatarUrl = URL.createObjectURL(file);
      
      // Mettre à jour le profil avec la nouvelle URL d'avatar
      await updateProfile({ avatar: avatarUrl });
      
      setState(prev => ({ ...prev, isLoading: false }));
      return avatarUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'upload';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, [updateProfile]);

  // Validation des données de profil
  const validateProfileData = useCallback((data: UpdateProfileRequest): string[] => {
    const errors: string[] = [];

    if (data.firstName !== undefined) {
      if (!data.firstName.trim()) {
        errors.push('Le prénom est requis');
      } else if (data.firstName.length < 2) {
        errors.push('Le prénom doit contenir au moins 2 caractères');
      } else if (data.firstName.length > 50) {
        errors.push('Le prénom ne peut pas dépasser 50 caractères');
      }
    }

    if (data.lastName !== undefined) {
      if (!data.lastName.trim()) {
        errors.push('Le nom est requis');
      } else if (data.lastName.length < 2) {
        errors.push('Le nom doit contenir au moins 2 caractères');
      } else if (data.lastName.length > 50) {
        errors.push('Le nom ne peut pas dépasser 50 caractères');
      }
    }

    if (data.email !== undefined && data.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push('L\'adresse email n\'est pas valide');
      }
    }

    return errors;
  }, []);

  return {
    // État
    ...state,
    currentUser,

    // Actions
    updateProfile,
    getUserStats,
    getUserById,
    deleteAccount,
    uploadAvatar,

    // Utilitaires
    validateProfileData,
    clearError: () => setState(prev => ({ ...prev, error: null })),
  };
};
