import { 
  User, 
  AuthTokens, 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  AuthError,
  JWT_CONFIG,
  secureStorage,
  isTokenExpired 
} from '@/lib/auth';

class AuthService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  private isOnline = true;

  // Simulation de données pour le mode hors ligne
  private mockUsers: User[] = [
    {
      id: '1',
      email: 'client@wali.ci',
      phone: '+22507123456',
      firstName: 'Kouame',
      lastName: 'Yao',
      role: 'CLIENT',
      isVerified: true,
      addresses: [
        {
          id: '1',
          label: 'Domicile',
          street: 'Rue des Jardins',
          city: 'Abidjan',
          district: 'Plateau',
          coordinates: { lat: 5.3364, lng: -4.0267 },
          isDefault: true,
        }
      ],
      preferences: {
        language: 'fr',
        notifications: { email: true, sms: true, push: true },
        paymentMethod: 'orange_money',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      email: 'livreur@wali.ci',
      phone: '+22501987654',
      firstName: 'Mamadou',
      lastName: 'Traore',
      role: 'DRIVER',
      isVerified: true,
      addresses: [],
      preferences: {
        language: 'fr',
        notifications: { email: true, sms: true, push: true },
        paymentMethod: 'mtn_money',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  // Connexion
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Tentative d'appel API réel
      if (this.isOnline) {
        const response = await fetch(`${this.baseUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        });

        if (response.ok) {
          const data = await response.json();
          this.storeTokens(data.tokens);
          this.storeUser(data.user);
          return data;
        }
      }
    } catch (error) {
      console.log('Backend indisponible, utilisation du mode hors ligne');
    }

    // Mode hors ligne - simulation
    return this.simulateLogin(credentials);
  }

  // Inscription
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Tentative d'appel API réel
      if (this.isOnline) {
        const response = await fetch(`${this.baseUrl}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const result = await response.json();
          this.storeTokens(result.tokens);
          this.storeUser(result.user);
          return result;
        }
      }
    } catch (error) {
      console.log('Backend indisponible, utilisation du mode hors ligne');
    }

    // Mode hors ligne - simulation
    return this.simulateRegister(data);
  }

  // Déconnexion
  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      if (refreshToken && this.isOnline) {
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.log('Erreur lors de la déconnexion:', error);
    } finally {
      this.clearTokens();
    }
  }

  // Rafraîchissement du token
  async refreshToken(): Promise<AuthTokens | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      if (this.isOnline) {
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (response.ok) {
          const tokens = await response.json();
          this.storeTokens(tokens);
          return tokens;
        }
      }
    } catch (error) {
      console.log('Erreur de rafraîchissement:', error);
    }

    // Mode hors ligne - générer de nouveaux tokens simulés
    return this.simulateRefreshToken();
  }

  // Vérification de l'authentification
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return token !== null && !isTokenExpired(token);
  }

  // Obtenir l'utilisateur actuel
  getCurrentUser(): User | null {
    const userStr = secureStorage.getItem(JWT_CONFIG.STORAGE_KEYS.USER);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  // Mise à jour du profil
  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      if (this.isOnline) {
        const response = await fetch(`${this.baseUrl}/auth/profile`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
          body: JSON.stringify(updates),
        });

        if (response.ok) {
          const user = await response.json();
          this.storeUser(user);
          return user;
        }
      }
    } catch (error) {
      console.log('Erreur de mise à jour:', error);
    }

    // Mode hors ligne - simulation
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      this.storeUser(updatedUser);
      return updatedUser;
    }

    throw new Error('Utilisateur non trouvé');
  }

  // Méthodes privées
  private storeTokens(tokens: AuthTokens): void {
    secureStorage.setItem(JWT_CONFIG.STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    secureStorage.setItem(JWT_CONFIG.STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
  }

  private storeUser(user: User): void {
    secureStorage.setItem(JWT_CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
  }

  private getAccessToken(): string | null {
    return secureStorage.getItem(JWT_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  }

  private getRefreshToken(): string | null {
    return secureStorage.getItem(JWT_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
  }

  private clearTokens(): void {
    secureStorage.clear();
  }

  // Simulations pour le mode hors ligne
  private async simulateLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation délai réseau

    const user = this.mockUsers.find(u => 
      u.email === credentials.email || u.phone === credentials.phone
    );

    if (!user || credentials.password !== 'password123') {
      throw new Error('Identifiants incorrects');
    }

    const tokens = this.generateMockTokens(user);
    
    return {
      user,
      tokens,
      message: 'Connexion réussie (mode hors ligne)',
    };
  }

  private async simulateRegister(data: RegisterData): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulation délai réseau

    // Vérifier si l'utilisateur existe déjà
    const existingUser = this.mockUsers.find(u => 
      u.email === data.email || u.phone === data.phone
    );

    if (existingUser) {
      throw new Error('Un compte existe déjà avec cet email ou numéro de téléphone');
    }

    const newUser: User = {
      id: Date.now().toString(),
      email: data.email,
      phone: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      isVerified: false,
      addresses: [],
      preferences: {
        language: 'fr',
        notifications: { email: true, sms: true, push: true },
        paymentMethod: 'cash',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.mockUsers.push(newUser);
    const tokens = this.generateMockTokens(newUser);

    return {
      user: newUser,
      tokens,
      message: 'Inscription réussie (mode hors ligne)',
    };
  }

  private simulateRefreshToken(): AuthTokens {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Utilisateur non trouvé');
    
    return this.generateMockTokens(user);
  }

  private generateMockTokens(user: User): AuthTokens {
    const now = Date.now();
    const accessToken = btoa(JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor((now + JWT_CONFIG.ACCESS_TOKEN_EXPIRY) / 1000),
    }));
    
    const refreshToken = btoa(JSON.stringify({
      sub: user.id,
      type: 'refresh',
      exp: Math.floor((now + JWT_CONFIG.REFRESH_TOKEN_EXPIRY) / 1000),
    }));

    return {
      accessToken: `mock.${accessToken}.signature`,
      refreshToken: `mock.${refreshToken}.signature`,
      expiresAt: now + JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
    };
  }
}

export const authService = new AuthService();
