# 🔧 Plan Technique Détaillé - Applications Mobiles

## 📋 Étape 1 : Préparation et Nettoyage

### **1.1 Réorganisation des Dossiers**
```bash
# Déplacer les apps mobile vers le dossier principal
mv apps-mobile-temp/mobile-client apps/
mv apps-mobile-temp/mobile-driver apps/

# Supprimer le dossier temporaire
rm -rf apps-mobile-temp/
```

### **1.2 Mise à Jour package.json Racine**
```json
{
  "workspaces": [
    "apps/api",
    "apps/client-web",
    "apps/admin-panel",
    "apps/mobile-client",
    "apps/mobile-driver",
    "packages/database",
    "packages/shared",
    "packages/ui"
  ]
}
```

### **1.3 Installation des Dépendances**
```bash
# Installation avec résolution des conflits
cd apps/mobile-client
npm install --legacy-peer-deps

cd ../mobile-driver  
npm install --legacy-peer-deps
```

## 📱 Étape 2 : Création de la Structure de Dossiers

### **2.1 Structure Mobile Client**
```
apps/mobile-client/src/
├── components/
│   ├── auth/
│   ├── common/
│   ├── forms/
│   └── ui/
├── screens/
│   ├── auth/
│   ├── home/
│   ├── orders/
│   ├── profile/
│   └── tracking/
├── navigation/
│   ├── AppNavigator.tsx
│   ├── AuthNavigator.tsx
│   └── MainNavigator.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useOrders.ts
│   └── useLocation.ts
├── services/
│   ├── api.ts
│   ├── auth.ts
│   └── location.ts
├── types/
│   └── navigation.ts
├── utils/
│   ├── constants.ts
│   ├── helpers.ts
│   └── validation.ts
└── App.tsx
```

### **2.2 Structure Mobile Driver**
```
apps/mobile-driver/src/
├── components/
│   ├── auth/
│   ├── delivery/
│   ├── earnings/
│   └── ui/
├── screens/
│   ├── auth/
│   ├── dashboard/
│   ├── delivery/
│   ├── earnings/
│   └── profile/
├── navigation/
├── hooks/
├── services/
├── types/
├── utils/
└── App.tsx
```

## 🔧 Étape 3 : Correction des Erreurs TypeScript

### **3.1 Mise à Jour App.tsx**
```typescript
// apps/mobile-client/src/App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import AppNavigator from './navigation/AppNavigator';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
        <Toast />
      </PaperProvider>
    </QueryClientProvider>
  );
}
```

### **3.2 Configuration Navigation Moderne**
```typescript
// apps/mobile-client/src/navigation/AppNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { useAuth } from '../hooks/useAuth';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
```

### **3.3 Correction des Options de Navigation**
```typescript
// Remplacer headerBackTitleVisible par headerBackTitle
options={{
  title: 'Créer une commande',
  headerBackTitle: '', // Au lieu de headerBackTitleVisible: false
}}
```

## 📱 Étape 4 : Création des Écrans Manquants

### **4.1 Écran d'Authentification**
```typescript
// apps/mobile-client/src/screens/auth/AuthScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';

export default function AuthScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const { login, verifyOtp, isLoading } = useAuth();

  const handlePhoneSubmit = async () => {
    try {
      await login({ phone });
      setStep('otp');
    } catch (error) {
      console.error('Erreur connexion:', error);
    }
  };

  const handleOtpSubmit = async () => {
    try {
      await verifyOtp({ phone, otp });
    } catch (error) {
      console.error('Erreur vérification:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        WALI Livraison
      </Text>
      
      {step === 'phone' ? (
        <>
          <TextInput
            label="Numéro de téléphone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={styles.input}
          />
          <Button 
            mode="contained" 
            onPress={handlePhoneSubmit}
            loading={isLoading}
            style={styles.button}
          >
            Continuer
          </Button>
        </>
      ) : (
        <>
          <TextInput
            label="Code de vérification"
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            maxLength={6}
            style={styles.input}
          />
          <Button 
            mode="contained" 
            onPress={handleOtpSubmit}
            loading={isLoading}
            style={styles.button}
          >
            Vérifier
          </Button>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    marginBottom: 20,
  },
  button: {
    marginTop: 10,
  },
});
```

