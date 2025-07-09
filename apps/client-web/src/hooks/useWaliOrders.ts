import { useState, useEffect, useCallback } from 'react';
import { 
  Order, 
  OrderStatus, 
  OrderPriority, 
  PaymentMethod,
  VehicleType,
  Address,
  OrderItem,
  PricingDetails,
  DeliveryTracking
} from '@/lib/orders';
import { orderService } from '@/services/order.service';
import { useWaliAuth } from './useWaliAuth';

interface CreateOrderData {
  pickupAddress: Address;
  deliveryAddress: Address;
  items: OrderItem[];
  priority: OrderPriority;
  preferredVehicleType?: VehicleType;
  paymentMethod: PaymentMethod;
  notes?: string;
  specialInstructions?: string;
  scheduledPickupTime?: string;
}

interface UseWaliOrdersReturn {
  // État
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  pricing: PricingDetails | null;
  tracking: DeliveryTracking | null;

  // Actions
  createOrder: (orderData: CreateOrderData) => Promise<Order>;
  getOrders: () => Promise<void>;
  getOrderById: (orderId: string) => Promise<void>;
  acceptOrder: (orderId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus, location?: { lat: number; lng: number }, notes?: string) => Promise<void>;
  cancelOrder: (orderId: string, reason: string) => Promise<void>;
  calculatePrice: (pickup: Address, delivery: Address, vehicleType: VehicleType, priority: OrderPriority) => Promise<void>;
  getTracking: (orderId: string) => Promise<void>;
  clearError: () => void;
  clearCurrentOrder: () => void;

  // Utilitaires
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getActiveOrders: () => Order[];
  getCompletedOrders: () => Order[];
}

export const useWaliOrders = (): UseWaliOrdersReturn => {
  const { user, isClient, isDriver } = useWaliAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pricing, setPricing] = useState<PricingDetails | null>(null);
  const [tracking, setTracking] = useState<DeliveryTracking | null>(null);

  // Charger les commandes au montage
  useEffect(() => {
    if (user?.id) {
      getOrders();
    }
  }, [user?.id]);

  // Créer une nouvelle commande
  const createOrder = useCallback(async (orderData: CreateOrderData): Promise<Order> => {
    if (!user?.id) {
      throw new Error('Utilisateur non connecté');
    }

    setIsLoading(true);
    setError(null);

    try {
      const newOrder = await orderService.createOrder(orderData, user.id);
      setOrders(prev => [newOrder, ...prev]);
      setCurrentOrder(newOrder);
      return newOrder;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la création de la commande';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Obtenir les commandes
  const getOrders = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      let userOrders: Order[] = [];
      
      if (isClient) {
        userOrders = await orderService.getClientOrders(user.id);
      } else if (isDriver) {
        userOrders = await orderService.getDriverOrders(user.id);
      }
      
      setOrders(userOrders);
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du chargement des commandes';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isClient, isDriver]);

  // Obtenir une commande par ID
  const getOrderById = useCallback(async (orderId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const order = await orderService.getOrderById(orderId);
      if (order) {
        setCurrentOrder(order);
        
        // Mettre à jour dans la liste si elle existe
        setOrders(prev => prev.map(o => o.id === orderId ? order : o));
      } else {
        setError('Commande non trouvée');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du chargement de la commande';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Accepter une commande (livreur)
  const acceptOrder = useCallback(async (orderId: string) => {
    if (!user?.id || !isDriver) {
      throw new Error('Action non autorisée');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedOrder = await orderService.acceptOrder(orderId, user.id);
      
      // Mettre à jour la liste des commandes
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
      
      if (currentOrder?.id === orderId) {
        setCurrentOrder(updatedOrder);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'acceptation de la commande';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isDriver, currentOrder?.id]);

  // Mettre à jour le statut d'une commande
  const updateOrderStatus = useCallback(async (
    orderId: string, 
    status: OrderStatus, 
    location?: { lat: number; lng: number },
    notes?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedOrder = await orderService.updateOrderStatus(orderId, status, location, notes);
      
      // Mettre à jour la liste des commandes
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
      
      if (currentOrder?.id === orderId) {
        setCurrentOrder(updatedOrder);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la mise à jour du statut';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentOrder?.id]);

  // Annuler une commande
  const cancelOrder = useCallback(async (orderId: string, reason: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedOrder = await orderService.cancelOrder(orderId, reason);
      
      // Mettre à jour la liste des commandes
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
      
      if (currentOrder?.id === orderId) {
        setCurrentOrder(updatedOrder);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'annulation de la commande';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentOrder?.id]);

  // Calculer le prix d'une commande
  const calculatePrice = useCallback(async (
    pickup: Address,
    delivery: Address,
    vehicleType: VehicleType,
    priority: OrderPriority
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const pricingDetails = await orderService.calculatePrice(pickup, delivery, vehicleType, priority);
      setPricing(pricingDetails);
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du calcul du prix';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Obtenir le suivi en temps réel
  const getTracking = useCallback(async (orderId: string) => {
    setError(null);

    try {
      const trackingData = await orderService.getOrderTracking(orderId);
      setTracking(trackingData);
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du chargement du suivi';
      setError(errorMessage);
    }
  }, []);

  // Effacer l'erreur
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Effacer la commande actuelle
  const clearCurrentOrder = useCallback(() => {
    setCurrentOrder(null);
    setTracking(null);
  }, []);

  // Utilitaires pour filtrer les commandes
  const getOrdersByStatus = useCallback((status: OrderStatus): Order[] => {
    return orders.filter(order => order.status === status);
  }, [orders]);

  const getActiveOrders = useCallback((): Order[] => {
    const activeStatuses = [
      OrderStatus.PENDING,
      OrderStatus.ASSIGNED,
      OrderStatus.ACCEPTED,
      OrderStatus.PICKUP_IN_PROGRESS,
      OrderStatus.PICKED_UP,
      OrderStatus.DELIVERY_IN_PROGRESS,
    ];
    return orders.filter(order => activeStatuses.includes(order.status));
  }, [orders]);

  const getCompletedOrders = useCallback((): Order[] => {
    const completedStatuses = [
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
      OrderStatus.FAILED,
    ];
    return orders.filter(order => completedStatuses.includes(order.status));
  }, [orders]);

  return {
    // État
    orders,
    currentOrder,
    isLoading,
    error,
    pricing,
    tracking,

    // Actions
    createOrder,
    getOrders,
    getOrderById,
    acceptOrder,
    updateOrderStatus,
    cancelOrder,
    calculatePrice,
    getTracking,
    clearError,
    clearCurrentOrder,

    // Utilitaires
    getOrdersByStatus,
    getActiveOrders,
    getCompletedOrders,
  };
};

// Hook spécialisé pour les livreurs
export const useDriverOrders = () => {
  const { user, isDriver } = useWaliAuth();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtenir les commandes disponibles
  const getAvailableOrders = useCallback(async (vehicleType: VehicleType) => {
    if (!user?.id || !isDriver) return;

    setIsLoading(true);
    setError(null);

    try {
      const orders = await orderService.getAvailableOrders(user.id, vehicleType);
      setAvailableOrders(orders);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des commandes disponibles');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isDriver]);

  return {
    availableOrders,
    isLoading,
    error,
    getAvailableOrders,
    clearError: () => setError(null),
  };
};
