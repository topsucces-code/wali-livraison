import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  UseGuards, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam,
  ApiQuery 
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto, PriceCalculationDto } from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '@prisma/client';

@ApiTags('Commandes')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('calculate-price')
  @ApiOperation({ 
    summary: 'Calculer le prix d\'une commande',
    description: 'Calcule le prix d\'une commande basé sur la distance réelle (Google Maps) et le type de livraison'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Prix calculé avec succès.',
    schema: {
      type: 'object',
      properties: {
        distance: { type: 'number', example: 5.2, description: 'Distance en kilomètres' },
        estimatedDuration: { type: 'number', example: 25, description: 'Durée estimée en minutes' },
        basePrice: { type: 'number', example: 1500, description: 'Prix de base en FCFA' },
        deliveryFee: { type: 'number', example: 1200, description: 'Frais de livraison en FCFA' },
        totalAmount: { type: 'number', example: 2700, description: 'Montant total en FCFA' },
        breakdown: {
          type: 'object',
          properties: {
            distanceFee: { type: 'number', example: 640 },
            timeFee: { type: 'number', example: 0 },
            typeFee: { type: 'number', example: 300 },
            itemsFee: { type: 'number', example: 260 }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides ou distance trop importante' 
  })
  async calculatePrice(@Body() priceCalculationDto: PriceCalculationDto) {
    return this.ordersService.calculatePrice(priceCalculationDto);
  }

  @Post()
  @ApiOperation({ 
    summary: 'Créer une nouvelle commande',
    description: 'Crée une nouvelle commande de livraison avec calcul automatique du prix'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Commande créée avec succès.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'cuid123456789' },
        orderNumber: { type: 'string', example: 'WL24011500001' },
        status: { type: 'string', example: 'PENDING' },
        type: { type: 'string', example: 'FOOD' },
        totalAmount: { type: 'number', example: 2700 },
        estimatedDuration: { type: 'number', example: 25 },
        createdAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides' 
  })
  async createOrder(
    @CurrentUser() user: User,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(user.id, createOrderDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Liste des commandes de l\'utilisateur',
    description: 'Récupère toutes les commandes de l\'utilisateur connecté avec pagination'
  })
  @ApiQuery({
    name: 'page',
    description: 'Numéro de page',
    example: 1,
    required: false,
    type: 'number'
  })
  @ApiQuery({
    name: 'limit',
    description: 'Nombre d\'éléments par page',
    example: 10,
    required: false,
    type: 'number'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des commandes récupérée avec succès.',
    schema: {
      type: 'object',
      properties: {
        orders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              orderNumber: { type: 'string' },
              status: { type: 'string' },
              type: { type: 'string' },
              totalAmount: { type: 'number' },
              createdAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        total: { type: 'number', example: 25 }
      }
    }
  })
  async getUserOrders(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ordersService.getUserOrders(
      user.id, 
      page ? Number(page) : 1, 
      limit ? Number(limit) : 10
    );
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Détails d\'une commande',
    description: 'Récupère les détails complets d\'une commande avec suivi'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la commande',
    example: 'cuid123456789'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Commande récupérée avec succès.' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Commande non trouvée' 
  })
  async getOrderById(@Param('id') id: string, @CurrentUser() user: User) {
    return this.ordersService.getOrderById(id, user.id);
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Mettre à jour une commande',
    description: 'Modifie une commande existante (statut, notes, etc.)'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la commande à modifier',
    example: 'cuid123456789'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Commande mise à jour avec succès.' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Commande non trouvée' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Commande ne peut plus être modifiée' 
  })
  async updateOrder(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.ordersService.updateOrder(id, user.id, updateOrderDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Annuler une commande',
    description: 'Annule une commande si elle n\'est pas encore en cours de livraison'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la commande à annuler',
    example: 'cuid123456789'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Commande annulée avec succès.' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Commande non trouvée' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Commande ne peut pas être annulée' 
  })
  async cancelOrder(
    @Param('id') id: string, 
    @CurrentUser() user: User,
    @Body('reason') reason?: string
  ) {
    return this.ordersService.cancelOrder(id, user.id, reason);
  }

  @Get(':id/tracking')
  @ApiOperation({ 
    summary: 'Suivi d\'une commande',
    description: 'Récupère les informations de suivi en temps réel d\'une commande'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la commande à suivre',
    example: 'cuid123456789'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Informations de suivi récupérées avec succès.',
    schema: {
      type: 'object',
      properties: {
        order: { type: 'object' },
        currentLocation: {
          type: 'object',
          properties: {
            latitude: { type: 'number' },
            longitude: { type: 'number' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        estimatedArrival: { type: 'string', format: 'date-time' },
        trackingEvents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              description: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Commande non trouvée' 
  })
  async getOrderTracking(@Param('id') id: string, @CurrentUser() user: User) {
    const order = await this.ordersService.getOrderById(id, user.id);
    
    // TODO: Implémenter la logique de suivi en temps réel
    // Pour l'instant, retourner les informations de base
    return {
      order,
      currentLocation: null, // À implémenter avec la position du livreur
      estimatedArrival: null, // À calculer basé sur la position actuelle
      trackingEvents: order.trackingEvents || [],
    };
  }

  @Post(':id/rate')
  @ApiOperation({ 
    summary: 'Noter une commande',
    description: 'Permet au client de noter la qualité de la livraison'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la commande à noter',
    example: 'cuid123456789'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Note enregistrée avec succès.' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Commande non trouvée' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Commande ne peut pas être notée' 
  })
  async rateOrder(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body('rating') rating: number,
    @Body('comment') comment?: string,
  ) {
    // TODO: Implémenter le système de notation
    // Vérifier que la commande est livrée
    // Enregistrer la note et le commentaire
    
    return {
      message: 'Note enregistrée avec succès',
      rating,
      comment,
    };
  }
}
