import { 
  Address, 
  VehicleType, 
  OrderPriority, 
  PricingDetails,
  ABIDJAN_ZONES,
  VEHICLE_PRICING,
  PRIORITY_PRICING,
  calculateDistance 
} from './orders';

// Facteurs de tarification avancée
export interface PricingFactors {
  timeOfDay: number; // Multiplicateur selon l'heure (0.8 à 1.5)
  dayOfWeek: number; // Multiplicateur selon le jour (0.9 à 1.3)
  weather: number; // Multiplicateur météo (1.0 à 1.4)
  traffic: number; // Multiplicateur trafic (1.0 à 1.8)
  demand: number; // Multiplicateur demande (0.8 à 2.0)
  driverAvailability: number; // Multiplicateur disponibilité (1.0 à 1.6)
}

export interface DeliveryTimeEstimate {
  estimatedMinutes: number;
  confidence: number; // 0-100%
  factors: string[];
}

export interface PromotionCode {
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_DELIVERY';
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  validUntil: string;
  usageLimit?: number;
  usedCount: number;
  description: string;
  active: boolean;
}

// Configuration des heures de pointe à Abidjan
export const ABIDJAN_TRAFFIC_PATTERNS = {
  MORNING_RUSH: { start: 7, end: 9, multiplier: 1.6 },
  LUNCH_RUSH: { start: 12, end: 14, multiplier: 1.3 },
  EVENING_RUSH: { start: 17, end: 19, multiplier: 1.8 },
  NIGHT: { start: 22, end: 6, multiplier: 0.9 },
  WEEKEND: { multiplier: 0.95 },
};

// Zones de forte demande selon l'heure
export const DEMAND_ZONES = {
  BUSINESS_HOURS: ['Plateau', 'Treichville'], // 8h-18h
  LUNCH_TIME: ['Plateau', 'Cocody', 'Marcory'], // 12h-14h
  EVENING: ['Cocody', 'Yopougon', 'Adjamé'], // 18h-22h
  WEEKEND: ['Cocody', 'Marcory', 'Port-Bouët'], // Samedi-Dimanche
};

// Conditions météorologiques typiques d'Abidjan
export const WEATHER_FACTORS = {
  CLEAR: 1.0,
  LIGHT_RAIN: 1.1,
  HEAVY_RAIN: 1.4,
  STORM: 1.6, // Rare mais impact fort
  HARMATTAN: 1.05, // Saison sèche avec poussière
};

class AdvancedPricingEngine {
  
