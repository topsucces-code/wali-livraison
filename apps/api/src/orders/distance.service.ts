import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface DistanceResult {
  distance: number; // en kilomètres
  duration: number; // en minutes
  status: 'OK' | 'NOT_FOUND' | 'ZERO_RESULTS' | 'ERROR';
}

@Injectable()
export class DistanceService {
  private readonly logger = new Logger(DistanceService.name);
  private readonly googleMapsApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.googleMapsApiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY') || '';
  }

  /**
   * Calcule la distance et le temps de trajet entre deux points
   * Utilise Google Maps Distance Matrix API pour des résultats précis
   */
  async calculateDistanceAndDuration(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
  ): Promise<DistanceResult> {
    // Si l'API Google Maps n'est pas disponible, utiliser le calcul haversine
    if (!this.googleMapsApiKey) {
      this.logger.warn('Google Maps API non configurée, utilisation du calcul haversine');
      return this.calculateHaversineDistance(originLat, originLng, destLat, destLng);
    }

    try {
      const origin = `${originLat},${originLng}`;
      const destination = `${destLat},${destLng}`;
      
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?` +
        `origins=${origin}&destinations=${destination}` +
        `&mode=driving&language=fr&region=ci` +
        `&traffic_model=best_guess&departure_time=now` +
        `&key=${this.googleMapsApiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.rows.length > 0) {
        const element = data.rows[0].elements[0];
        
        if (element.status === 'OK') {
          const distanceKm = element.distance.value / 1000; // Convertir en km
          const durationMin = Math.ceil(element.duration.value / 60); // Convertir en minutes

          this.logger.log(`Distance calculée via Google Maps: ${distanceKm}km, ${durationMin}min`);

          return {
            distance: Math.round(distanceKm * 100) / 100, // Arrondir à 2 décimales
            duration: durationMin,
            status: 'OK',
          };
        } else {
          this.logger.warn(`Élément non trouvé: ${element.status}`);
          return this.calculateHaversineDistance(originLat, originLng, destLat, destLng);
        }
      } else {
        this.logger.warn(`API Distance Matrix échouée: ${data.status}`);
        return this.calculateHaversineDistance(originLat, originLng, destLat, destLng);
      }
    } catch (error) {
      this.logger.error('Erreur lors du calcul de distance via Google Maps', error);
      return this.calculateHaversineDistance(originLat, originLng, destLat, destLng);
    }
  }

  /**
   * Calcul de distance haversine (à vol d'oiseau) comme fallback
   */
  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): DistanceResult {
    const R = 6371; // Rayon de la Terre en kilomètres
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Estimation du temps basée sur une vitesse moyenne de 25 km/h en ville
    const estimatedDuration = Math.max(15, Math.round((distance / 25) * 60));

    this.logger.log(`Distance calculée via Haversine: ${distance}km, ${estimatedDuration}min`);

    return {
      distance: Math.round(distance * 100) / 100,
      duration: estimatedDuration,
      status: 'OK',
    };
  }

  /**
   * Calcule plusieurs distances en une seule requête (optimisation)
   */
  async calculateMultipleDistances(
    origins: Array<{ lat: number; lng: number }>,
    destinations: Array<{ lat: number; lng: number }>
  ): Promise<DistanceResult[][]> {
    if (!this.googleMapsApiKey) {
      // Fallback: calculer chaque distance individuellement
      const results: DistanceResult[][] = [];
      for (const origin of origins) {
        const row: DistanceResult[] = [];
        for (const dest of destinations) {
          row.push(this.calculateHaversineDistance(origin.lat, origin.lng, dest.lat, dest.lng));
        }
        results.push(row);
      }
      return results;
    }

    try {
      const originsStr = origins.map(o => `${o.lat},${o.lng}`).join('|');
      const destinationsStr = destinations.map(d => `${d.lat},${d.lng}`).join('|');
      
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?` +
        `origins=${originsStr}&destinations=${destinationsStr}` +
        `&mode=driving&language=fr&region=ci` +
        `&key=${this.googleMapsApiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        return data.rows.map((row: any) => 
          row.elements.map((element: any) => {
            if (element.status === 'OK') {
              return {
                distance: Math.round((element.distance.value / 1000) * 100) / 100,
                duration: Math.ceil(element.duration.value / 60),
                status: 'OK' as const,
              };
            } else {
              return {
                distance: 0,
                duration: 0,
                status: 'NOT_FOUND' as const,
              };
            }
          })
        );
      } else {
        throw new Error(`API Distance Matrix failed: ${data.status}`);
      }
    } catch (error) {
      this.logger.error('Erreur lors du calcul de distances multiples', error);
      // Fallback vers calcul individuel
      const results: DistanceResult[][] = [];
      for (const origin of origins) {
        const row: DistanceResult[] = [];
        for (const dest of destinations) {
          row.push(this.calculateHaversineDistance(origin.lat, origin.lng, dest.lat, dest.lng));
        }
        results.push(row);
      }
      return results;
    }
  }

  /**
   * Trouve le livreur le plus proche d'un point donné
   */
  async findNearestDriver(
    pickupLat: number,
    pickupLng: number,
    availableDrivers: Array<{ id: string; lat: number; lng: number }>
  ): Promise<{ driverId: string; distance: number; duration: number } | null> {
    if (availableDrivers.length === 0) {
      return null;
    }

    const origins = [{ lat: pickupLat, lng: pickupLng }];
    const destinations = availableDrivers.map(d => ({ lat: d.lat, lng: d.lng }));

    const results = await this.calculateMultipleDistances(origins, destinations);
    
    if (results.length === 0 || results[0].length === 0) {
      return null;
    }

    let nearestDriver = null;
    let minDistance = Infinity;

    results[0].forEach((result, index) => {
      if (result.status === 'OK' && result.distance < minDistance) {
        minDistance = result.distance;
        nearestDriver = {
          driverId: availableDrivers[index].id,
          distance: result.distance,
          duration: result.duration,
        };
      }
    });

    return nearestDriver;
  }

  /**
   * Vérifie si une livraison est dans la zone de service
   */
  isWithinServiceArea(latitude: number, longitude: number): boolean {
    // Zone de service principale: Grand Abidjan
    const abidjanBounds = {
      north: 5.45,
      south: 5.20,
      east: -3.85,
      west: -4.15
    };

    const isInAbidjan = latitude >= abidjanBounds.south && 
                       latitude <= abidjanBounds.north && 
                       longitude >= abidjanBounds.west && 
                       longitude <= abidjanBounds.east;

    if (isInAbidjan) {
      return true;
    }

    // Autres villes de Côte d'Ivoire (zones étendues)
    const ivoryCoastBounds = {
      north: 10.74,
      south: 4.34,
      east: -2.49,
      west: -8.60
    };

    return latitude >= ivoryCoastBounds.south && 
           latitude <= ivoryCoastBounds.north && 
           longitude >= ivoryCoastBounds.west && 
           longitude <= ivoryCoastBounds.east;
  }

  /**
   * Estime le temps de livraison selon les conditions de trafic
   */
  estimateDeliveryTimeWithTraffic(distance: number, hour: number): number {
    let baseTime = (distance / 25) * 60; // 25 km/h vitesse de base

    // Ajustements selon l'heure (trafic d'Abidjan)
    if (hour >= 7 && hour <= 9) {
      // Heure de pointe matinale
      baseTime *= 1.5;
    } else if (hour >= 17 && hour <= 19) {
      // Heure de pointe du soir
      baseTime *= 1.7;
    } else if (hour >= 12 && hour <= 14) {
      // Pause déjeuner
      baseTime *= 1.2;
    } else if (hour >= 22 || hour <= 5) {
      // Nuit - circulation fluide
      baseTime *= 0.8;
    }

    // Temps minimum de 15 minutes
    return Math.max(15, Math.round(baseTime));
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
