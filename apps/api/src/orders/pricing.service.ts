import { Injectable, Logger } from '@nestjs/common';
import {
  PriceCalculationRequest,
  PriceCalculationResult,
  OrderType,
  PRICING_CONFIG
} from '@wali/shared';
import { DistanceService } from './distance.service';

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(private readonly distanceService: DistanceService) {}

  /**
   * Calcule le prix d'une commande basé sur la distance, le type et les conditions
   */
  async calculatePrice(request: PriceCalculationRequest): Promise<PriceCalculationResult> {
    const { type, pickupLatitude, pickupLongitude, deliveryLatitude, deliveryLongitude, items = [] } = request;

    // Calcul de la distance et durée réelles via Google Maps
    const distanceResult = await this.distanceService.calculateDistanceAndDuration(
      pickupLatitude,
      pickupLongitude,
      deliveryLatitude,
      deliveryLongitude
    );

    const distance = distanceResult.distance;
    const estimatedDuration = distanceResult.duration;

    // Prix de base selon le type
    const basePrice = PRICING_CONFIG.BASE_PRICES[type];

    // Calcul des frais de distance
    const chargeableDistance = Math.max(0, distance - PRICING_CONFIG.FREE_DISTANCE);
    const distanceFee = chargeableDistance * PRICING_CONFIG.PRICE_PER_KM;

    // Frais de temps (pour les longues distances)
    const timeFee = estimatedDuration > 30 ? (estimatedDuration - 30) * PRICING_CONFIG.PRICE_PER_MINUTE : 0;

    // Frais selon le type de commande
    const typeFee = this.calculateTypeFee(type, items);

    // Frais pour les articles (pour les courses)
    const itemsFee = this.calculateItemsFee(type, items);

    // Total avant majorations
    let subtotal = basePrice + distanceFee + timeFee + typeFee + itemsFee;

    // Application des majorations
    const surcharges = this.calculateSurcharges(subtotal);
    const deliveryFee = distanceFee + timeFee + typeFee + itemsFee + surcharges;
    const totalAmount = Math.max(basePrice + deliveryFee, PRICING_CONFIG.MIN_ORDER_AMOUNT);

    this.logger.log(`Prix calculé pour ${type}: ${totalAmount} FCFA (distance: ${distance}km, durée: ${estimatedDuration}min)`);

    return {
      distance: Math.round(distance * 100) / 100, // Arrondir à 2 décimales
      estimatedDuration,
      basePrice,
      deliveryFee: Math.round(deliveryFee),
      totalAmount: Math.round(totalAmount),
      breakdown: {
        distanceFee: Math.round(distanceFee),
        timeFee: Math.round(timeFee),
        typeFee: Math.round(typeFee),
        itemsFee: Math.round(itemsFee),
      },
    };
  }

  /**
   * Calcule la distance entre deux points GPS (formule haversine)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en kilomètres
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calcule les frais spécifiques au type de commande
   */
  private calculateTypeFee(type: OrderType, items: any[]): number {
    switch (type) {
      case OrderType.FOOD:
        // Frais supplémentaires pour la nourriture (emballage, température)
        return 300;
      
      case OrderType.SHOPPING:
        // Frais pour les courses (temps de shopping)
        return items.length > 5 ? 500 : 200;
      
      case OrderType.DELIVERY:
      default:
        return 0;
    }
  }

  /**
   * Calcule les frais basés sur les articles
   */
  private calculateItemsFee(type: OrderType, items: any[]): number {
    if (type !== OrderType.SHOPPING) {
      return 0;
    }

    // Pour les courses, frais selon le nombre d'articles
    const itemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    
    if (itemCount > 20) return 1000;
    if (itemCount > 10) return 500;
    if (itemCount > 5) return 200;
    
    return 0;
  }

  /**
   * Calcule les majorations selon l'heure et les conditions
   */
  private calculateSurcharges(baseAmount: number): number {
    const now = new Date();
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    
    let surchargeRate = 0;

    // Majoration nocturne (22h - 6h)
    if (hour >= 22 || hour < 6) {
      surchargeRate += PRICING_CONFIG.NIGHT_SURCHARGE;
    }

    // Majoration weekend
    if (isWeekend) {
      surchargeRate += PRICING_CONFIG.WEEKEND_SURCHARGE;
    }

    // TODO: Intégrer API météo pour majoration pluie
    // if (isRaining) {
    //   surchargeRate += PRICING_CONFIG.RAIN_SURCHARGE;
    // }

    return Math.round(baseAmount * surchargeRate);
  }

  /**
   * Valide si une commande peut être acceptée
   */
  validateOrder(request: PriceCalculationRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Vérifier la distance maximum
    const distance = this.calculateDistance(
      request.pickupLatitude,
      request.pickupLongitude,
      request.deliveryLatitude,
      request.deliveryLongitude
    );

    if (distance > PRICING_CONFIG.MAX_DISTANCE) {
      errors.push(`Distance trop importante: ${distance.toFixed(1)}km (max: ${PRICING_CONFIG.MAX_DISTANCE}km)`);
    }

    // Vérifier que les coordonnées sont en Côte d'Ivoire
    if (!this.isWithinIvoryCoast(request.pickupLatitude, request.pickupLongitude)) {
      errors.push('L\'adresse de récupération doit être en Côte d\'Ivoire');
    }

    if (!this.isWithinIvoryCoast(request.deliveryLatitude, request.deliveryLongitude)) {
      errors.push('L\'adresse de livraison doit être en Côte d\'Ivoire');
    }

    // Vérifier les articles pour les courses
    if (request.type === OrderType.SHOPPING && (!request.items || request.items.length === 0)) {
      errors.push('Les commandes de courses doivent contenir au moins un article');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Vérifie si des coordonnées sont dans les limites de la Côte d'Ivoire
   */
  private isWithinIvoryCoast(latitude: number, longitude: number): boolean {
    // Limites approximatives de la Côte d'Ivoire
    const bounds = {
      north: 10.74,
      south: 4.34,
      east: -2.49,
      west: -8.60
    };

    return latitude >= bounds.south && 
           latitude <= bounds.north && 
           longitude >= bounds.west && 
           longitude <= bounds.east;
  }

  /**
   * Convertit des degrés en radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Estime le temps de livraison selon la zone d'Abidjan
   */
  estimateDeliveryTime(pickupLat: number, pickupLon: number, deliveryLat: number, deliveryLon: number): number {
    const distance = this.calculateDistance(pickupLat, pickupLon, deliveryLat, deliveryLon);
    
    // Vitesses moyennes selon les zones d'Abidjan
    let avgSpeed = 25; // km/h par défaut
    
    // Zone Plateau (centre-ville) - plus lent
    if (this.isInPlateau(pickupLat, pickupLon) || this.isInPlateau(deliveryLat, deliveryLon)) {
      avgSpeed = 15;
    }
    
    // Zone périphérique - plus rapide
    if (distance > 15) {
      avgSpeed = 35;
    }

    // Temps en minutes + temps d'arrêt
    const travelTime = (distance / avgSpeed) * 60;
    const stopTime = 10; // 10 minutes d'arrêt moyen
    
    return Math.round(travelTime + stopTime);
  }

  /**
   * Vérifie si les coordonnées sont dans le Plateau (centre d'Abidjan)
   */
  private isInPlateau(latitude: number, longitude: number): boolean {
    // Limites approximatives du Plateau
    return latitude >= 5.31 && latitude <= 5.33 && 
           longitude >= -4.03 && longitude <= -4.00;
  }
}