  /**
   * Calcule le prix avec tous les facteurs avancés
   */
  calculateAdvancedPrice(
    pickupAddress: Address,
    deliveryAddress: Address,
    vehicleType: VehicleType,
    priority: OrderPriority,
    scheduledTime?: Date,
    promotionCode?: string
  ): PricingDetails & { 
    timeEstimate: DeliveryTimeEstimate;
    appliedFactors: PricingFactors;
    promotion?: { code: string; discount: number; description: string };
  } {
    const baseDistance = calculateDistance(pickupAddress, deliveryAddress);
    const factors = this.calculatePricingFactors(pickupAddress, deliveryAddress, scheduledTime);
    const timeEstimate = this.estimateDeliveryTime(baseDistance, vehicleType, factors);
    
    // Prix de base
    const vehiclePricing = VEHICLE_PRICING[vehicleType];
    const priorityPricing = PRIORITY_PRICING[priority];
    
    const basePrice = vehiclePricing.basePrice;
    const distancePrice = baseDistance * vehiclePricing.pricePerKm;
    const priorityPrice = (basePrice + distancePrice) * (priorityPricing.multiplier - 1);
    
    // Facteurs de zone
    const pickupZoneMultiplier = ABIDJAN_ZONES[pickupAddress.district as keyof typeof ABIDJAN_ZONES]?.multiplier || 1.0;
    const deliveryZoneMultiplier = ABIDJAN_ZONES[deliveryAddress.district as keyof typeof ABIDJAN_ZONES]?.multiplier || 1.0;
    const zonePrice = (basePrice + distancePrice) * Math.max(pickupZoneMultiplier, deliveryZoneMultiplier) - (basePrice + distancePrice);
    
    // Application des facteurs avancés
    const subtotal = basePrice + distancePrice + priorityPrice + zonePrice;
    
    const timeMultiplier = factors.timeOfDay;
    const dayMultiplier = factors.dayOfWeek;
    const weatherMultiplier = factors.weather;
    const trafficMultiplier = factors.traffic;
    const demandMultiplier = factors.demand;
    const availabilityMultiplier = factors.driverAvailability;
    
    const timeAdjustment = subtotal * (timeMultiplier - 1);
    const dayAdjustment = subtotal * (dayMultiplier - 1);
    const weatherAdjustment = subtotal * (weatherMultiplier - 1);
    const trafficAdjustment = subtotal * (trafficMultiplier - 1);
    const demandAdjustment = subtotal * (demandMultiplier - 1);
    const availabilityAdjustment = subtotal * (availabilityMultiplier - 1);
    
    let totalPrice = subtotal + timeAdjustment + dayAdjustment + weatherAdjustment + 
                     trafficAdjustment + demandAdjustment + availabilityAdjustment;
    
    // Application des promotions
    let promotion: { code: string; discount: number; description: string } | undefined;
    if (promotionCode) {
      const promoResult = this.applyPromotionCode(promotionCode, totalPrice);
      if (promoResult) {
        promotion = promoResult;
        totalPrice -= promoResult.discount;
      }
    }
    
    // Prix minimum de sécurité
    totalPrice = Math.max(totalPrice, vehiclePricing.basePrice * 0.8);
    
    const breakdown = [
      { label: 'Prix de base', amount: Math.round(basePrice) },
      { label: `Distance (${baseDistance.toFixed(1)} km)`, amount: Math.round(distancePrice) },
      { label: `Priorité ${priority}`, amount: Math.round(priorityPrice) },
      { label: 'Supplément zone', amount: Math.round(zonePrice) },
      { label: 'Ajustement horaire', amount: Math.round(timeAdjustment) },
      { label: 'Ajustement jour', amount: Math.round(dayAdjustment) },
      { label: 'Conditions météo', amount: Math.round(weatherAdjustment) },
      { label: 'Trafic', amount: Math.round(trafficAdjustment) },
      { label: 'Demande', amount: Math.round(demandAdjustment) },
      { label: 'Disponibilité livreurs', amount: Math.round(availabilityAdjustment) },
    ].filter(item => Math.abs(item.amount) >= 1);
    
    if (promotion) {
      breakdown.push({ 
        label: `Promotion ${promotion.code}`, 
        amount: -Math.round(promotion.discount) 
      });
    }
    
    return {
      basePrice: Math.round(basePrice),
      distancePrice: Math.round(distancePrice),
      priorityPrice: Math.round(priorityPrice),
      vehiclePrice: 0,
      zonePrice: Math.round(zonePrice),
      totalPrice: Math.round(totalPrice),
      currency: 'FCFA',
      breakdown,
      timeEstimate,
      appliedFactors: factors,
      promotion,
    };
  }
  
  /**
   * Calcule tous les facteurs de tarification
   */
  private calculatePricingFactors(
    pickupAddress: Address,
    deliveryAddress: Address,
    scheduledTime?: Date
  ): PricingFactors {
    const now = scheduledTime || new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Dimanche
    
    // Facteur horaire
    const timeOfDay = this.getTimeOfDayMultiplier(hour);
    
    // Facteur jour de la semaine
    const dayOfWeekMultiplier = this.getDayOfWeekMultiplier(dayOfWeek);
    
    // Facteur météo (simulation basée sur la saison)
    const weather = this.getWeatherMultiplier(now);
    
    // Facteur trafic
    const traffic = this.getTrafficMultiplier(hour, dayOfWeek);
    
    // Facteur demande
    const demand = this.getDemandMultiplier(pickupAddress, deliveryAddress, hour, dayOfWeek);
    
    // Facteur disponibilité des livreurs (simulation)
    const driverAvailability = this.getDriverAvailabilityMultiplier(hour, dayOfWeek);
    
    return {
      timeOfDay,
      dayOfWeek: dayOfWeekMultiplier,
      weather,
      traffic,
      demand,
      driverAvailability,
    };
  }
  
