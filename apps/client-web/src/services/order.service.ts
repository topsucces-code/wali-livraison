import { 
  Order, 
  OrderStatus, 
  OrderPriority, 
  PaymentMethod, 
  PaymentStatus,
  VehicleType,
  Address,
  OrderItem,
  PricingDetails,
  OrderStatusUpdate,
  DeliveryTracking,
  calculateDistance,
  calculateOrderPrice,
  generateOrderNumber
} from '@/lib/orders';

interface CreateOrderRequest {
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

class OrderService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  private isOnline = true;

  // Données simulées pour le développement
  private mockOrders: Order[] = [
    {
      id: '1',
      orderNumber: 'WAL-2024-001234',
      clientId: '1',
      clientName: 'Kouame Yao',
      clientPhone: '+22507123456',
      pickupAddress: {
        label: 'Restaurant Maquis',
        street: 'Boulevard de la République',
        district: 'Plateau',
        city: 'Abidjan',
        coordinates: { lat: 5.3364, lng: -4.0267 },
        contactName: 'Chef Adjoua',
        contactPhone: '+22501234567',
      },
      deliveryAddress: {
        label: 'Domicile',
        street: 'Rue des Jardins',
        district: 'Cocody',
        city: 'Abidjan',
        coordinates: { lat: 5.3442, lng: -3.9874 },
        contactName: 'Kouame Yao',
        contactPhone: '+22507123456',
      },
      items: [
        {
          id: '1',
          name: 'Attiéké Poisson',
          description: 'Plat traditionnel avec poisson braisé',
          quantity: 2,
          weight: 1.5,
          value: 4000,
          fragile: false,
          category: 'FOOD' as any,
        }
      ],
      totalWeight: 1.5,
      totalValue: 4000,
      priority: OrderPriority.EXPRESS,
      preferredVehicleType: VehicleType.MOTO,
      status: OrderStatus.DELIVERY_IN_PROGRESS,
      statusHistory: [
        {
          id: '1',
          orderId: '1',
          status: OrderStatus.PENDING,
          timestamp: '2024-01-15T10:00:00Z',
          updatedBy: '1',
          updatedByRole: 'CLIENT',
        },
        {
          id: '2',
          orderId: '1',
          status: OrderStatus.ACCEPTED,
          timestamp: '2024-01-15T10:15:00Z',
          updatedBy: '2',
          updatedByRole: 'DRIVER',
        },
        {
          id: '3',
          orderId: '1',
          status: OrderStatus.PICKED_UP,
          timestamp: '2024-01-15T10:45:00Z',
          location: { lat: 5.3364, lng: -4.0267 },
          updatedBy: '2',
          updatedByRole: 'DRIVER',
        },
        {
          id: '4',
          orderId: '1',
          status: OrderStatus.DELIVERY_IN_PROGRESS,
          timestamp: '2024-01-15T11:00:00Z',
          location: { lat: 5.3400, lng: -4.0100 },
          updatedBy: '2',
          updatedByRole: 'DRIVER',
        }
      ],
      driverId: '2',
      driverName: 'Mamadou Traore',
      driverPhone: '+22501987654',
      vehicleInfo: {
        type: VehicleType.MOTO,
        brand: 'Honda',
        model: 'CB 125',
        registrationNumber: '1234 CI 01',
      },
      pricing: {
        basePrice: 1000,
        distancePrice: 450,
        priorityPrice: 725,
        vehiclePrice: 0,
        zonePrice: 145,
        totalPrice: 2320,
        currency: 'FCFA',
        breakdown: [
          { label: 'Prix de base', amount: 1000 },
          { label: 'Distance (3.0 km)', amount: 450 },
          { label: 'Priorité EXPRESS', amount: 725 },
          { label: 'Supplément zone', amount: 145 },
        ],
      },
      paymentMethod: PaymentMethod.ORANGE_MONEY,
      paymentStatus: PaymentStatus.PAID,
      estimatedDeliveryTime: '2024-01-15T11:30:00Z',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T11:00:00Z',
    }
  ];

