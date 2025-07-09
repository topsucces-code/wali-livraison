import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from './pricing.service';
import { CreateOrderDto, UpdateOrderDto, PriceCalculationDto } from './dto';
import { Order, OrderStatus, OrderType } from '@prisma/client';
import { Order as OrderInterface, PriceCalculationResult } from '@wali/shared';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

  /**
   * Calcule le prix d'une commande
   */
  async calculatePrice(priceCalculationDto: PriceCalculationDto): Promise<PriceCalculationResult> {
    const validation = this.pricingService.validateOrder(priceCalculationDto);
    
    if (!validation.valid) {
      throw new BadRequestException(validation.errors.join(', '));
    }

    return this.pricingService.calculatePrice(priceCalculationDto);
  }

  /**
   * Crée une nouvelle commande
   */
  async createOrder(userId: string, createOrderDto: CreateOrderDto): Promise<OrderInterface> {
    const { items, scheduledAt, ...orderData } = createOrderDto;

    // Calcul du prix
    const priceCalculation = await this.calculatePrice({
      type: createOrderDto.type,
      pickupLatitude: createOrderDto.pickupLatitude,
      pickupLongitude: createOrderDto.pickupLongitude,
      deliveryLatitude: createOrderDto.deliveryLatitude,
      deliveryLongitude: createOrderDto.deliveryLongitude,
      items,
    });

    // Génération du numéro de commande
    const orderNumber = await this.generateOrderNumber();

    // Création de la commande avec les articles
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        clientId: userId,
        type: orderData.type as OrderType,
        status: OrderStatus.PENDING,
        pickupAddress: orderData.pickupAddress,
        pickupLatitude: orderData.pickupLatitude,
        pickupLongitude: orderData.pickupLongitude,
        deliveryAddress: orderData.deliveryAddress,
        deliveryLatitude: orderData.deliveryLatitude,
        deliveryLongitude: orderData.deliveryLongitude,
        basePrice: priceCalculation.basePrice,
        deliveryFee: priceCalculation.deliveryFee,
        totalAmount: priceCalculation.totalAmount,
        estimatedDuration: priceCalculation.estimatedDuration,
        notes: orderData.notes,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        items: {
          create: items.map(item => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        items: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    // Créer l'événement de suivi initial
    await this.createTrackingEvent(order.id, OrderStatus.PENDING, 'Commande créée');

    this.logger.log(`Nouvelle commande créée: ${order.orderNumber} pour ${userId}`);

    return this.mapOrderToInterface(order);
  }

  /**
   * Récupère toutes les commandes de l'utilisateur
   */
  async getUserOrders(userId: string, page = 1, limit = 10): Promise<{ orders: OrderInterface[]; total: number }> {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { clientId: userId },
        include: {
          items: true,
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({
        where: { clientId: userId },
      }),
    ]);

    return {
      orders: orders.map(order => this.mapOrderToInterface(order)),
      total,
    };
  }

  /**
   * Récupère une commande par ID
   */
  async getOrderById(orderId: string, userId: string): Promise<OrderInterface> {
    const order = await this.prisma.order.findFirst({
      where: { 
        id: orderId,
        clientId: userId,
      },
      include: {
        items: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        trackingEvents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Commande non trouvée');
    }

    return this.mapOrderToInterface(order);
  }

  /**
   * Met à jour une commande
   */
  async updateOrder(orderId: string, userId: string, updateOrderDto: UpdateOrderDto): Promise<OrderInterface> {
    // Vérifier que la commande existe et appartient à l'utilisateur
    const existingOrder = await this.prisma.order.findFirst({
      where: { 
        id: orderId,
        clientId: userId,
      },
    });

    if (!existingOrder) {
      throw new NotFoundException('Commande non trouvée');
    }

    // Vérifier si la commande peut être modifiée
    if (existingOrder.status === OrderStatus.DELIVERED || 
        existingOrder.status === OrderStatus.CANCELLED ||
        existingOrder.status === OrderStatus.FAILED) {
      throw new BadRequestException('Cette commande ne peut plus être modifiée');
    }

    const { scheduledAt, ...updateData } = updateOrderDto;

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        ...updateData,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      },
      include: {
        items: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    // Créer un événement de suivi si le statut a changé
    if (updateOrderDto.status && updateOrderDto.status !== existingOrder.status) {
      await this.createTrackingEvent(orderId, updateOrderDto.status, `Statut mis à jour: ${updateOrderDto.status}`);
    }

    this.logger.log(`Commande mise à jour: ${orderId}`);

    return this.mapOrderToInterface(updatedOrder);
  }

  /**
   * Annule une commande
   */
  async cancelOrder(orderId: string, userId: string, reason?: string): Promise<OrderInterface> {
    const order = await this.prisma.order.findFirst({
      where: { 
        id: orderId,
        clientId: userId,
      },
    });

    if (!order) {
      throw new NotFoundException('Commande non trouvée');
    }

    // Vérifier si la commande peut être annulée
    if (order.status === OrderStatus.DELIVERED || 
        order.status === OrderStatus.CANCELLED ||
        order.status === OrderStatus.FAILED) {
      throw new BadRequestException('Cette commande ne peut pas être annulée');
    }

    if (order.status === OrderStatus.PICKED_UP || order.status === OrderStatus.IN_TRANSIT) {
      throw new BadRequestException('Cette commande est en cours de livraison et ne peut pas être annulée');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        notes: reason ? `${order.notes || ''}\nAnnulée: ${reason}`.trim() : order.notes,
      },
      include: {
        items: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    // Créer un événement de suivi
    await this.createTrackingEvent(orderId, OrderStatus.CANCELLED, reason || 'Commande annulée par le client');

    this.logger.log(`Commande annulée: ${orderId} - ${reason || 'Aucune raison'}`);

    return this.mapOrderToInterface(updatedOrder);
  }

  /**
   * Génère un numéro de commande unique
   */
  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    
    // Compter les commandes du jour
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const todayOrdersCount = await this.prisma.order.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    const sequence = (todayOrdersCount + 1).toString().padStart(4, '0');
    
    return `WL${year}${month}${day}${sequence}`;
  }

  /**
   * Crée un événement de suivi
   */
  private async createTrackingEvent(orderId: string, status: OrderStatus, description?: string): Promise<void> {
    await this.prisma.trackingEvent.create({
      data: {
        orderId,
        status,
        description,
      },
    });
  }

  /**
   * Mappe une commande Prisma vers l'interface partagée
   */
  private mapOrderToInterface(order: any): OrderInterface {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      clientId: order.clientId,
      driverId: order.driverId,
      type: order.type,
      status: order.status,
      pickupAddress: order.pickupAddress,
      pickupLatitude: order.pickupLatitude,
      pickupLongitude: order.pickupLongitude,
      deliveryAddress: order.deliveryAddress,
      deliveryLatitude: order.deliveryLatitude,
      deliveryLongitude: order.deliveryLongitude,
      basePrice: order.basePrice,
      deliveryFee: order.deliveryFee,
      totalAmount: order.totalAmount,
      estimatedDuration: order.estimatedDuration,
      scheduledAt: order.scheduledAt,
      pickedUpAt: order.pickedUpAt,
      deliveredAt: order.deliveredAt,
      notes: order.notes,
      proofOfDelivery: order.proofOfDelivery,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items,
      client: order.client,
      driver: order.driver,
      trackingEvents: order.trackingEvents,
    };
  }
}
