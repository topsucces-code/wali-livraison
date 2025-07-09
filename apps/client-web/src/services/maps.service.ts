import { Address } from '@/lib/orders';

export interface RouteCalculation {
  distance: number; // en kilomètres
  duration: number; // en minutes
  polyline: string;
  steps: Array<{
    instruction: string;
    distance: string;
    duration: string;
    startLocation: { lat: number; lng: number };
    endLocation: { lat: number; lng: number };
  }>;
}

export interface GeocodingResult {
  address: string;
  coordinates: { lat: number; lng: number };
  district?: string;
  city?: string;
  placeId?: string;
}

class MapsService {
  private directionsService: google.maps.DirectionsService | null = null;
  private geocoder: google.maps.Geocoder | null = null;
  private placesService: google.maps.places.PlacesService | null = null;

  // Initialisation des services Google Maps
  async initialize(): Promise<void> {
    if (typeof window === 'undefined' || !window.google) {
      throw new Error('Google Maps API non chargée');
    }

    this.directionsService = new google.maps.DirectionsService();
    this.geocoder = new google.maps.Geocoder();
    
    // PlacesService nécessite un élément DOM
    const div = document.createElement('div');
    this.placesService = new google.maps.places.PlacesService(div);
  }

  /**
   * Calcule l'itinéraire entre deux points
   */
  async calculateRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    travelMode: google.maps.TravelMode = google.maps.TravelMode.DRIVING
  ): Promise<RouteCalculation> {
    if (!this.directionsService) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      this.directionsService!.route(
        {
          origin: new google.maps.LatLng(origin.lat, origin.lng),
          destination: new google.maps.LatLng(destination.lat, destination.lng),
          travelMode,
          avoidHighways: false,
          avoidTolls: true,
          optimizeWaypoints: true,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            const route = result.routes[0];
            const leg = route.legs[0];

            const calculation: RouteCalculation = {
              distance: leg.distance?.value ? leg.distance.value / 1000 : 0, // Convertir en km
              duration: leg.duration?.value ? leg.duration.value / 60 : 0, // Convertir en minutes
              polyline: route.overview_polyline,
              steps: leg.steps?.map(step => ({
                instruction: step.instructions,
                distance: step.distance?.text || '',
                duration: step.duration?.text || '',
                startLocation: {
                  lat: step.start_location.lat(),
                  lng: step.start_location.lng(),
                },
                endLocation: {
                  lat: step.end_location.lat(),
                  lng: step.end_location.lng(),
                },
              })) || [],
            };

            resolve(calculation);
          } else {
            reject(new Error(`Erreur de calcul d'itinéraire: ${status}`));
          }
        }
      );
    });
  }

  /**
   * Géocodage : convertit une adresse en coordonnées
   */
  async geocodeAddress(address: string): Promise<GeocodingResult[]> {
    if (!this.geocoder) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      this.geocoder!.geocode(
        { 
          address,
          componentRestrictions: { country: 'CI' }, // Limiter à la Côte d'Ivoire
          bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(5.0, -5.0), // Sud-Ouest d'Abidjan
            new google.maps.LatLng(5.7, -3.5)  // Nord-Est d'Abidjan
          ),
        },
        (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results) {
            const geocodingResults: GeocodingResult[] = results.map(result => {
              const components = result.address_components || [];
              let district = '';
              let city = 'Abidjan';

              // Extraire les composants d'adresse
              components.forEach(component => {
                if (component.types.includes('sublocality') || component.types.includes('neighborhood')) {
                  district = component.long_name;
                } else if (component.types.includes('locality')) {
                  city = component.long_name;
                }
              });

              return {
                address: result.formatted_address,
                coordinates: {
                  lat: result.geometry.location.lat(),
                  lng: result.geometry.location.lng(),
                },
                district,
                city,
                placeId: result.place_id,
              };
            });

            resolve(geocodingResults);
          } else {
            reject(new Error(`Erreur de géocodage: ${status}`));
          }
        }
      );
    });
  }

  /**
   * Géocodage inverse : convertit des coordonnées en adresse
   */
  async reverseGeocode(coordinates: { lat: number; lng: number }): Promise<GeocodingResult | null> {
    if (!this.geocoder) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      this.geocoder!.geocode(
        { location: new google.maps.LatLng(coordinates.lat, coordinates.lng) },
        (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
            const result = results[0];
            const components = result.address_components || [];
            let district = '';
            let city = 'Abidjan';

            // Extraire les composants d'adresse
            components.forEach(component => {
              if (component.types.includes('sublocality') || component.types.includes('neighborhood')) {
                district = component.long_name;
              } else if (component.types.includes('locality')) {
                city = component.long_name;
              }
            });

            resolve({
              address: result.formatted_address,
              coordinates,
              district,
              city,
              placeId: result.place_id,
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  /**
   * Recherche de lieux avec autocomplete
   */
  async searchPlaces(query: string): Promise<GeocodingResult[]> {
    if (!this.placesService) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const autocompleteService = new google.maps.places.AutocompleteService();
      
      autocompleteService.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'ci' },
          types: ['address'],
          bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(5.0, -5.0),
            new google.maps.LatLng(5.7, -3.5)
          ),
        },
        async (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            try {
              const results: GeocodingResult[] = [];
              
              // Obtenir les détails pour chaque prédiction
              for (const prediction of predictions.slice(0, 5)) { // Limiter à 5 résultats
                const details = await this.getPlaceDetails(prediction.place_id);
                if (details) {
                  results.push(details);
                }
              }
              
              resolve(results);
            } catch (error) {
              reject(error);
            }
          } else {
            resolve([]);
          }
        }
      );
    });
  }

  /**
   * Obtenir les détails d'un lieu par son place_id
   */
  private async getPlaceDetails(placeId: string): Promise<GeocodingResult | null> {
    if (!this.placesService) {
      await this.initialize();
    }

    return new Promise((resolve) => {
      this.placesService!.getDetails(
        {
          placeId,
          fields: ['geometry', 'formatted_address', 'address_components'],
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            const components = place.address_components || [];
            let district = '';
            let city = 'Abidjan';

            components.forEach(component => {
              if (component.types.includes('sublocality') || component.types.includes('neighborhood')) {
                district = component.long_name;
              } else if (component.types.includes('locality')) {
                city = component.long_name;
              }
            });

            resolve({
              address: place.formatted_address || '',
              coordinates: {
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0,
              },
              district,
              city,
              placeId,
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  /**
   * Calcule la distance et le temps entre plusieurs adresses
   */
  async calculateMultipleRoutes(addresses: Address[]): Promise<RouteCalculation[]> {
    const routes: RouteCalculation[] = [];
    
    for (let i = 0; i < addresses.length - 1; i++) {
      const origin = addresses[i].coordinates;
      const destination = addresses[i + 1].coordinates;
      
      try {
        const route = await this.calculateRoute(origin, destination);
        routes.push(route);
      } catch (error) {
        console.error(`Erreur de calcul pour le segment ${i}:`, error);
        // Ajouter une route par défaut en cas d'erreur
        routes.push({
          distance: 0,
          duration: 0,
          polyline: '',
          steps: [],
        });
      }
    }
    
    return routes;
  }

  /**
   * Optimise l'ordre des adresses pour minimiser la distance totale
   */
  async optimizeRoute(
    origin: { lat: number; lng: number },
    destinations: { lat: number; lng: number }[],
    returnToOrigin: boolean = false
  ): Promise<{ optimizedOrder: number[]; totalDistance: number; totalDuration: number }> {
    if (!this.directionsService) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const waypoints = destinations.map(dest => ({
        location: new google.maps.LatLng(dest.lat, dest.lng),
        stopover: true,
      }));

      this.directionsService!.route(
        {
          origin: new google.maps.LatLng(origin.lat, origin.lng),
          destination: returnToOrigin 
            ? new google.maps.LatLng(origin.lat, origin.lng)
            : waypoints[waypoints.length - 1].location,
          waypoints: returnToOrigin ? waypoints : waypoints.slice(0, -1),
          optimizeWaypoints: true,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            const route = result.routes[0];
            const waypointOrder = route.waypoint_order || [];
            
            let totalDistance = 0;
            let totalDuration = 0;
            
            route.legs.forEach(leg => {
              totalDistance += leg.distance?.value || 0;
              totalDuration += leg.duration?.value || 0;
            });

            resolve({
              optimizedOrder: waypointOrder,
              totalDistance: totalDistance / 1000, // Convertir en km
              totalDuration: totalDuration / 60, // Convertir en minutes
            });
          } else {
            reject(new Error(`Erreur d'optimisation: ${status}`));
          }
        }
      );
    });
  }
}

export const mapsService = new MapsService();
