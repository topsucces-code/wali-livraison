import { useState, useEffect, useCallback } from 'react';
import { 
  DriverProfile, 
  VehicleInfo, 
  DrivingLicense, 
  VehicleInsurance, 
  VehicleRegistration,
  DriverStatus,
  DocumentStatus,
  getStatusMessage
} from '@/lib/driver-verification';
import { driverService } from '@/services/driver.service';
import { useWaliAuth } from './useWaliAuth';
import { toast } from 'sonner';

interface UseDriverReturn {
  // État
  profile: DriverProfile | null;
  isLoading: boolean;
  error: string | null;
  stats: any;

  // Actions
  createProfile: (vehicleInfo: VehicleInfo) => Promise<void>;
  updateProfile: (updates: Partial<DriverProfile>) => Promise<void>;
  updateDrivingLicense: (license: DrivingLicense) => Promise<void>;
  updateInsurance: (insurance: VehicleInsurance) => Promise<void>;
  updateRegistration: (registration: VehicleRegistration) => Promise<void>;
  uploadDocument: (documentType: 'license' | 'insurance' | 'registration', file: File) => Promise<string>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;

  // Utilitaires
  canAcceptOrders: boolean;
  statusMessage: string;
  missingDocuments: string[];
  documentsProgress: number;
}

export const useDriver = (): UseDriverReturn => {
  const { user } = useWaliAuth();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  // Charger le profil livreur
  const loadProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const driverProfile = await driverService.getDriverProfileByUserId(user.id);
      setProfile(driverProfile);
      
      if (driverProfile) {
        const driverStats = await driverService.getDriverStats(driverProfile.id);
        setStats(driverStats);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du profil');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Charger le profil au montage
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Créer un profil livreur
  const createProfile = useCallback(async (vehicleInfo: VehicleInfo) => {
    if (!user?.id) {
      throw new Error('Utilisateur non connecté');
    }

    setIsLoading(true);
    setError(null);

    try {
      const newProfile = await driverService.createDriverProfile(user.id, vehicleInfo);
      setProfile(newProfile);
      toast.success('Profil livreur créé avec succès !');
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la création du profil';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Mettre à jour le profil
  const updateProfile = useCallback(async (updates: Partial<DriverProfile>) => {
    if (!profile) {
      throw new Error('Aucun profil livreur trouvé');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedProfile = await driverService.updateDriverProfile(profile.id, updates);
      setProfile(updatedProfile);
      toast.success('Profil mis à jour avec succès !');
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la mise à jour';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  // Mettre à jour le permis de conduire
  const updateDrivingLicense = useCallback(async (license: DrivingLicense) => {
    if (!profile) {
      throw new Error('Aucun profil livreur trouvé');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedProfile = await driverService.updateDrivingLicense(profile.id, license);
      setProfile(updatedProfile);
      toast.success('Informations de permis mises à jour !');
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la mise à jour du permis';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  // Mettre à jour l'assurance
  const updateInsurance = useCallback(async (insurance: VehicleInsurance) => {
    if (!profile) {
      throw new Error('Aucun profil livreur trouvé');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedProfile = await driverService.updateInsurance(profile.id, insurance);
      setProfile(updatedProfile);
      toast.success('Informations d\'assurance mises à jour !');
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la mise à jour de l\'assurance';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  // Mettre à jour la carte grise
  const updateRegistration = useCallback(async (registration: VehicleRegistration) => {
    if (!profile) {
      throw new Error('Aucun profil livreur trouvé');
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedProfile = await driverService.updateRegistration(profile.id, registration);
      setProfile(updatedProfile);
      toast.success('Informations de carte grise mises à jour !');
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la mise à jour de la carte grise';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  // Uploader un document
  const uploadDocument = useCallback(async (
    documentType: 'license' | 'insurance' | 'registration', 
    file: File
  ): Promise<string> => {
    if (!profile) {
      throw new Error('Aucun profil livreur trouvé');
    }

    setError(null);

    try {
      const url = await driverService.uploadDocument(profile.id, documentType, file);
      toast.success('Document uploadé avec succès !');
      return url;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'upload du document';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [profile]);

  // Rafraîchir le profil
  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  // Effacer l'erreur
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Calculer si le livreur peut accepter des commandes
  const canAcceptOrders = profile?.status === DriverStatus.VERIFIED;

  // Message de statut
  const statusMessage = profile ? getStatusMessage(profile.status) : '';

  // Documents manquants
  const missingDocuments = profile ? getMissingDocuments(profile) : [];

  // Progression des documents (pourcentage)
  const documentsProgress = profile ? calculateDocumentsProgress(profile) : 0;

  return {
    // État
    profile,
    isLoading,
    error,
    stats,

    // Actions
    createProfile,
    updateProfile,
    updateDrivingLicense,
    updateInsurance,
    updateRegistration,
    uploadDocument,
    refreshProfile,
    clearError,

    // Utilitaires
    canAcceptOrders,
    statusMessage,
    missingDocuments,
    documentsProgress,
  };
};

// Utilitaires privés
function getMissingDocuments(profile: DriverProfile): string[] {
  const missing: string[] = [];
  
  // Vérifier selon le type de véhicule
  const vehicleType = profile.vehicle.type;
  
  if (vehicleType !== 'VELO') {
    if (!profile.drivingLicense || profile.drivingLicense.status === DocumentStatus.NOT_UPLOADED) {
      missing.push('Permis de conduire');
    }
    
    if (!profile.insurance || profile.insurance.status === DocumentStatus.NOT_UPLOADED) {
      missing.push('Assurance véhicule');
    }
    
    if (!profile.registration || profile.registration.status === DocumentStatus.NOT_UPLOADED) {
      missing.push('Carte grise');
    }
  }
  
  return missing;
}

function calculateDocumentsProgress(profile: DriverProfile): number {
  const vehicleType = profile.vehicle.type;
  
  if (vehicleType === 'VELO') {
    return 100; // Pas de documents requis pour les vélos
  }
  
  let totalDocuments = 3; // permis, assurance, carte grise
  let completedDocuments = 0;
  
  if (profile.drivingLicense && profile.drivingLicense.status === DocumentStatus.APPROVED) {
    completedDocuments++;
  }
  
  if (profile.insurance && profile.insurance.status === DocumentStatus.APPROVED) {
    completedDocuments++;
  }
  
  if (profile.registration && profile.registration.status === DocumentStatus.APPROVED) {
    completedDocuments++;
  }
  
  return Math.round((completedDocuments / totalDocuments) * 100);
}
