// Types pour la gestion des adresses
export interface Address {
  id: string;
  userId?: string;
  restaurantId?: string;
  storeId?: string;
  label?: string;
  street: string;
  city: string;
  district?: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  createdAt: Date;
}

export interface CreateAddressRequest {
  label?: string;
  street: string;
  city: string;
  district?: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
}

export interface UpdateAddressRequest {
  label?: string;
  street?: string;
  city?: string;
  district?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface AddressSearchRequest {
  query: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // en kilomètres
}

export interface AddressSearchResult {
  id: string;
  displayName: string;
  street: string;
  city: string;
  district?: string;
  latitude: number;
  longitude: number;
  distance?: number; // en kilomètres
}

export interface GeocodeRequest {
  address: string;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  city: string;
  district?: string;
  confidence: number; // 0-1
}

export interface ReverseGeocodeRequest {
  latitude: number;
  longitude: number;
}

export interface ReverseGeocodeResult {
  street: string;
  city: string;
  district?: string;
  formattedAddress: string;
}

// Constantes pour la Côte d'Ivoire
export const IVORY_COAST_CITIES = [
  'Abidjan',
  'Bouaké',
  'Daloa',
  'Yamoussoukro',
  'San-Pédro',
  'Korhogo',
  'Man',
  'Divo',
  'Gagnoa',
  'Anyama',
  'Abengourou',
  'Agboville',
  'Grand-Bassam',
  'Dabou',
  'Grand-Lahou',
  'Issia',
  'Sinfra',
  'Soubré',
  'Adzopé',
  'Bongouanou'
] as const;

export const ABIDJAN_DISTRICTS = [
  'Abobo',
  'Adjamé',
  'Attécoubé',
  'Cocody',
  'Koumassi',
  'Marcory',
  'Plateau',
  'Port-Bouët',
  'Treichville',
  'Yopougon',
  'Bingerville',
  'Songon',
  'Anyama'
] as const;

export type IvoryCoastCity = typeof IVORY_COAST_CITIES[number];
export type AbidjanDistrict = typeof ABIDJAN_DISTRICTS[number];
