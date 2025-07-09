import { renderHook, act } from '@testing-library/react';
import { useAddresses } from '../useAddresses';
import { useAuth } from '../useAuth';

// Mock du hook useAuth
jest.mock('../useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock de fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock de navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
};
Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

describe('useAddresses', () => {
  const mockAuthenticatedFetch = jest.fn();

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      authenticatedFetch: mockAuthenticatedFetch,
      isAuthenticated: true,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      error: null,
    });

    mockAuthenticatedFetch.mockClear();
    mockFetch.mockClear();
    mockGeolocation.getCurrentPosition.mockClear();
  });

  describe('getAddresses', () => {
    it('should fetch addresses successfully', async () => {
      const mockAddresses = [
        {
          id: '1',
          street: 'Rue des Jardins',
          city: 'Abidjan',
          district: 'Cocody',
          latitude: 5.3364,
          longitude: -4.0267,
          isDefault: true,
        },
      ];

      mockAuthenticatedFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAddresses),
      });

      const { result } = renderHook(() => useAddresses());

      let addresses;
      await act(async () => {
        addresses = await result.current.getAddresses();
      });

      expect(addresses).toEqual(mockAddresses);
      expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/addresses'
      );
    });

    it('should handle fetch error', async () => {
      mockAuthenticatedFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: 'Erreur serveur' }),
      });

      const { result } = renderHook(() => useAddresses());

      await act(async () => {
        try {
          await result.current.getAddresses();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Erreur serveur');
        }
      });

      expect(result.current.error).toBe('Erreur serveur');
    });
  });

  describe('createAddress', () => {
    it('should create address successfully', async () => {
      const newAddress = {
        street: 'Nouvelle rue',
        city: 'Abidjan',
        district: 'Plateau',
        latitude: 5.3200,
        longitude: -4.0100,
        isDefault: false,
      };

      const createdAddress = { id: '2', ...newAddress };

      mockAuthenticatedFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createdAddress),
      });

      const { result } = renderHook(() => useAddresses());

      let address;
      await act(async () => {
        address = await result.current.createAddress(newAddress);
      });

      expect(address).toEqual(createdAddress);
      expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/addresses',
        {
          method: 'POST',
          body: JSON.stringify(newAddress),
        }
      );
    });
  });

  describe('updateAddress', () => {
    it('should update address successfully', async () => {
      const updateData = { street: 'Rue modifiée' };
      const updatedAddress = {
        id: '1',
        street: 'Rue modifiée',
        city: 'Abidjan',
        district: 'Cocody',
        latitude: 5.3364,
        longitude: -4.0267,
        isDefault: true,
      };

      mockAuthenticatedFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(updatedAddress),
      });

      const { result } = renderHook(() => useAddresses());

      let address;
      await act(async () => {
        address = await result.current.updateAddress('1', updateData);
      });

      expect(address).toEqual(updatedAddress);
      expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/addresses/1',
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );
    });
  });

  describe('deleteAddress', () => {
    it('should delete address successfully', async () => {
      const deleteResponse = { message: 'Adresse supprimée avec succès' };

      mockAuthenticatedFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(deleteResponse),
      });

      const { result } = renderHook(() => useAddresses());

      let response;
      await act(async () => {
        response = await result.current.deleteAddress('1');
      });

      expect(response).toEqual(deleteResponse);
      expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/addresses/1',
        { method: 'DELETE' }
      );
    });
  });

  describe('getCurrentLocation', () => {
    it('should get current location successfully', async () => {
      const mockPosition = {
        coords: {
          latitude: 5.3364,
          longitude: -4.0267,
        },
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const { result } = renderHook(() => useAddresses());

      let location;
      await act(async () => {
        location = await result.current.getCurrentLocation();
      });

      expect(location).toEqual({
        latitude: 5.3364,
        longitude: -4.0267,
      });
    });

    it('should handle geolocation error', async () => {
      const mockError = {
        code: 1, // PERMISSION_DENIED
        message: 'Permission denied',
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      const { result } = renderHook(() => useAddresses());

      await act(async () => {
        try {
          await result.current.getCurrentLocation();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Permission de géolocalisation refusée');
        }
      });
    });

    it('should handle unsupported geolocation', async () => {
      // Supprimer temporairement geolocation
      const originalGeolocation = global.navigator.geolocation;
      delete (global.navigator as any).geolocation;

      const { result } = renderHook(() => useAddresses());

      await act(async () => {
        try {
          await result.current.getCurrentLocation();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe(
            'La géolocalisation n\'est pas supportée par ce navigateur'
          );
        }
      });

      // Restaurer geolocation
      global.navigator.geolocation = originalGeolocation;
    });
  });

  describe('geocodeAddress', () => {
    it('should geocode address successfully', async () => {
      const geocodeResult = {
        latitude: 5.3364,
        longitude: -4.0267,
        formattedAddress: 'Rue des Jardins, Cocody, Abidjan, Côte d\'Ivoire',
        city: 'Abidjan',
        district: 'Cocody',
        confidence: 0.8,
      };

      mockAuthenticatedFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(geocodeResult),
      });

      const { result } = renderHook(() => useAddresses());

      let result_geocode;
      await act(async () => {
        result_geocode = await result.current.geocodeAddress('Rue des Jardins, Cocody');
      });

      expect(result_geocode).toEqual(geocodeResult);
      expect(mockAuthenticatedFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/addresses/geocode',
        {
          method: 'POST',
          body: JSON.stringify({ address: 'Rue des Jardins, Cocody' }),
        }
      );
    });
  });
});
