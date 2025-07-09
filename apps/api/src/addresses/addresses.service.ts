import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeocodingService } from './geocoding.service';
import { CreateAddressDto, UpdateAddressDto } from './dto';
import { Address } from '@prisma/client';
import { ABIDJAN_DISTRICTS } from '@wali/shared';

@Injectable()
export class AddressesService {
  private readonly logger = new Logger(AddressesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geocodingService: GeocodingService,
  ) {}

  /**
   * Récupère toutes les adresses de l'utilisateur connecté
   */
  async getUserAddresses(userId: string): Promise<Address[]> {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Récupère une adresse par son ID
   */
  async getAddressById(addressId: string, userId: string): Promise<Address> {
    const address = await this.prisma.address.findFirst({
      where: { 
        id: addressId,
        userId,
      },
    });

    if (!address) {
      throw new NotFoundException('Adresse non trouvée');
    }

    return address;
  }

  /**
   * Crée une nouvelle adresse
   */
  async createAddress(userId: string, createAddressDto: CreateAddressDto): Promise<Address> {
    const { latitude, longitude, city, district, isDefault, ...addressData } = createAddressDto;

    // Validation des coordonnées pour la Côte d'Ivoire
    if (!this.geocodingService.isWithinIvoryCoast(latitude, longitude)) {
      throw new BadRequestException('Les coordonnées doivent être situées en Côte d\'Ivoire');
    }

    // Validation spécifique pour Abidjan
    if (city === 'Abidjan' && district && !ABIDJAN_DISTRICTS.includes(district as any)) {
      throw new BadRequestException('Le quartier spécifié n\'est pas valide pour Abidjan');
    }

    // Si c'est la première adresse ou si isDefault est true, la définir comme par défaut
    const existingAddresses = await this.prisma.address.count({
      where: { userId },
    });

    const shouldBeDefault = isDefault || existingAddresses === 0;

    // Si on définit cette adresse comme par défaut, retirer le statut des autres
    if (shouldBeDefault) {
      await this.prisma.address.updateMany({
        where: { 
          userId,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const address = await this.prisma.address.create({
      data: {
        ...addressData,
        city,
        district,
        latitude,
        longitude,
        isDefault: shouldBeDefault,
        userId,
      },
    });

    this.logger.log(`Nouvelle adresse créée pour l'utilisateur ${userId}: ${address.id}`);

    return address;
  }

  /**
   * Met à jour une adresse existante
   */
  async updateAddress(
    addressId: string, 
    userId: string, 
    updateAddressDto: UpdateAddressDto
  ): Promise<Address> {
    // Vérifier que l'adresse existe et appartient à l'utilisateur
    const existingAddress = await this.getAddressById(addressId, userId);

    const { latitude, longitude, city, district, isDefault, ...addressData } = updateAddressDto;

    // Validation des coordonnées si elles sont modifiées
    if (latitude !== undefined && longitude !== undefined) {
      if (!this.geocodingService.isWithinIvoryCoast(latitude, longitude)) {
        throw new BadRequestException('Les coordonnées doivent être situées en Côte d\'Ivoire');
      }
    }

    // Validation spécifique pour Abidjan
    if (city === 'Abidjan' && district && !ABIDJAN_DISTRICTS.includes(district as any)) {
      throw new BadRequestException('Le quartier spécifié n\'est pas valide pour Abidjan');
    }

    // Si on définit cette adresse comme par défaut, retirer le statut des autres
    if (isDefault === true) {
      await this.prisma.address.updateMany({
        where: { 
          userId,
          isDefault: true,
          id: { not: addressId },
        },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await this.prisma.address.update({
      where: { id: addressId },
      data: {
        ...addressData,
        ...(city !== undefined && { city }),
        ...(district !== undefined && { district }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    this.logger.log(`Adresse mise à jour: ${addressId}`);

    return updatedAddress;
  }

  /**
   * Supprime une adresse
   */
  async deleteAddress(addressId: string, userId: string): Promise<{ message: string }> {
    // Vérifier que l'adresse existe et appartient à l'utilisateur
    const existingAddress = await this.getAddressById(addressId, userId);

    await this.prisma.address.delete({
      where: { id: addressId },
    });

    // Si c'était l'adresse par défaut, définir une autre comme par défaut
    if (existingAddress.isDefault) {
      const firstAddress = await this.prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });

      if (firstAddress) {
        await this.prisma.address.update({
          where: { id: firstAddress.id },
          data: { isDefault: true },
        });
      }
    }

    this.logger.log(`Adresse supprimée: ${addressId}`);

    return {
      message: 'Adresse supprimée avec succès',
    };
  }

  /**
   * Définit une adresse comme adresse par défaut
   */
  async setDefaultAddress(addressId: string, userId: string): Promise<Address> {
    // Vérifier que l'adresse existe et appartient à l'utilisateur
    await this.getAddressById(addressId, userId);

    // Retirer le statut par défaut des autres adresses
    await this.prisma.address.updateMany({
      where: { 
        userId,
        isDefault: true,
      },
      data: { isDefault: false },
    });

    // Définir cette adresse comme par défaut
    const updatedAddress = await this.prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });

    this.logger.log(`Adresse définie comme par défaut: ${addressId}`);

    return updatedAddress;
  }

  /**
   * Recherche d'adresses à proximité
   */
  async searchNearbyAddresses(
    userId: string,
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ): Promise<Array<Address & { distance: number }>> {
    const userAddresses = await this.getUserAddresses(userId);

    const nearbyAddresses = userAddresses
      .map(address => ({
        ...address,
        distance: this.geocodingService.calculateDistance(
          latitude,
          longitude,
          address.latitude,
          address.longitude
        ),
      }))
      .filter(address => address.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    return nearbyAddresses;
  }

  /**
   * Géocode une adresse textuelle
   */
  async geocodeAddress(address: string) {
    const result = await this.geocodingService.geocodeAddress(address);
    if (!result) {
      throw new BadRequestException('Impossible de géolocaliser cette adresse');
    }
    return result;
  }

  /**
   * Géocode inverse (coordonnées vers adresse)
   */
  async reverseGeocode(latitude: number, longitude: number) {
    if (!this.geocodingService.isWithinIvoryCoast(latitude, longitude)) {
      throw new BadRequestException('Les coordonnées doivent être situées en Côte d\'Ivoire');
    }

    const result = await this.geocodingService.reverseGeocode(latitude, longitude);
    if (!result) {
      throw new BadRequestException('Impossible de trouver une adresse pour ces coordonnées');
    }
    return result;
  }
}
