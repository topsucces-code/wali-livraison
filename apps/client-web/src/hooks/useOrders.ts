'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { apiClient, handleApiError } from '@/lib/api-client';
import { 
  Order, 
  OrderType, 
  OrderStatus, 
  CreateOrderRequest, 
  PriceCalculationRequest, 
  PriceCalculationResult 
} from '@wali/shared';

interface UseOrdersReturn {
  // État
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  calculatePrice: (request: PriceCalculationRequest) => Promise<PriceCalculationResult>;
  createOrder: (request: CreateOrderRequest) => Promise<Order>;
  getUserOrders: (page?: number, limit?: number) => Promise<void>;
  getOrderById: (orderId: string) => Promise<Order>;
  updateOrder: (orderId: string, updates: Partial<Order>) => Promise<Order>;
  cancelOrder: (orderId: string, reason?: string) => Promise<Order>;
  trackOrder: (orderId: string) => Promise<any>;
  rateOrder: (orderId: string, rating: number, comment?: string) => Promise<void>;
}

export function useOrders(): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calcule le prix d'une commande
   */
  const calculatePrice = useCallback(async (request: PriceCalculationRequest): Promise<PriceCalculationResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.post<PriceCalculationResult>('/orders/calculate-price', request);
      return result;
    } catch (error) {
      const message = handleApiError(error);
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Crée une nouvelle commande
   */
  const createOrder = useCallback(async (request: CreateOrderRequest): Promise<Order> => {
    setIsLoading(true);
    setError(null);

    try {
      const order = await apiClient.post<Order>('/orders', request);
      
      // Ajouter la commande à la liste locale
      setOrders(prev => [order, ...prev]);
      
      toast.success(`Commande ${order.orderNumber} créée avec succès !`);
      return order;
    } catch (error) {
      const message = handleApiError(error);
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Récupère les commandes de l'utilisateur
   */
  const getUserOrders = useCallback(async (page = 1, limit = 10): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{ orders: Order[]; total: number }>('/orders', {
        page,
        limit,
      });
      
      if (page === 1) {
        setOrders(response.orders);
      } else {
        // Pagination : ajouter à la liste existante
        setOrders(prev => [...prev, ...response.orders]);
      }
    } catch (error) {
      const message = handleApiError(error);
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Récupère une commande par ID
   */
  const getOrderById = useCallback(async (orderId: string): Promise<Order> => {
    setIsLoading(true);
    setError(null);

    try {
      const order = await apiClient.get<Order>(`/orders/${orderId}`);
      
      // Mettre à jour la commande dans la liste locale si elle existe
      setOrders(prev => prev.map(o => o.id === orderId ? order : o));
      
      return order;
    } catch (error) {
      const message = handleApiError(error);
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Met à jour une commande
   */
  const updateOrder = useCallback(async (orderId: string, updates: Partial<Order>): Promise<Order> => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedOrder = await apiClient.put<Order>(`/orders/${orderId}`, updates);
      
      // Mettre à jour la commande dans la liste locale
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
      
      toast.success('Commande mise à jour avec succès');
      return updatedOrder;
    } catch (error) {
      const message = handleApiError(error);
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Annule une commande
   */
  const cancelOrder = useCallback(async (orderId: string, reason?: string): Promise<Order> => {
    setIsLoading(true);
    setError(null);

    try {
      const cancelledOrder = await apiClient.delete<Order>(`/orders/${orderId}`, {
        reason,
      });
      
      // Mettre à jour la commande dans la liste locale
      setOrders(prev => prev.map(o => o.id === orderId ? cancelledOrder : o));
      
      toast.success('Commande annulée avec succès');
      return cancelledOrder;
    } catch (error) {
      const message = handleApiError(error);
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Suit une commande en temps réel
   */
  const trackOrder = useCallback(async (orderId: string): Promise<any> => {
    setIsLoading(true);
    setError(null);

    try {
      const trackingInfo = await apiClient.get<any>(`/orders/${orderId}/tracking`);
      return trackingInfo;
    } catch (error) {
      const message = handleApiError(error);
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Note une commande
   */
  const rateOrder = useCallback(async (orderId: string, rating: number, comment?: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await apiClient.post(`/orders/${orderId}/rate`, {
        rating,
        comment,
      });
      
      toast.success('Note enregistrée avec succès');
    } catch (error) {
      const message = handleApiError(error);
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // État
    orders,
    isLoading,
    error,
    
    // Actions
    calculatePrice,
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrder,
    cancelOrder,
    trackOrder,
    rateOrder,
  };
}

// Hook spécialisé pour le calcul de prix
export function usePriceCalculator() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [priceResult, setPriceResult] = useState<PriceCalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculatePrice = useCallback(async (request: PriceCalculationRequest) => {
    setIsCalculating(true);
    setError(null);

    try {
      const result = await apiClient.post<PriceCalculationResult>('/orders/calculate-price', request);
      setPriceResult(result);
      return result;
    } catch (error) {
      const message = handleApiError(error);
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setIsCalculating(false);
    }
  }, []);

  const resetCalculation = useCallback(() => {
    setPriceResult(null);
    setError(null);
  }, []);

  return {
    isCalculating,
    priceResult,
    error,
    calculatePrice,
    resetCalculation,
  };
}

// Hook pour une commande spécifique
export function useOrder(orderId: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;

    setIsLoading(true);
    setError(null);

    try {
      const fetchedOrder = await apiClient.get<Order>(`/orders/${orderId}`);
      setOrder(fetchedOrder);
    } catch (error) {
      const message = handleApiError(error);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  return {
    order,
    isLoading,
    error,
    fetchOrder,
    refetch: fetchOrder,
  };
}
