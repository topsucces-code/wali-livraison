// Types et modèles pour le système de commandes WALI Livraison - Côte d'Ivoire

export enum OrderStatus {
  DRAFT = 'DRAFT', // Brouillon (en cours de création)
  PENDING = 'PENDING', // En attente d'attribution
  ASSIGNED = 'ASSIGNED', // Assignée à un livreur
  ACCEPTED = 'ACCEPTED', // Acceptée par le livreur
  PICKUP_IN_PROGRESS = 'PICKUP_IN_PROGRESS', // Livreur en route vers récupération
  PICKED_UP = 'PICKED_UP', // Colis récupéré
  DELIVERY_IN_PROGRESS = 'DELIVERY_IN_PROGRESS', // En cours de livraison
  DELIVERED = 'DELIVERED', // Livré avec succès
  CANCELLED = 'CANCELLED', // Annulée
  FAILED = 'FAILED', // Échec de livraison
}

export enum OrderPriority {
  STANDARD = 'STANDARD', // Livraison standard (2-4h)
  EXPRESS = 'EXPRESS', // Livraison express (1-2h)
  URGENT = 'URGENT', // Livraison urgente (30min-1h)
}

export enum PaymentMethod {
  CASH = 'CASH', // Paiement à la livraison
  ORANGE_MONEY = 'ORANGE_MONEY', // Orange Money
  MTN_MONEY = 'MTN_MONEY', // MTN Mobile Money
  WAVE = 'WAVE', // Wave
  CARD = 'CARD', // Carte bancaire
}

export enum PaymentStatus {
  PENDING = 'PENDING', // En attente
  PAID = 'PAID', // Payé
  FAILED = 'FAILED', // Échec
  REFUNDED = 'REFUNDED', // Remboursé
}

export enum VehicleType {
  MOTO = 'MOTO',
  SCOOTER = 'SCOOTER',
  VELO = 'VELO',
  VOITURE = 'VOITURE',
  TRICYCLE = 'TRICYCLE',
  CAMIONNETTE = 'CAMIONNETTE',
}

export interface Address {
  id?: string;
  label: string; // "Domicile", "Bureau", etc.
  street: string;
  landmark?: string; // Point de repère
  district: string; // Commune d'Abidjan
  city: string; // Abidjan
  coordinates: {
    lat: number;
    lng: number;
  };
  contactName?: string;
  contactPhone?: string;
  instructions?: string; // Instructions spéciales
}

export interface OrderItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  weight?: number; // en kg
  dimensions?: {
    length: number; // en cm
    width: number;
    height: number;
  };
  value?: number; // Valeur en FCFA pour assurance
  fragile: boolean;
  category: ItemCategory;
}

export enum ItemCategory {
  FOOD = 'FOOD', // Nourriture
  DOCUMENTS = 'DOCUMENTS', // Documents
  ELECTRONICS = 'ELECTRONICS', // Électronique
  CLOTHING = 'CLOTHING', // Vêtements
  PHARMACY = 'PHARMACY', // Pharmacie
  GROCERIES = 'GROCERIES', // Courses
  OTHER = 'OTHER', // Autre
}

export interface PricingDetails {
  basePrice: number; // Prix de base en FCFA
  distancePrice: number; // Prix selon distance
  priorityPrice: number; // Supplément urgence
  vehiclePrice: number; // Supplément type véhicule
  zonePrice: number; // Supplément zone difficile
  totalPrice: number; // Prix total
  currency: 'FCFA';
  breakdown: {
    label: string;
    amount: number;
  }[];
}

export interface Order {
  id: string;
  orderNumber: string; // Numéro de commande (ex: WAL-2024-001234)
  
  // Client
  clientId: string;
  clientName: string;
  clientPhone: string;
  
  // Adresses
  pickupAddress: Address;
  deliveryAddress: Address;
  
  // Articles
  items: OrderItem[];
  totalWeight: number;
  totalValue: number;
  
  // Livraison
  priority: OrderPriority;
  preferredVehicleType?: VehicleType;
  scheduledPickupTime?: string; // ISO date
  estimatedDeliveryTime?: string; // ISO date
  
  // Livreur
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleInfo?: {
    type: VehicleType;
    brand: string;
    model: string;
    registrationNumber: string;
  };
  
