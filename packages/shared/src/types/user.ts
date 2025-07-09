export interface User {
  id: string;
  phone: string;
  email?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  CLIENT = 'CLIENT',
  DRIVER = 'DRIVER',
  PARTNER = 'PARTNER',
  ADMIN = 'ADMIN'
}

// Types d'authentification
export interface AuthResponse {
  user: Omit<User, 'createdAt' | 'updatedAt'>;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  phone: string;
  email?: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface LoginRequest {
  phone: string;
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
}

// Types pour la gestion des utilisateurs
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
}

export interface UserStats {
  totalOrders: number;
  completedOrders: number;
  totalSpent: number;
  averageRating: number;
}

export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  isVerified: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface DriverProfile {
  id: string;
  userId: string;
  licenseNumber: string;
  vehicleType: VehicleType;
  vehiclePlate: string;
  isOnline: boolean;
  isAvailable: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
  documentsVerified: boolean;
  rating: number;
  totalEarnings: number;
}

export enum VehicleType {
  MOTO = 'MOTO',
  CAR = 'CAR',
  TRUCK = 'TRUCK',
  BICYCLE = 'BICYCLE'
}

export interface PartnerProfile {
  id: string;
  userId: string;
  businessName: string;
  businessType: BusinessType;
  description?: string;
  logo?: string;
  isVerified: boolean;
  isActive: boolean;
  rating: number;
}

export enum BusinessType {
  RESTAURANT = 'RESTAURANT',
  STORE = 'STORE',
  PHARMACY = 'PHARMACY',
  SUPERMARKET = 'SUPERMARKET'
}
