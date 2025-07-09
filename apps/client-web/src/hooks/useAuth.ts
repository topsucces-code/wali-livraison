'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiClient, handleApiError } from '@/lib/api-client';
import { AuthResponse, RegisterRequest, LoginRequest, VerifyOtpRequest, User } from '@wali/shared';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Charger les tokens depuis le localStorage au démarrage
  useEffect(() => {
    const loadTokens = () => {
      try {
        const accessToken = localStorage.getItem('wali_access_token');
        const refreshToken = localStorage.getItem('wali_refresh_token');
        const userStr = localStorage.getItem('wali_user');

        if (accessToken && refreshToken && userStr) {
          const user = JSON.parse(userStr);
          setState(prev => ({
            ...prev,
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          }));
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des tokens:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadTokens();
  }, []);

  // Sauvegarder les tokens dans le localStorage
  const saveTokens = useCallback((authResponse: AuthResponse) => {
    try {
      localStorage.setItem('wali_access_token', authResponse.accessToken);
      localStorage.setItem('wali_refresh_token', authResponse.refreshToken);
      localStorage.setItem('wali_user', JSON.stringify(authResponse.user));

      setState(prev => ({
        ...prev,
        user: authResponse.user,
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
        isAuthenticated: true,
        error: null,
      }));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des tokens:', error);
    }
  }, []);

  // Supprimer les tokens
  const clearTokens = useCallback(() => {
    localStorage.removeItem('wali_access_token');
    localStorage.removeItem('wali_refresh_token');
    localStorage.removeItem('wali_user');

    setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  // Inscription
  const register = useCallback(async (data: RegisterRequest): Promise<{ phone: string; message: string }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'inscription');
      }

      const result = await response.json();
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  // Connexion
  const login = useCallback(async (data: LoginRequest): Promise<{ phone: string; message: string }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la connexion');
      }

      const result = await response.json();
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  // Vérification OTP
  const verifyOtp = useCallback(async (data: VerifyOtpRequest): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Code de vérification invalide');
      }

      const authResponse: AuthResponse = await response.json();
      saveTokens(authResponse);
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  }, [saveTokens]);

  // Rafraîchissement du token
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    if (!state.refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: state.refreshToken }),
      });

      if (!response.ok) {
        clearTokens();
        return false;
      }

      const { accessToken } = await response.json();
      localStorage.setItem('wali_access_token', accessToken);
      setState(prev => ({ ...prev, accessToken }));
      return true;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error);
      clearTokens();
      return false;
    }
  }, [state.refreshToken, clearTokens]);

  // Déconnexion
  const logout = useCallback(() => {
    clearTokens();
  }, [clearTokens]);

  // Requête authentifiée
  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!state.accessToken) {
      throw new Error('Token d\'accès manquant');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${state.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Si le token a expiré, essayer de le rafraîchir
    if (response.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry avec le nouveau token
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${state.accessToken}`,
            'Content-Type': 'application/json',
          },
        });
      } else {
        throw new Error('Session expirée');
      }
    }

    return response;
  }, [state.accessToken, refreshAccessToken]);

  return {
    // État
    ...state,
    
    // Actions
    register,
    login,
    verifyOtp,
    logout,
    refreshAccessToken,
    authenticatedFetch,
    
    // Utilitaires
    clearError: () => setState(prev => ({ ...prev, error: null })),
  };
};
