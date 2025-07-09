import { toast } from 'sonner';

// Types pour les réponses API
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  details?: any;
}

// Configuration de l'API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Récupère le token JWT depuis le localStorage
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('wali_auth_token');
  }

  /**
   * Sauvegarde le token JWT dans le localStorage
   */
  private setAuthToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('wali_auth_token', token);
  }

  /**
   * Supprime le token JWT du localStorage
   */
  private removeAuthToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('wali_auth_token');
  }

  /**
   * Prépare les headers pour une requête
   */
  private getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers = { ...this.defaultHeaders, ...customHeaders };
    
    const token = this.getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Gère les erreurs de réponse
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    let data: any;
    try {
      data = isJson ? await response.json() : await response.text();
    } catch (error) {
      throw new Error('Erreur de parsing de la réponse');
    }

    if (!response.ok) {
      // Gestion des erreurs d'authentification
      if (response.status === 401) {
        this.removeAuthToken();
        toast.error('Session expirée, veuillez vous reconnecter');
        
        // Rediriger vers la page de connexion
        if (typeof window !== 'undefined') {
          window.location.href = '/auth';
        }
      }

      // Créer une erreur avec les détails
      const error: ApiError = {
        message: data.message || 'Une erreur est survenue',
        statusCode: response.status,
        error: data.error,
        details: data.details,
      };

      throw error;
    }

    return data;
  }

  /**
   * Effectue une requête HTTP générique
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getHeaders(options.headers as Record<string, string>);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      // Gestion des erreurs réseau
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('Erreur de connexion au serveur');
        throw new Error('Impossible de se connecter au serveur');
      }

      // Re-lancer l'erreur si c'est déjà une ApiError
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error;
      }

      // Erreur générique
      console.error('Erreur API:', error);
      throw new Error('Une erreur inattendue est survenue');
    }
  }

  /**
   * Requête GET
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * Requête POST
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Requête PUT
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Requête DELETE
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Upload de fichier
   */
  async upload<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const headers = this.getHeaders();
    delete headers['Content-Type']; // Laisser le navigateur définir le Content-Type pour FormData

    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers,
    });
  }

  /**
   * Sauvegarde le token d'authentification
   */
  setToken(token: string): void {
    this.setAuthToken(token);
  }

  /**
   * Supprime le token d'authentification
   */
  clearToken(): void {
    this.removeAuthToken();
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

// Instance singleton du client API
export const apiClient = new ApiClient(API_BASE_URL);

// Helper pour gérer les erreurs dans les composants
export const handleApiError = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as ApiError).message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Une erreur inattendue est survenue';
};

// Types pour les endpoints spécifiques
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    isVerified: boolean;
  };
  token: string;
  refreshToken: string;
}