  // Statut et suivi
  status: OrderStatus;
  statusHistory: OrderStatusUpdate[];
  
  // Prix et paiement
  pricing: PricingDetails;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  
  // Métadonnées
  notes?: string; // Notes du client
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  
  // Évaluation
  rating?: {
    clientRating?: number; // Note du client (1-5)
    driverRating?: number; // Note du livreur (1-5)
    clientComment?: string;
    driverComment?: string;
  };
}

export interface OrderStatusUpdate {
  id: string;
  orderId: string;
  status: OrderStatus;
  timestamp: string;
  location?: {
    lat: number;
    lng: number;
  };
  notes?: string;
  updatedBy: string; // ID de l'utilisateur
  updatedByRole: 'CLIENT' | 'DRIVER' | 'ADMIN';
}

export interface DeliveryTracking {
  orderId: string;
  driverId: string;
  currentLocation: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  estimatedArrival: string;
  route?: {
    lat: number;
    lng: number;
  }[];
  distance: number; // en km
  duration: number; // en minutes
}

// Zones de livraison d'Abidjan avec tarification
export const ABIDJAN_ZONES = {
  PLATEAU: {
    name: 'Plateau',
    multiplier: 1.0, // Prix normal
    description: 'Centre-ville, facile d\'accès',
  },
  COCODY: {
    name: 'Cocody',
    multiplier: 1.1,
    description: 'Zone résidentielle, quelques embouteillages',
  },
  YOPOUGON: {
    name: 'Yopougon',
    multiplier: 1.2,
    description: 'Zone populaire, circulation dense',
  },
  ADJAME: {
    name: 'Adjamé',
    multiplier: 1.1,
    description: 'Zone commerciale, accès modéré',
  },
  TREICHVILLE: {
    name: 'Treichville',
    multiplier: 1.0,
    description: 'Centre historique, accès facile',
  },
  MARCORY: {
    name: 'Marcory',
    multiplier: 1.1,
    description: 'Zone industrielle et résidentielle',
  },
  KOUMASSI: {
    name: 'Koumassi',
    multiplier: 1.2,
    description: 'Zone périphérique, accès difficile',
  },
  PORT_BOUET: {
    name: 'Port-Bouët',
    multiplier: 1.3,
    description: 'Zone aéroportuaire, distance importante',
  },
  BINGERVILLE: {
    name: 'Bingerville',
    multiplier: 1.4,
    description: 'Périphérie, accès très difficile',
  },
  SONGON: {
    name: 'Songon',
    multiplier: 1.5,
    description: 'Zone éloignée, routes difficiles',
  },
};

// Tarification selon le type de véhicule
export const VEHICLE_PRICING = {
  [VehicleType.VELO]: {
    basePrice: 500, // FCFA
    pricePerKm: 100,
    maxWeight: 5, // kg
    maxDistance: 10, // km
    description: 'Idéal pour petits colis légers',
  },
  [VehicleType.MOTO]: {
    basePrice: 1000,
    pricePerKm: 150,
    maxWeight: 15,
    maxDistance: 30,
    description: 'Livraison rapide en ville',
  },
  [VehicleType.SCOOTER]: {
    basePrice: 800,
    pricePerKm: 120,
    maxWeight: 10,
    maxDistance: 20,
    description: 'Parfait pour courtes distances',
  },
  [VehicleType.VOITURE]: {
    basePrice: 2000,
    pricePerKm: 200,
    maxWeight: 50,
    maxDistance: 100,
    description: 'Pour gros colis et longues distances',
  },
  [VehicleType.TRICYCLE]: {
    basePrice: 1500,
    pricePerKm: 180,
    maxWeight: 100,
    maxDistance: 50,
    description: 'Grande capacité de charge',
  },
  [VehicleType.CAMIONNETTE]: {
    basePrice: 3000,
    pricePerKm: 300,
    maxWeight: 500,
    maxDistance: 200,
    description: 'Pour livraisons volumineuses',
  },
};