  // Créer une nouvelle commande
  async createOrder(orderData: CreateOrderRequest, clientId: string): Promise<Order> {
    try {
      if (this.isOnline) {
        const response = await fetch(`${this.baseUrl}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
          body: JSON.stringify({ ...orderData, clientId }),
        });

        if (response.ok) {
          return await response.json();
        }
      }
    } catch (error) {
      console.log('Backend indisponible, utilisation du mode hors ligne');
    }

    // Mode hors ligne - simulation
    return this.simulateCreateOrder(orderData, clientId);
  }

  // Obtenir les commandes d'un client
  async getClientOrders(clientId: string): Promise<Order[]> {
    try {
      if (this.isOnline) {
        const response = await fetch(`${this.baseUrl}/orders/client/${clientId}`, {
          headers: {
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
        });

        if (response.ok) {
          return await response.json();
        }
      }
    } catch (error) {
      console.log('Backend indisponible, utilisation du mode hors ligne');
    }

    // Mode hors ligne - simulation
    return this.simulateGetClientOrders(clientId);
  }

  // Obtenir les commandes disponibles pour un livreur
  async getAvailableOrders(driverId: string, vehicleType: VehicleType): Promise<Order[]> {
    try {
      if (this.isOnline) {
        const response = await fetch(`${this.baseUrl}/orders/available?driverId=${driverId}&vehicleType=${vehicleType}`, {
          headers: {
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
        });

        if (response.ok) {
          return await response.json();
        }
      }
    } catch (error) {
      console.log('Backend indisponible, utilisation du mode hors ligne');
    }

    // Mode hors ligne - simulation
    return this.simulateGetAvailableOrders(vehicleType);
  }

  // Obtenir les commandes d'un livreur
  async getDriverOrders(driverId: string): Promise<Order[]> {
    try {
      if (this.isOnline) {
        const response = await fetch(`${this.baseUrl}/orders/driver/${driverId}`, {
          headers: {
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
        });

        if (response.ok) {
          return await response.json();
        }
      }
    } catch (error) {
      console.log('Backend indisponible, utilisation du mode hors ligne');
    }

    // Mode hors ligne - simulation
    return this.simulateGetDriverOrders(driverId);
  }

  // Obtenir une commande par ID
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      if (this.isOnline) {
        const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
        });

        if (response.ok) {
          return await response.json();
        }
      }
    } catch (error) {
      console.log('Backend indisponible, utilisation du mode hors ligne');
    }

    // Mode hors ligne - simulation
    return this.simulateGetOrderById(orderId);
  }

  // Accepter une commande (livreur)
  async acceptOrder(orderId: string, driverId: string): Promise<Order> {
    try {
      if (this.isOnline) {
        const response = await fetch(`${this.baseUrl}/orders/${orderId}/accept`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
          body: JSON.stringify({ driverId }),
        });

        if (response.ok) {
          return await response.json();
        }
      }
    } catch (error) {
      console.log('Backend indisponible, utilisation du mode hors ligne');
    }

    // Mode hors ligne - simulation
    return this.simulateAcceptOrder(orderId, driverId);
  }

  // Mettre à jour le statut d'une commande
  async updateOrderStatus(
    orderId: string, 
    status: OrderStatus, 
    location?: { lat: number; lng: number },
    notes?: string
  ): Promise<Order> {
    try {
      if (this.isOnline) {
        const response = await fetch(`${this.baseUrl}/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
          body: JSON.stringify({ status, location, notes }),
        });

        if (response.ok) {
          return await response.json();
        }
      }
    } catch (error) {
      console.log('Backend indisponible, utilisation du mode hors ligne');
    }