### **4.2 Hook d'Authentification Mobile**
```typescript
// apps/mobile-client/src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, LoginRequest, VerifyOtpRequest } from '@wali/shared';

const API_BASE_URL = 'http://localhost:3001/api/v1';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const userData = await AsyncStorage.getItem('user_data');
      
      if (token && userData) {
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Erreur chargement tokens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Erreur connexion');
      
      return await response.json();
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (data: VerifyOtpRequest) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Code invalide');
      
      const authResponse: AuthResponse = await response.json();
      
      await AsyncStorage.setItem('access_token', authResponse.accessToken);
      await AsyncStorage.setItem('refresh_token', authResponse.refreshToken);
      await AsyncStorage.setItem('user_data', JSON.stringify(authResponse.user));
      
      setIsAuthenticated(true);
      setUser(authResponse.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user_data']);
    setIsAuthenticated(false);
    setUser(null);
  };

  return {
    isAuthenticated,
    user,
    isLoading,
    login,
    verifyOtp,
    logout,
  };
};
```

## 🔧 Étape 5 : Configuration Avancée

### **5.1 Configuration Metro (React Native)**
```javascript
// apps/mobile-client/metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
```

### **5.2 Configuration TypeScript**
```json
// apps/mobile-client/tsconfig.json
{
  "extends": "@tsconfig/react-native/tsconfig.json",
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@wali/shared": ["../../packages/shared/src"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.spec.ts", "**/*.test.ts"]
}
```

## 📱 Étape 6 : Tests et Validation

### **6.1 Tests Unitaires**
```typescript
// apps/mobile-client/src/hooks/__tests__/useAuth.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from '../useAuth';

describe('useAuth', () => {
  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle login successfully', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login({ phone: '+2250701234567' });
    });
    
    expect(result.current.isLoading).toBe(false);
  });
});
```

### **6.2 Tests d'Intégration**
```typescript
// apps/mobile-client/e2e/auth.e2e.ts
describe('Authentication Flow', () => {
  it('should complete full auth flow', async () => {
    await element(by.id('phone-input')).typeText('+2250701234567');
    await element(by.id('continue-button')).tap();
    
    await element(by.id('otp-input')).typeText('123456');
    await element(by.id('verify-button')).tap();
    
    await expect(element(by.id('dashboard'))).toBeVisible();
  });
});
```

## 🚀 Étape 7 : Déploiement et Distribution

### **7.1 Configuration Android**
```gradle
// apps/mobile-client/android/app/build.gradle
android {
    compileSdkVersion 34
    buildToolsVersion "34.0.0"
    
    defaultConfig {
        applicationId "ci.wali.livraison.client"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
}
```

### **7.2 Configuration iOS**
```xml
<!-- apps/mobile-client/ios/MobileClient/Info.plist -->
<key>CFBundleDisplayName</key>
<string>WALI Livraison</string>
<key>CFBundleIdentifier</key>
<string>ci.wali.livraison.client</string>
```

## 📊 Résumé des Corrections Nécessaires

### **Corrections Critiques (Bloquantes)**
1. ❌ **Création des 8 fichiers screens manquants**
2. ❌ **Structure de dossiers complète**
3. ❌ **Hook useAuth mobile**
4. ❌ **Configuration navigation moderne**

### **Corrections Importantes (Non-bloquantes)**
1. ⚠️ **Propriétés navigation obsolètes**
2. ⚠️ **Configuration Metro pour monorepo**
3. ⚠️ **Tests unitaires et e2e**
4. ⚠️ **Configuration déploiement**

### **Estimation Effort**
- **Corrections critiques** : 3-4 jours développeur senior
- **Corrections importantes** : 2-3 jours développeur senior
- **Tests et validation** : 2-3 jours QA
- **Total** : 7-10 jours pour une app mobile complète

Cette approche technique garantit une résolution systématique et complète de tous les problèmes identifiés dans les applications React Native.
