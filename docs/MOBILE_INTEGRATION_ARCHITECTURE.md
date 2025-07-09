# 🔗 Architecture d'Intégration Mobile - WALI Livraison

## 🏗️ Vue d'Ensemble de l'Intégration

### **Écosystème Actuel (Fonctionnel)**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend Web  │    │   Backend API   │    │   Base de       │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│   Données       │
│                 │    │                 │    │   (PostgreSQL)  │
│   ✅ Auth       │    │   ✅ Auth       │    │   ✅ Prisma     │
│   ✅ Dashboard  │    │   ✅ JWT        │    │   ✅ Schéma     │
│   ✅ Routing    │    │   ✅ SMS OTP    │    │   ✅ Migrations │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Intégration Mobile Future**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile Apps   │    │   Backend API   │    │   Packages      │
│   (React Native)│◄──►│   (Existant)    │◄──►│   Partagés      │
│                 │    │                 │    │                 │
│   📱 Client     │    │   🔄 Même API   │    │   📦 @wali/     │
│   🚚 Driver     │    │   🔄 Même Auth  │    │       shared    │
│   🔄 Réutilise  │    │   🔄 Même DB    │    │   📦 @wali/     │
│      tout       │    │                 │    │       database  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Intégration API Backend

### **5.1 Réutilisation Complète de l'API Existante**

#### **Endpoints d'Authentification (100% Compatible)**
```typescript
// Mobile utilise exactement les mêmes endpoints
const API_ENDPOINTS = {
  // ✅ Déjà fonctionnels et testés
  register: 'POST /api/v1/auth/register',
  login: 'POST /api/v1/auth/login', 
  verifyOtp: 'POST /api/v1/auth/verify-otp',
  refresh: 'POST /api/v1/auth/refresh',
  profile: 'GET /api/v1/auth/profile',
  
  // 🔄 À développer (Phase 1 Web)
  users: 'GET/PUT /api/v1/users',
  addresses: 'CRUD /api/v1/addresses',
  orders: 'CRUD /api/v1/orders',
  payments: 'POST /api/v1/payments'
};
```

#### **Service API Mobile (Réutilise la logique web)**
```typescript
// apps/mobile-client/src/services/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, User } from '@wali/shared';

class ApiService {
  private baseURL = 'http://localhost:3001/api/v1';
  
  // 🔄 Même logique que le web, adaptée pour React Native
  async authenticatedRequest(endpoint: string, options: RequestInit = {}) {
    const token = await AsyncStorage.getItem('access_token');
    
    return fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }

  // 🔄 Réutilise exactement les mêmes endpoints
  async login(phone: string) {
    return this.authenticatedRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyOtp(phone: string, otp: string) {
    return this.authenticatedRequest('/auth/verify-otp', {
      method: 'POST', 
      body: JSON.stringify({ phone, otp }),
    });
  }
}
```

### **5.2 Gestion des Tokens (Identique au Web)**

#### **Stockage Sécurisé Mobile**
```typescript
// apps/mobile-client/src/services/auth.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse } from '@wali/shared';

export class AuthService {
  // 🔄 Même logique que useAuth web, adaptée pour mobile
  async saveTokens(authResponse: AuthResponse) {
    await AsyncStorage.multiSet([
      ['access_token', authResponse.accessToken],
      ['refresh_token', authResponse.refreshToken],
      ['user_data', JSON.stringify(authResponse.user)],
    ]);
  }

  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem('access_token');
  }

  async refreshToken(): Promise<boolean> {
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    try {
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const { accessToken } = await response.json();
        await AsyncStorage.setItem('access_token', accessToken);
        return true;
      }
    } catch (error) {
      console.error('Refresh token failed:', error);
    }

    return false;
  }
}
```

## 📦 Intégration Packages Partagés

### **5.3 Réutilisation Types TypeScript**

#### **Types Partagés (@wali/shared)**
```typescript
// Les apps mobile utilisent exactement les mêmes types
import { 
  User, 
  UserRole, 
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  VerifyOtpRequest,
  Order,
  Address,
  PaymentMethod 
} from '@wali/shared';

// ✅ Aucune duplication de code
// ✅ Cohérence garantie entre web et mobile
// ✅ Maintenance centralisée
```

#### **Configuration Monorepo Mobile**
```json
// apps/mobile-client/package.json
{
  "dependencies": {
    "@wali/shared": "workspace:*",
    "@wali/database": "workspace:*"
  }
}
```

```typescript
// apps/mobile-client/metro.config.js
const path = require('path');

module.exports = {
  watchFolders: [
    path.resolve(__dirname, '../../packages/shared'),
    path.resolve(__dirname, '../../packages/database'),
  ],
  resolver: {
    alias: {
      '@wali/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
};
```

