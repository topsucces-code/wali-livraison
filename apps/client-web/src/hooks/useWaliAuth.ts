import { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  LoginCredentials, 
  RegisterData, 
  AuthResponse,
  UserRole 
} from '@/lib/auth';
import { authService } from '@/services/auth.service';

interface UseWaliAuthReturn {
  // État
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  clearError: () => void;

  // Utilitaires
  hasRole: (role: UserRole) => boolean;
  isClient: boolean;
  isDriver: boolean;
  isAdmin: boolean;
}

export const useWaliAuth = (): UseWaliAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialisation - vérifier si l'utilisateur est connecté
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (err) {
        console.error('Erreur d\'initialisation auth:', err);
        setError('Erreur d\'initialisation');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Connexion
  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response: AuthResponse = await authService.login(credentials);
      setUser(response.user);
      
      // Notification de succès
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('auth:login', { 
          detail: { user: response.user, message: response.message } 
        });
        window.dispatchEvent(event);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur de connexion';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Inscription
  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response: AuthResponse = await authService.register(data);
      setUser(response.user);
      
      // Notification de succès
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('auth:register', { 
          detail: { user: response.user, message: response.message } 
        });
        window.dispatchEvent(event);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur d\'inscription';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Déconnexion
  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.logout();
      setUser(null);
      
      // Notification de déconnexion
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('auth:logout');
        window.dispatchEvent(event);
      }
    } catch (err: any) {
      console.error('Erreur de déconnexion:', err);
      // Même en cas d'erreur, on déconnecte localement
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mise à jour du profil
  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedUser = await authService.updateProfile(updates);
      setUser(updatedUser);
      
      // Notification de mise à jour
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('auth:profile-updated', { 
          detail: { user: updatedUser } 
        });
        window.dispatchEvent(event);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur de mise à jour';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Effacer l'erreur
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Vérifier le rôle
  const hasRole = useCallback((role: UserRole): boolean => {
    return user?.role === role;
  }, [user]);

  // Utilitaires de rôle
  const isClient = hasRole(UserRole.CLIENT);
  const isDriver = hasRole(UserRole.DRIVER);
  const isAdmin = hasRole(UserRole.ADMIN);

  // État d'authentification
  const isAuthenticated = user !== null && authService.isAuthenticated();

  return {
    // État
    user,
    isAuthenticated,
    isLoading,
    error,

    // Actions
    login,
    register,
    logout,
    updateProfile,
    clearError,

    // Utilitaires
    hasRole,
    isClient,
    isDriver,
    isAdmin,
  };
};

// Hook pour les données utilisateur uniquement (sans actions)
export const useWaliUser = () => {
  const { user, isAuthenticated, isLoading } = useWaliAuth();
  return { user, isAuthenticated, isLoading };
};

// Hook pour vérifier les permissions
export const useWaliPermissions = () => {
  const { user, hasRole, isClient, isDriver, isAdmin } = useWaliAuth();
  
  const canCreateOrder = isClient || isAdmin;
  const canAcceptOrder = isDriver || isAdmin;
  const canViewAllOrders = isAdmin;
  const canManageUsers = isAdmin;
  
  return {
    user,
    hasRole,
    isClient,
    isDriver,
    isAdmin,
    canCreateOrder,
    canAcceptOrder,
    canViewAllOrders,
    canManageUsers,
  };
};