  /**
   * Estime le temps de livraison
   */
  private estimateDeliveryTime(
    distance: number,
    vehicleType: VehicleType,
    factors: PricingFactors
  ): DeliveryTimeEstimate {
    // Vitesse de base selon le véhicule (km/h)
    const baseSpeed = {
      [VehicleType.VELO]: 15,
      [VehicleType.MOTO]: 25,
      [VehicleType.SCOOTER]: 20,
      [VehicleType.VOITURE]: 20,
      [VehicleType.TRICYCLE]: 18,
      [VehicleType.CAMIONNETTE]: 15,
    };
    
    const speed = baseSpeed[vehicleType];
    const baseTimeMinutes = (distance / speed) * 60;
    
    // Ajustements selon les facteurs
    const trafficAdjustment = baseTimeMinutes * (factors.traffic - 1);
    const weatherAdjustment = baseTimeMinutes * (factors.weather - 1) * 0.5;
    
    // Temps de préparation et d'attente
    const preparationTime = 10; // 10 minutes de base
    const pickupTime = 5; // 5 minutes pour récupérer
    
    const totalMinutes = baseTimeMinutes + trafficAdjustment + weatherAdjustment + 
                        preparationTime + pickupTime;
    
    // Calcul de la confiance
    const confidence = Math.max(60, Math.min(95, 
      100 - (factors.traffic - 1) * 30 - (factors.weather - 1) * 20
    ));
    
    const factorsList = [];
    if (factors.traffic > 1.2) factorsList.push('Trafic dense');
    if (factors.weather > 1.1) factorsList.push('Conditions météo');
    if (factors.demand > 1.3) factorsList.push('Forte demande');
    if (factors.driverAvailability > 1.2) factorsList.push('Peu de livreurs disponibles');
    
    return {
      estimatedMinutes: Math.round(totalMinutes),
      confidence: Math.round(confidence),
      factors: factorsList,
    };
  }
  
  /**
   * Applique un code promotionnel
   */
  private applyPromotionCode(
    code: string, 
    orderValue: number
  ): { code: string; discount: number; description: string } | null {
    // Codes promotionnels simulés
    const promotions: PromotionCode[] = [
      {
        code: 'WALI2024',
        type: 'PERCENTAGE',
        value: 15,
        minOrderValue: 2000,
        maxDiscount: 1000,
        validUntil: '2024-12-31',
        usageLimit: 1000,
        usedCount: 45,
        description: '15% de réduction (max 1000 FCFA)',
        active: true,
      },
      {
        code: 'NOUVEAU',
        type: 'FIXED_AMOUNT',
        value: 500,
        minOrderValue: 1500,
        validUntil: '2024-12-31',
        usageLimit: 500,
        usedCount: 123,
        description: '500 FCFA de réduction',
        active: true,
      },
      {
        code: 'LIVRAISON',
        type: 'FREE_DELIVERY',
        value: 0,
        minOrderValue: 3000,
        validUntil: '2024-12-31',
        usageLimit: 200,
        usedCount: 67,
        description: 'Livraison gratuite',
        active: true,
      },
    ];
    
    const promotion = promotions.find(p => 
      p.code.toLowerCase() === code.toLowerCase() && 
      p.active &&
      new Date(p.validUntil) > new Date() &&
      (!p.usageLimit || p.usedCount < p.usageLimit) &&
      (!p.minOrderValue || orderValue >= p.minOrderValue)
    );
    
    if (!promotion) return null;
    
    let discount = 0;
    
    switch (promotion.type) {
      case 'PERCENTAGE':
        discount = orderValue * (promotion.value / 100);
        if (promotion.maxDiscount) {
          discount = Math.min(discount, promotion.maxDiscount);
        }
        break;
      case 'FIXED_AMOUNT':
        discount = promotion.value;
        break;
      case 'FREE_DELIVERY':
        // Calcul approximatif du coût de livraison (30% du total)
        discount = orderValue * 0.3;
        break;
    }
    
    return {
      code: promotion.code,
      discount: Math.round(discount),
      description: promotion.description,
    };
  }
  
