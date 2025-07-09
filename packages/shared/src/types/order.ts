export interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  driverId?: string;
  type: OrderType;
  status: OrderStatus;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  basePrice: number;
  deliveryFee: number;
  totalAmount: number;
  estimatedDuration?: number;
  scheduledAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  notes?: string;
  proofOfDelivery?: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations optionnelles
  items?: OrderItem[];
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  trackingEvents?: TrackingEvent[];
}

export enum OrderType {
  DELIVERY = 'DELIVERY',
  FOOD = 'FOOD',
  SHOPPING = 'SHOPPING'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED'
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface TrackingEvent {
  id: string;
  orderId: string;
  status: OrderStatus;
  latitude?: number;
  longitude?: number;
  description?: string;
  createdAt: Date;
}

export interface CreateOrderRequest {
  type: OrderType;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  notes?: string;
  scheduledAt?: Date;
  items: CreateOrderItemRequest[];
}

export interface CreateOrderItemRequest {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
}

export interface UpdateOrderRequest {
  status?: OrderStatus;
  driverId?: string;
  notes?: string;
  scheduledAt?: Date;
  proofOfDelivery?: string;
}

export interface PriceCalculationRequest {
  type: OrderType;
  pickupLatitude: number;
  pickupLongitude: number;
  deliveryLatitude: number;
  deliveryLongitude: number;
  items?: CreateOrderItemRequest[];
}

export interface PriceCalculationResult {
  distance: number; // en kilomètres
  estimatedDuration: number; // en minutes
  basePrice: number;
  deliveryFee: number;
  totalAmount: number;
  breakdown: {
    distanceFee: number;
    timeFee: number;
    typeFee: number;
    itemsFee: number;
  };
}

// Constantes pour la tarification en Côte d'Ivoire
export const PRICING_CONFIG = {
  // Prix de base par type de commande (en FCFA)
  BASE_PRICES: {
    [OrderType.DELIVERY]: 1000,   // 1000 FCFA pour livraison simple
    [OrderType.FOOD]: 1500,       // 1500 FCFA pour nourriture
    [OrderType.SHOPPING]: 2000,   // 2000 FCFA pour courses
  },

  // Prix par kilomètre (en FCFA)
  PRICE_PER_KM: 200,

  // Prix par minute d'attente (en FCFA)
  PRICE_PER_MINUTE: 50,

  // Distance minimum gratuite (en km)
  FREE_DISTANCE: 2,

  // Frais supplémentaires
  NIGHT_SURCHARGE: 0.5,    // 50% de plus entre 22h et 6h
  WEEKEND_SURCHARGE: 0.3,  // 30% de plus le weekend
  RAIN_SURCHARGE: 0.2,     // 20% de plus en cas de pluie

  // Limites
  MIN_ORDER_AMOUNT: 500,   // Montant minimum de commande
  MAX_DISTANCE: 50,        // Distance maximum en km
} as const;

// Messages de statut en français
export const ORDER_STATUS_MESSAGES = {
  [OrderStatus.PENDING]: 'Commande en attente de confirmation',
  [OrderStatus.CONFIRMED]: 'Commande confirmée, recherche d\'un livreur',
  [OrderStatus.ASSIGNED]: 'Livreur assigné, préparation en cours',
  [OrderStatus.PICKED_UP]: 'Commande récupérée, en route vers vous',
  [OrderStatus.IN_TRANSIT]: 'Commande en transit',
  [OrderStatus.DELIVERED]: 'Commande livrée avec succès',
  [OrderStatus.CANCELLED]: 'Commande annulée',
  [OrderStatus.FAILED]: 'Échec de la livraison',
} as const;

// Types de commande en français
export const ORDER_TYPE_LABELS = {
  [OrderType.DELIVERY]: 'Livraison Express',
  [OrderType.FOOD]: 'Livraison de Repas',
  [OrderType.SHOPPING]: 'Courses et Achats',
} as const;

export interface TrackingEvent {
  id: string;
  orderId: string;
  status: OrderStatus;
  latitude?: number;
  longitude?: number;
  description?: string;
  createdAt: Date;
}
