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
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto } from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '@prisma/client';

@ApiTags('Adresses')
@Controller('addresses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Liste des adresses de l\'utilisateur',
    description: 'Récupère toutes les adresses de livraison de l\'utilisateur connecté'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des adresses récupérée avec succès.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'cuid123456789' },
          label: { type: 'string', example: 'Maison' },
          street: { type: 'string', example: 'Rue des Jardins, Villa 12' },
          city: { type: 'string', example: 'Abidjan' },
          district: { type: 'string', example: 'Cocody' },
          landmark: { type: 'string', example: 'Près de la pharmacie' },
          latitude: { type: 'number', example: 5.3364 },
          longitude: { type: 'number', example: -4.0267 },
          isDefault: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  async getUserAddresses(@CurrentUser() user: User) {
    return this.addressesService.getUserAddresses(user.id);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Détails d\'une adresse',
    description: 'Récupère les détails d\'une adresse spécifique'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'adresse',
    example: 'cuid123456789'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Adresse récupérée avec succès.' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Adresse non trouvée' 
  })
  async getAddressById(@Param('id') id: string, @CurrentUser() user: User) {
    return this.addressesService.getAddressById(id, user.id);
  }

  @Post()
  @ApiOperation({ 
    summary: 'Créer une nouvelle adresse',
    description: 'Ajoute une nouvelle adresse de livraison pour l\'utilisateur'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Adresse créée avec succès.' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides ou coordonnées hors de Côte d\'Ivoire' 
  })
  async createAddress(
    @CurrentUser() user: User,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return this.addressesService.createAddress(user.id, createAddressDto);
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Mettre à jour une adresse',
    description: 'Modifie une adresse existante de l\'utilisateur'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'adresse à modifier',
    example: 'cuid123456789'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Adresse mise à jour avec succès.' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Adresse non trouvée' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides' 
  })
  async updateAddress(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.addressesService.updateAddress(id, user.id, updateAddressDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Supprimer une adresse',
    description: 'Supprime une adresse de l\'utilisateur'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'adresse à supprimer',
    example: 'cuid123456789'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Adresse supprimée avec succès.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Adresse supprimée avec succès' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Adresse non trouvée' 
  })
  async deleteAddress(@Param('id') id: string, @CurrentUser() user: User) {
    return this.addressesService.deleteAddress(id, user.id);
  }

  @Put(':id/default')
  @ApiOperation({ 
    summary: 'Définir comme adresse par défaut',
    description: 'Définit une adresse comme adresse de livraison par défaut'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'adresse à définir par défaut',
    example: 'cuid123456789'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Adresse définie comme par défaut avec succès.' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Adresse non trouvée' 
  })
  async setDefaultAddress(@Param('id') id: string, @CurrentUser() user: User) {
    return this.addressesService.setDefaultAddress(id, user.id);
  }

  @Get('nearby/search')
  @ApiOperation({ 
    summary: 'Rechercher des adresses à proximité',
    description: 'Trouve les adresses de l\'utilisateur dans un rayon donné'
  })
  @ApiQuery({
    name: 'latitude',
    description: 'Latitude du point de recherche',
    example: 5.3364,
    type: 'number'
  })
  @ApiQuery({
    name: 'longitude',
    description: 'Longitude du point de recherche',
    example: -4.0267,
    type: 'number'
  })
  @ApiQuery({
    name: 'radius',
    description: 'Rayon de recherche en kilomètres',
    example: 5,
    required: false,
    type: 'number'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Adresses à proximité trouvées.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          street: { type: 'string' },
          city: { type: 'string' },
          district: { type: 'string' },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          distance: { type: 'number', description: 'Distance en kilomètres' }
        }
      }
    }
  })
  async searchNearbyAddresses(
    @CurrentUser() user: User,
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius?: number,
  ) {
    return this.addressesService.searchNearbyAddresses(
      user.id, 
      Number(latitude), 
      Number(longitude), 
      radius ? Number(radius) : 5
    );
  }

  @Post('geocode')
  @ApiOperation({ 
    summary: 'Géocoder une adresse',
    description: 'Convertit une adresse textuelle en coordonnées GPS'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Géocodage réussi.',
    schema: {
      type: 'object',
      properties: {
        latitude: { type: 'number', example: 5.3364 },
        longitude: { type: 'number', example: -4.0267 },
        formattedAddress: { type: 'string', example: 'Rue des Jardins, Cocody, Abidjan, Côte d\'Ivoire' },
        city: { type: 'string', example: 'Abidjan' },
        district: { type: 'string', example: 'Cocody' },
        confidence: { type: 'number', example: 0.8 }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Impossible de géolocaliser cette adresse' 
  })
  async geocodeAddress(@Body('address') address: string) {
    return this.addressesService.geocodeAddress(address);
  }

  @Post('reverse-geocode')
  @ApiOperation({ 
    summary: 'Géocodage inverse',
    description: 'Convertit des coordonnées GPS en adresse'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Géocodage inverse réussi.',
    schema: {
      type: 'object',
      properties: {
        street: { type: 'string', example: 'Rue de la République' },
        city: { type: 'string', example: 'Abidjan' },
        district: { type: 'string', example: 'Plateau' },
        formattedAddress: { type: 'string', example: 'Rue de la République, Plateau, Abidjan, Côte d\'Ivoire' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Coordonnées invalides ou hors de Côte d\'Ivoire' 
  })
  async reverseGeocode(
    @Body('latitude') latitude: number,
    @Body('longitude') longitude: number,
  ) {
    return this.addressesService.reverseGeocode(Number(latitude), Number(longitude));
  }
}
