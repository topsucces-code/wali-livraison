// Constantes pour WALI Livraison

export const APP_CONFIG = {
  NAME: 'WALI Livraison',
  VERSION: '1.0.0',
  DESCRIPTION: 'Plateforme de livraison multi-services en Côte d\'Ivoire'
};

export const API_ENDPOINTS = {
  AUTH: '/auth',
  USERS: '/users',
  ORDERS: '/orders',
  DRIVERS: '/drivers',
  PAYMENTS: '/payments',
  RESTAURANTS: '/restaurants',
  STORES: '/stores',
  PRODUCTS: '/products'
};

export const PAYMENT_METHODS = {
  CASH: 'Espèces',
  STRIPE: 'Carte bancaire',
  ORANGE_MONEY: 'Orange Money',
  MTN_MONEY: 'MTN Mobile Money',
  WAVE: 'Wave'
};

export const ORDER_STATUSES = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  ASSIGNED: 'Assignée',
  PICKED_UP: 'Récupérée',
  IN_TRANSIT: 'En transit',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  FAILED: 'Échec'
};

export const VEHICLE_TYPES = {
  MOTO: 'Moto',
  CAR: 'Voiture',
  TRUCK: 'Camion',
  BICYCLE: 'Vélo'
};

export const BUSINESS_TYPES = {
  RESTAURANT: 'Restaurant',
  STORE: 'Magasin',
  PHARMACY: 'Pharmacie',
  SUPERMARKET: 'Supermarché'
};

export const DEFAULT_COORDINATES = {
  ABIDJAN: {
    latitude: 5.3600,
    longitude: -4.0083
  }
};

export const PRICING = {
  BASE_DELIVERY_PRICE: 1000, // FCFA
  PRICE_PER_KM: 200, // FCFA
  COMMISSION_RATE: 0.15 // 15%
};