    // Mode hors ligne - simulation
    return this.simulateUpdateOrderStatus(orderId, status, location, notes);
  }

  // Annuler une commande
  async cancelOrder(orderId: string, reason: string): Promise<Order> {
    try {
      if (this.isOnline) {
        const response = await fetch(`${this.baseUrl}/orders/${orderId}/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
          body: JSON.stringify({ reason }),
        });

        if (response.ok) {
          return await response.json();
        }
      }
    } catch (error) {
      console.log('Backend indisponible, utilisation du mode hors ligne');
    }

    // Mode hors ligne - simulation
    return this.simulateUpdateOrderStatus(orderId, OrderStatus.CANCELLED, undefined, reason);
  }

  // Calculer le prix d'une commande
  async calculatePrice(
    pickupAddress: Address,
    deliveryAddress: Address,
    vehicleType: VehicleType,
    priority: OrderPriority
  ): Promise<PricingDetails> {
    const distance = calculateDistance(pickupAddress, deliveryAddress);
    return calculateOrderPrice(
      distance,
      vehicleType,
      priority,
      pickupAddress.district,
      deliveryAddress.district
    );
  }

  // Obtenir le suivi en temps réel
  async getOrderTracking(orderId: string): Promise<DeliveryTracking | null> {
    try {
      if (this.isOnline) {
        const response = await fetch(`${this.baseUrl}/orders/${orderId}/tracking`, {
          headers: {
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
        });

        if (response.ok) {
          return await response.json();
        }
      }
    } catch (error) {
      console.log('Backend indisponible, utilisation du mode hors ligne');
    }

    // Mode hors ligne - simulation
    return this.simulateGetOrderTracking(orderId);
  }

  // Méthodes privées pour les simulations
  private async simulateCreateOrder(orderData: CreateOrderRequest, clientId: string): Promise<Order> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const distance = calculateDistance(orderData.pickupAddress, orderData.deliveryAddress);
    const pricing = calculateOrderPrice(
      distance,
      orderData.preferredVehicleType || VehicleType.MOTO,
      orderData.priority,
      orderData.pickupAddress.district,
      orderData.deliveryAddress.district
    );

    const newOrder: Order = {
      id: Date.now().toString(),
      orderNumber: generateOrderNumber(),
      clientId,
      clientName: 'Client Test',
      clientPhone: '+22507123456',
      pickupAddress: orderData.pickupAddress,
      deliveryAddress: orderData.deliveryAddress,
      items: orderData.items,
      totalWeight: orderData.items.reduce((sum, item) => sum + (item.weight || 0), 0),
      totalValue: orderData.items.reduce((sum, item) => sum + (item.value || 0), 0),
      priority: orderData.priority,
      preferredVehicleType: orderData.preferredVehicleType,
      status: OrderStatus.PENDING,
      statusHistory: [
        {
          id: '1',
          orderId: Date.now().toString(),
          status: OrderStatus.PENDING,
          timestamp: new Date().toISOString(),
          updatedBy: clientId,
          updatedByRole: 'CLIENT',
        }
      ],
      pricing,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: PaymentStatus.PENDING,
      notes: orderData.notes,
      specialInstructions: orderData.specialInstructions,
      scheduledPickupTime: orderData.scheduledPickupTime,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.mockOrders.push(newOrder);
    return newOrder;
  }

  private async simulateGetClientOrders(clientId: string): Promise<Order[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.mockOrders.filter(order => order.clientId === clientId);
  }

  private async simulateGetAvailableOrders(vehicleType: VehicleType): Promise<Order[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    return this.mockOrders.filter(order => 
      order.status === OrderStatus.PENDING && 
      (!order.preferredVehicleType || order.preferredVehicleType === vehicleType)
    );
  }

  private async simulateGetDriverOrders(driverId: string): Promise<Order[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.mockOrders.filter(order => order.driverId === driverId);
  }

  private async simulateGetOrderById(orderId: string): Promise<Order | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.mockOrders.find(order => order.id === orderId) || null;
  }

  private async simulateAcceptOrder(orderId: string, driverId: string): Promise<Order> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const orderIndex = this.mockOrders.findIndex(order => order.id === orderId);
    if (orderIndex === -1) {
      throw new Error('Commande non trouvée');
    }

    const order = this.mockOrders[orderIndex];
    const updatedOrder = {
      ...order,
      status: OrderStatus.ACCEPTED,
      driverId,
      driverName: 'Livreur Test',
      driverPhone: '+22501987654',
      statusHistory: [
        ...order.statusHistory,
        {
          id: Date.now().toString(),
          orderId,
          status: OrderStatus.ACCEPTED,
          timestamp: new Date().toISOString(),
          updatedBy: driverId,
          updatedByRole: 'DRIVER' as const,
        }
      ],
      updatedAt: new Date().toISOString(),
    };

    this.mockOrders[orderIndex] = updatedOrder;
    return updatedOrder;
  }

  private async simulateUpdateOrderStatus(
    orderId: string, 
    status: OrderStatus, 
    location?: { lat: number; lng: number },
    notes?: string
  ): Promise<Order> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const orderIndex = this.mockOrders.findIndex(order => order.id === orderId);
    if (orderIndex === -1) {
      throw new Error('Commande non trouvée');
    }

    const order = this.mockOrders[orderIndex];
    const updatedOrder = {
      ...order,
      status,
      statusHistory: [
        ...order.statusHistory,
        {
          id: Date.now().toString(),
          orderId,
          status,
          timestamp: new Date().toISOString(),
          location,
          notes,
          updatedBy: order.driverId || order.clientId,
          updatedByRole: (order.driverId ? 'DRIVER' : 'CLIENT') as const,
        }
      ],
      updatedAt: new Date().toISOString(),
      ...(status === OrderStatus.DELIVERED && { completedAt: new Date().toISOString() }),
    };

    this.mockOrders[orderIndex] = updatedOrder;
    return updatedOrder;
  }

  private async simulateGetOrderTracking(orderId: string): Promise<DeliveryTracking | null> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const order = this.mockOrders.find(o => o.id === orderId);
    if (!order || !order.driverId) return null;

    // Simulation de position entre pickup et delivery
    const pickup = order.pickupAddress.coordinates;
    const delivery = order.deliveryAddress.coordinates;
    const progress = 0.6; // 60% du trajet
    
    return {
      orderId,
      driverId: order.driverId,
      currentLocation: {
        lat: pickup.lat + (delivery.lat - pickup.lat) * progress,
        lng: pickup.lng + (delivery.lng - pickup.lng) * progress,
        timestamp: new Date().toISOString(),
      },
      estimatedArrival: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min
      distance: 2.1,
      duration: 15,
    };
  }

  private getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('wali_access_token');
    }
    return null;
  }
}

export const orderService = new OrderService();
