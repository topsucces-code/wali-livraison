import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeocodeResult, ReverseGeocodeResult } from '@wali/shared';

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly googleMapsApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.googleMapsApiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY') || '';
  }

  /**
   * Convertit une adresse en coordonnées GPS
   */
  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    try {
      // Utiliser l'API Google Maps si la clé est disponible
      if (this.googleMapsApiKey) {
        const realResult = await this.getRealGeocodeResult(address);
        if (realResult) {
          return realResult;
        }
      }

      // Fallback vers les coordonnées simulées
      this.logger.warn('Utilisation du géocodage simulé - API Google Maps non disponible');
      return this.getMockGeocodeResult(address);

      const encodedAddress = encodeURIComponent(`${address}, Côte d'Ivoire`);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${this.googleMapsApiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const location = result.geometry.location;

        // Extraire la ville et le quartier des composants d'adresse
        const addressComponents = result.address_components;
        let city = '';
        let district = '';

        for (const component of addressComponents) {
          if (component.types.includes('locality')) {
            city = component.long_name;
          } else if (component.types.includes('sublocality') || component.types.includes('neighborhood')) {
            district = component.long_name;
          }
        }

        return {
          latitude: location.lat,
          longitude: location.lng,
          formattedAddress: result.formatted_address,
          city: city || 'Abidjan',
          district,
          confidence: this.calculateConfidence(result),
        };
      }

      this.logger.warn(`Geocoding failed for address: ${address}`);
      return null;
    } catch (error) {
      this.logger.error(`Error geocoding address: ${address}`, error);
      return null;
    }
  }

  /**
   * Convertit des coordonnées GPS en adresse
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResult | null> {
    try {
      // Utiliser l'API Google Maps si la clé est disponible
      if (this.googleMapsApiKey) {
        const realResult = await this.getRealReverseGeocodeResult(latitude, longitude);
        if (realResult) {
          return realResult;
        }
      }

      // Fallback vers le géocodage inverse simulé
      this.logger.warn('Utilisation du géocodage inverse simulé - API Google Maps non disponible');
      return this.getMockReverseGeocodeResult(latitude, longitude);

      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${this.googleMapsApiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const addressComponents = result.address_components;

        let street = '';
        let city = '';
        let district = '';

        for (const component of addressComponents) {
          if (component.types.includes('route')) {
            street = component.long_name;
          } else if (component.types.includes('street_number')) {
            street = `${component.long_name} ${street}`.trim();
          } else if (component.types.includes('locality')) {
            city = component.long_name;
          } else if (component.types.includes('sublocality') || component.types.includes('neighborhood')) {
            district = component.long_name;
          }
        }

        return {
          street: street || 'Rue inconnue',
          city: city || 'Abidjan',
          district,
          formattedAddress: result.formatted_address,
        };
      }

      this.logger.warn(`Reverse geocoding failed for coordinates: ${latitude}, ${longitude}`);
      return null;
    } catch (error) {
      this.logger.error(`Error reverse geocoding coordinates: ${latitude}, ${longitude}`, error);
      return null;
    }
  }

  /**
   * Calcule la distance entre deux points GPS (en kilomètres)
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en kilomètres
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Arrondir à 2 décimales
  }

  /**
   * Valide si des coordonnées sont dans les limites de la Côte d'Ivoire
   */
  isWithinIvoryCoast(latitude: number, longitude: number): boolean {
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

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private calculateConfidence(result: any): number {
    // Calculer la confiance basée sur le type de résultat
    const locationType = result.geometry.location_type;
    switch (locationType) {
      case 'ROOFTOP':
        return 1.0;
      case 'RANGE_INTERPOLATED':
        return 0.8;
      case 'GEOMETRIC_CENTER':
        return 0.6;
      case 'APPROXIMATE':
        return 0.4;
      default:
        return 0.5;
    }
  }

  private getMockGeocodeResult(address: string): GeocodeResult {
    // Coordonnées simulées pour différents quartiers d'Abidjan
    const mockLocations = {
      'cocody': { lat: 5.3364, lng: -4.0267, district: 'Cocody' },
      'plateau': { lat: 5.3200, lng: -4.0100, district: 'Plateau' },
      'yopougon': { lat: 5.3458, lng: -4.0732, district: 'Yopougon' },
      'adjame': { lat: 5.3667, lng: -4.0167, district: 'Adjamé' },
      'marcory': { lat: 5.2833, lng: -3.9833, district: 'Marcory' },
    };

    const addressLower = address.toLowerCase();
    let location = mockLocations['plateau']; // Par défaut

    for (const [key, value] of Object.entries(mockLocations)) {
      if (addressLower.includes(key)) {
        location = value;
        break;
      }
    }

    return {
      latitude: location.lat,
      longitude: location.lng,
      formattedAddress: `${address}, Abidjan, Côte d'Ivoire`,
      city: 'Abidjan',
      district: location.district,
      confidence: 0.8,
    };
  }

  private getMockReverseGeocodeResult(latitude: number, longitude: number): ReverseGeocodeResult {
    // Déterminer le quartier basé sur les coordonnées
    let district = 'Plateau';
    if (latitude > 5.35) district = 'Cocody';
    else if (longitude < -4.05) district = 'Yopougon';
    else if (latitude < 5.30) district = 'Marcory';

    return {
      street: 'Rue de la République',
      city: 'Abidjan',
      district,
      formattedAddress: `Rue de la République, ${district}, Abidjan, Côte d'Ivoire`,
    };
  }

  /**
   * Utilise l'API Google Maps réelle pour le géocodage
   */
  private async getRealGeocodeResult(address: string): Promise<GeocodeResult | null> {
    try {
      const encodedAddress = encodeURIComponent(`${address}, Côte d'Ivoire`);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${this.googleMapsApiKey}&region=ci&language=fr`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const location = result.geometry.location;

        // Extraire la ville et le quartier des composants d'adresse
        const addressComponents = result.address_components;
        let city = '';
        let district = '';

        for (const component of addressComponents) {
          if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
            city = component.long_name;
          } else if (component.types.includes('sublocality') ||
                     component.types.includes('sublocality_level_1') ||
                     component.types.includes('neighborhood')) {
            district = component.long_name;
          }
        }

        // Vérifier que c'est bien en Côte d'Ivoire
        const isInIvoryCoast = this.isWithinIvoryCoast(location.lat, location.lng);
        if (!isInIvoryCoast) {
          this.logger.warn(`Adresse hors Côte d'Ivoire: ${address}`);
          return null;
        }

        return {
          latitude: location.lat,
          longitude: location.lng,
          formattedAddress: result.formatted_address,
          city: city || 'Abidjan',
          district,
          confidence: this.calculateConfidence(result),
        };
      }

      this.logger.warn(`Géocodage Google Maps échoué pour: ${address} - Status: ${data.status}`);
      return null;
    } catch (error) {
      this.logger.error(`Erreur API Google Maps pour: ${address}`, error);
      return null;
    }
  }

  /**
   * Utilise l'API Google Maps réelle pour le géocodage inverse
   */
  private async getRealReverseGeocodeResult(latitude: number, longitude: number): Promise<ReverseGeocodeResult | null> {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${this.googleMapsApiKey}&region=ci&language=fr`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const addressComponents = result.address_components;

        let street = '';
        let city = '';
        let district = '';

        for (const component of addressComponents) {
          if (component.types.includes('route')) {
            street = component.long_name;
          } else if (component.types.includes('street_number')) {
            street = `${component.long_name} ${street}`.trim();
          } else if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
            city = component.long_name;
          } else if (component.types.includes('sublocality') ||
                     component.types.includes('sublocality_level_1') ||
                     component.types.includes('neighborhood')) {
            district = component.long_name;
          }
        }

        return {
          street: street || 'Rue inconnue',
          city: city || 'Abidjan',
          district,
          formattedAddress: result.formatted_address,
        };
      }

      this.logger.warn(`Géocodage inverse Google Maps échoué pour: ${latitude}, ${longitude} - Status: ${data.status}`);
      return null;
    } catch (error) {
      this.logger.error(`Erreur API Google Maps pour géocodage inverse: ${latitude}, ${longitude}`, error);
      return null;
    }
  }
}