// Tarification selon la priorité
export const PRIORITY_PRICING = {
  [OrderPriority.STANDARD]: {
    multiplier: 1.0,
    estimatedTime: '2-4 heures',
    description: 'Livraison dans la journée',
  },
  [OrderPriority.EXPRESS]: {
    multiplier: 1.5,
    estimatedTime: '1-2 heures',
    description: 'Livraison rapide',
  },
  [OrderPriority.URGENT]: {
    multiplier: 2.0,
    estimatedTime: '30min-1 heure',
    description: 'Livraison immédiate',
  },
};

// Utilitaires de validation et calcul
export const calculateDistance = (from: Address, to: Address): number => {
  // Formule de Haversine pour calculer la distance
  const R = 6371; // Rayon de la Terre en km
  const dLat = (to.coordinates.lat - from.coordinates.lat) * Math.PI / 180;
  const dLon = (to.coordinates.lng - from.coordinates.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(from.coordinates.lat * Math.PI / 180) * Math.cos(to.coordinates.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const calculateOrderPrice = (
  distance: number,
  vehicleType: VehicleType,
  priority: OrderPriority,
  pickupZone: string,
  deliveryZone: string
): PricingDetails => {
  const vehiclePricing = VEHICLE_PRICING[vehicleType];
  const priorityPricing = PRIORITY_PRICING[priority];
  const pickupMultiplier = ABIDJAN_ZONES[pickupZone as keyof typeof ABIDJAN_ZONES]?.multiplier || 1.0;
  const deliveryMultiplier = ABIDJAN_ZONES[deliveryZone as keyof typeof ABIDJAN_ZONES]?.multiplier || 1.0;
  
  const basePrice = vehiclePricing.basePrice;
  const distancePrice = distance * vehiclePricing.pricePerKm;
  const priorityPrice = (basePrice + distancePrice) * (priorityPricing.multiplier - 1);
  const zonePrice = (basePrice + distancePrice) * Math.max(pickupMultiplier, deliveryMultiplier) - (basePrice + distancePrice);
  
  const totalPrice = Math.round(basePrice + distancePrice + priorityPrice + zonePrice);
  
  return {
    basePrice,
    distancePrice: Math.round(distancePrice),
    priorityPrice: Math.round(priorityPrice),
    vehiclePrice: 0, // Inclus dans basePrice
    zonePrice: Math.round(zonePrice),
    totalPrice,
    currency: 'FCFA',
    breakdown: [
      { label: 'Prix de base', amount: basePrice },
      { label: `Distance (${distance.toFixed(1)} km)`, amount: Math.round(distancePrice) },
      { label: `Priorité ${priority}`, amount: Math.round(priorityPrice) },
      { label: 'Supplément zone', amount: Math.round(zonePrice) },
    ].filter(item => item.amount > 0),
  };
};

export const getOrderStatusLabel = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.DRAFT: return 'Brouillon';
    case OrderStatus.PENDING: return 'En attente';
    case OrderStatus.ASSIGNED: return 'Assignée';
    case OrderStatus.ACCEPTED: return 'Acceptée';
    case OrderStatus.PICKUP_IN_PROGRESS: return 'Récupération en cours';
    case OrderStatus.PICKED_UP: return 'Récupéré';
    case OrderStatus.DELIVERY_IN_PROGRESS: return 'Livraison en cours';
    case OrderStatus.DELIVERED: return 'Livré';
    case OrderStatus.CANCELLED: return 'Annulée';
    case OrderStatus.FAILED: return 'Échec';
    default: return 'Inconnu';
  }
};

export const getOrderStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.DRAFT: return 'bg-gray-100 text-gray-800';
    case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
    case OrderStatus.ASSIGNED: return 'bg-blue-100 text-blue-800';
    case OrderStatus.ACCEPTED: return 'bg-green-100 text-green-800';
    case OrderStatus.PICKUP_IN_PROGRESS: return 'bg-orange-100 text-orange-800';
    case OrderStatus.PICKED_UP: return 'bg-purple-100 text-purple-800';
    case OrderStatus.DELIVERY_IN_PROGRESS: return 'bg-indigo-100 text-indigo-800';
    case OrderStatus.DELIVERED: return 'bg-green-100 text-green-800';
    case OrderStatus.CANCELLED: return 'bg-red-100 text-red-800';
    case OrderStatus.FAILED: return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const generateOrderNumber = (): string => {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  return `WAL-${year}-${timestamp}`;
};