### **5.4 Validation Partagée (Zod)**

#### **Schémas de Validation Réutilisés**
```typescript
// packages/shared/src/validation/auth.ts (existant)
import { z } from 'zod';

export const phoneSchema = z.string()
  .regex(/^\+225[0-9]{8}$/, 'Format ivoirien requis');

export const registerSchema = z.object({
  phone: phoneSchema,
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email().optional(),
});

// apps/mobile-client/src/components/AuthForm.tsx
import { registerSchema } from '@wali/shared/validation';

const validateForm = (data) => {
  // ✅ Même validation que le web
  return registerSchema.parse(data);
};
```

## 🔄 Synchronisation État et Cache

### **5.5 React Query/TanStack Query (Identique)**

#### **Configuration Cache Mobile**
```typescript
// apps/mobile-client/src/hooks/useAuth.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthService } from '../services/auth';

export const useAuth = () => {
  const queryClient = useQueryClient();
  
  // 🔄 Même patterns que le web
  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: AuthService.getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: AuthService.login,
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'user'], data.user);
    },
  });

  return {
    user,
    isLoading,
    login: loginMutation.mutate,
    isAuthenticated: !!user,
  };
};
```

### **5.6 Offline-First avec React Query**

#### **Stratégie Cache Mobile**
```typescript
// apps/mobile-client/src/config/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client-core';
import AsyncStorage from '@react-native-async-storage/async-storage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ✅ Cache agressif pour mobile
      staleTime: 10 * 60 * 1000, // 10 minutes
      cacheTime: 24 * 60 * 60 * 1000, // 24 heures
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Persistance cache pour offline
persistQueryClient({
  queryClient,
  persister: {
    persistClient: async (client) => {
      await AsyncStorage.setItem('react-query-cache', JSON.stringify(client));
    },
    restoreClient: async () => {
      const cache = await AsyncStorage.getItem('react-query-cache');
      return cache ? JSON.parse(cache) : undefined;
    },
  },
});
```

## 🔐 Sécurité et Authentification

### **5.7 Même Stratégie de Sécurité**

#### **JWT et Refresh Tokens (Identique)**
```typescript
// apps/mobile-client/src/utils/httpClient.ts
import { AuthService } from '../services/auth';

class HttpClient {
  async request(url: string, options: RequestInit = {}) {
    let token = await AuthService.getAccessToken();
    
    let response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    // 🔄 Même logique de refresh que le web
    if (response.status === 401) {
      const refreshed = await AuthService.refreshToken();
      if (refreshed) {
        token = await AuthService.getAccessToken();
        response = await fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${token}`,
            ...options.headers,
          },
        });
      }
    }

    return response;
  }
}
```

## 📱 Spécificités Mobile

### **5.8 Fonctionnalités Mobile Natives**

#### **Géolocalisation**
```typescript
// apps/mobile-client/src/hooks/useLocation.ts
import Geolocation from '@react-native-community/geolocation';
import { useQuery } from '@tanstack/react-query';

export const useLocation = () => {
  return useQuery({
    queryKey: ['location', 'current'],
    queryFn: () => new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
        error => reject(error),
        { enableHighAccuracy: true, timeout: 15000 }
      );
    }),
    staleTime: 30 * 1000, // 30 secondes
  });
};
```

#### **Notifications Push**
```typescript
// apps/mobile-client/src/services/notifications.ts
import messaging from '@react-native-firebase/messaging';

export class NotificationService {
  async initialize() {
    const token = await messaging().getToken();
    
    // 🔄 Envoie le token au backend existant
    await fetch('/api/v1/users/push-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pushToken: token }),
    });
  }

  async handleBackgroundMessage() {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message reçu en arrière-plan:', remoteMessage);
    });
  }
}
```

## 🎯 Avantages de cette Intégration

### **Technique**
- ✅ **Zéro duplication** : Réutilisation complète de l'API
- ✅ **Types partagés** : Cohérence garantie
- ✅ **Validation centralisée** : Même logique partout
- ✅ **Cache unifié** : Patterns identiques

### **Maintenance**
- ✅ **Single source of truth** : Backend unique
- ✅ **Évolutions synchronisées** : Changements propagés automatiquement
- ✅ **Tests partagés** : Validation commune
- ✅ **Documentation centralisée** : Une seule API à documenter

### **Développement**
- ✅ **Courbe d'apprentissage réduite** : Même patterns
- ✅ **Productivité élevée** : Réutilisation maximale
- ✅ **Qualité garantie** : Code déjà testé et validé
- ✅ **Time-to-market optimisé** : Développement accéléré

Cette architecture d'intégration garantit une cohérence parfaite entre toutes les plateformes tout en maximisant la réutilisation du code existant.