  // Méthodes privées pour les multiplicateurs
  private getTimeOfDayMultiplier(hour: number): number {
    if (hour >= 7 && hour <= 9) return 1.4; // Matin rush
    if (hour >= 12 && hour <= 14) return 1.2; // Déjeuner
    if (hour >= 17 && hour <= 19) return 1.6; // Soir rush
    if (hour >= 22 || hour <= 6) return 0.9; // Nuit
    return 1.0; // Heures normales
  }
  
  private getDayOfWeekMultiplier(dayOfWeek: number): number {
    if (dayOfWeek === 0 || dayOfWeek === 6) return 0.95; // Weekend
    if (dayOfWeek === 1) return 1.1; // Lundi chargé
    if (dayOfWeek === 5) return 1.05; // Vendredi
    return 1.0; // Mardi-Jeudi
  }
  
  private getWeatherMultiplier(date: Date): number {
    const month = date.getMonth();
    // Saison des pluies à Abidjan (Mai-Octobre)
    if (month >= 4 && month <= 9) {
      return Math.random() > 0.7 ? 1.3 : 1.1; // 30% chance de forte pluie
    }
    // Saison sèche avec harmattan
    if (month === 11 || month === 0 || month === 1) {
      return 1.05; // Poussière et visibilité réduite
    }
    return 1.0; // Temps normal
  }
  
  private getTrafficMultiplier(hour: number, dayOfWeek: number): number {
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return ABIDJAN_TRAFFIC_PATTERNS.WEEKEND.multiplier;
    }
    
    if (hour >= 7 && hour <= 9) return ABIDJAN_TRAFFIC_PATTERNS.MORNING_RUSH.multiplier;
    if (hour >= 12 && hour <= 14) return ABIDJAN_TRAFFIC_PATTERNS.LUNCH_RUSH.multiplier;
    if (hour >= 17 && hour <= 19) return ABIDJAN_TRAFFIC_PATTERNS.EVENING_RUSH.multiplier;
    if (hour >= 22 || hour <= 6) return ABIDJAN_TRAFFIC_PATTERNS.NIGHT.multiplier;
    
    return 1.0;
  }
  
  private getDemandMultiplier(
    pickupAddress: Address,
    deliveryAddress: Address,
    hour: number,
    dayOfWeek: number
  ): number {
    let multiplier = 1.0;
    
    const zones = [pickupAddress.district, deliveryAddress.district];
    
    // Heures de bureau
    if (hour >= 8 && hour <= 18 && dayOfWeek >= 1 && dayOfWeek <= 5) {
      if (zones.some(zone => DEMAND_ZONES.BUSINESS_HOURS.includes(zone))) {
        multiplier += 0.2;
      }
    }
    
    // Heure de déjeuner
    if (hour >= 12 && hour <= 14) {
      if (zones.some(zone => DEMAND_ZONES.LUNCH_TIME.includes(zone))) {
        multiplier += 0.3;
      }
    }
    
    // Soirée
    if (hour >= 18 && hour <= 22) {
      if (zones.some(zone => DEMAND_ZONES.EVENING.includes(zone))) {
        multiplier += 0.2;
      }
    }
    
    // Weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      if (zones.some(zone => DEMAND_ZONES.WEEKEND.includes(zone))) {
        multiplier += 0.15;
      }
    }
    
    return Math.min(multiplier, 2.0); // Cap à 2.0
  }
  
  private getDriverAvailabilityMultiplier(hour: number, dayOfWeek: number): number {
    // Simulation basée sur les patterns typiques
    if (hour >= 22 || hour <= 6) return 1.4; // Nuit - moins de livreurs
    if (hour >= 12 && hour <= 14) return 1.2; // Déjeuner - pause
    if (dayOfWeek === 0) return 1.3; // Dimanche - moins de livreurs
    if (dayOfWeek === 6 && hour >= 18) return 1.1; // Samedi soir
    
    return 1.0;
  }
}

export const advancedPricingEngine = new AdvancedPricingEngine();
