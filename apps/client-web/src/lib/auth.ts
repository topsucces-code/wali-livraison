// Types d'authentification pour WALI Livraison
export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isVerified: boolean;
  avatar?: string;
  addresses: Address[];
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  CLIENT = 'CLIENT',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN',
}

export interface Address {
  id: string;
  label: string; // "Domicile", "Bureau", etc.
  street: string;
  city: string;
  district: string; // Commune d'Abidjan
  coordinates: {
    lat: number;
    lng: number;
  };
  isDefault: boolean;
}

export interface UserPreferences {
  language: 'fr' | 'en';
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  paymentMethod: 'cash' | 'orange_money' | 'mtn_money' | 'wave';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface LoginCredentials {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterData {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
  acceptTerms: boolean;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  message: string;
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

// Configuration JWT
export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: 15 * 60 * 1000, // 15 minutes
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 jours
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'wali_access_token',
    REFRESH_TOKEN: 'wali_refresh_token',
    USER: 'wali_user',
  },
};

// Utilitaires de validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Format ivoirien : +225 XX XX XX XX XX ou 0X XX XX XX XX
  const phoneRegex = /^(\+225|0)[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Formatage du numéro de téléphone ivoirien
export const formatIvorianPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('225')) {
    return `+${cleaned}`;
  }
  
  if (cleaned.startsWith('0')) {
    return `+225${cleaned.substring(1)}`;
  }
  
  if (cleaned.length === 10) {
    return `+225${cleaned}`;
  }
  
  return phone;
};

// Gestion du stockage sécurisé
export const secureStorage = {
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('Erreur de stockage:', error);
      }
    }
  },
  
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error('Erreur de lecture:', error);
        return null;
      }
    }
    return null;
  },
  
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Erreur de suppression:', error);
      }
    }
  },
  
  clear: (): void => {
    if (typeof window !== 'undefined') {
      try {
        Object.values(JWT_CONFIG.STORAGE_KEYS).forEach(key => {
          localStorage.removeItem(key);
        });
      } catch (error) {
        console.error('Erreur de nettoyage:', error);
      }
    }
  },
};

// Vérification de l'expiration du token
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};

// Extraction des informations du token
export const getTokenPayload = (token: string): any => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};
