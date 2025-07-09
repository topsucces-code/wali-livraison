import { 
  DriverProfile, 
  VehicleInfo, 
  DrivingLicense, 
  VehicleInsurance, 
  VehicleRegistration,
  DriverStatus,
  DocumentStatus,
  VehicleType,
  calculateDriverStatus
} from '@/lib/driver-verification';

class DriverService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  private isOnline = true;

  // Données simulées pour le développement
  private mockDriverProfiles: DriverProfile[] = [
    {
      id: '1',
      userId: '2', // Livreur de démonstration
      status: DriverStatus.VERIFIED,
      vehicle: {
        type: VehicleType.MOTO,
        brand: 'Honda',
        model: 'CB 125',
        year: 2020,
        color: 'Rouge',
        registrationNumber: '1234 CI 01',
        engineNumber: 'CB125E123456',
        chassisNumber: 'JH2CB1234567890',
      },
      drivingLicense: {
        number: 'CI123456789',
        category: 'A' as any,
        issueDate: '2020-01-15',
        expiryDate: '2025-01-15',
        issuingAuthority: 'Préfecture d\'Abidjan',
        status: DocumentStatus.APPROVED,
      },
      insurance: {
        policyNumber: 'NSIA2024001234',
        insurer: 'NSIA Assurances',
        startDate: '2024-01-01',
        expiryDate: '2024-12-31',
        coverage: 'THIRD_PARTY' as any,
        status: DocumentStatus.APPROVED,
      },
      registration: {
        certificateNumber: 'CG123456789',
        registrationDate: '2020-02-01',
        ownerName: 'Mamadou Traore',
        isOwner: true,
        status: DocumentStatus.APPROVED,
      },
      experienceYears: 3,
      emergencyContact: {
        name: 'Fatou Traore',
        phone: '+22507654321',
        relationship: 'Épouse',
      },
      verifiedAt: '2024-01-15T10:00:00Z',
      verifiedBy: 'admin1',
      createdAt: '2024-01-10T08:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    }
  ];

  // Créer un profil livreur
  async createDriverProfile(userId: string, vehicleInfo: VehicleInfo): Promise<DriverProfile> {
    try {
      if (this.isOnline) {
        const response = await fetch(`${this.baseUrl}/drivers/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
          body: JSON.stringify({ userId, vehicle: vehicleInfo }),
        });

        if (response.ok) {
          return await response.json();
        }
      }
    } catch (error) {
      console.log('Backend indisponible, utilisation du mode hors ligne');
    }

    // Mode hors ligne - simulation
    return this.simulateCreateDriverProfile(userId, vehicleInfo);
  }

  // Mettre à jour le profil livreur
  async updateDriverProfile(profileId: string, updates: Partial<DriverProfile>): Promise<DriverProfile> {
    try {
      if (this.isOnline) {
        const response = await fetch(`${this.baseUrl}/drivers/profile/${profileId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
          body: JSON.stringify(updates),
        });

        if (response.ok) {
          return await response.json();
        }
      }
    } catch (error) {
      console.log('Backend indisponible, utilisation du mode hors ligne');
    }

    // Mode hors ligne - simulation
    return this.simulateUpdateDriverProfile(profileId, updates);
  }

  // Obtenir le profil livreur par ID utilisateur
  async getDriverProfileByUserId(userId: string): Promise<DriverProfile | null> {
    try {
      if (this.isOnline) {
        const response = await fetch(`${this.baseUrl}/drivers/profile/user/${userId}`, {
          headers: {
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
        });

        if (response.ok) {
          return await response.json();
        }
      }
    } catch (error) {
      console.log('Backend indisponible, utilisation du mode hors ligne');
    }

    // Mode hors ligne - simulation
    return this.simulateGetDriverProfileByUserId(userId);
  }

  // Uploader un document
  async uploadDocument(
    profileId: string, 
    documentType: 'license' | 'insurance' | 'registration',
    file: File
  ): Promise<string> {
    try {
      if (this.isOnline) {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('type', documentType);

        const response = await fetch(`${this.baseUrl}/drivers/profile/${profileId}/documents`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          return result.url;
        }
      }
    } catch (error) {
      console.log('Backend indisponible, utilisation du mode hors ligne');
    }

    // Mode hors ligne - simulation
    return this.simulateUploadDocument(file);
  }

  // Mettre à jour les informations de permis
  async updateDrivingLicense(profileId: string, license: DrivingLicense): Promise<DriverProfile> {
    const updates = { drivingLicense: license };
    return this.updateDriverProfile(profileId, updates);
  }

  // Mettre à jour les informations d'assurance
  async updateInsurance(profileId: string, insurance: VehicleInsurance): Promise<DriverProfile> {
    const updates = { insurance };
    return this.updateDriverProfile(profileId, updates);
  }

  // Mettre à jour les informations de carte grise
  async updateRegistration(profileId: string, registration: VehicleRegistration): Promise<DriverProfile> {
    const updates = { registration };
    return this.updateDriverProfile(profileId, updates);
  }

  // Obtenir les statistiques du livreur
  async getDriverStats(profileId: string): Promise<any> {
    try {
      if (this.isOnline) {
        const response = await fetch(`${this.baseUrl}/drivers/profile/${profileId}/stats`, {
          headers: {
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
        });

        if (response.ok) {
          return await response.json();
        }
      }
    } catch (error) {
      console.log('Backend indisponible, utilisation du mode hors ligne');
    }

    // Mode hors ligne - simulation
    return this.simulateGetDriverStats();
  }

  // Méthodes privées pour les simulations
  private async simulateCreateDriverProfile(userId: string, vehicleInfo: VehicleInfo): Promise<DriverProfile> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newProfile: DriverProfile = {
      id: Date.now().toString(),
      userId,
      status: DriverStatus.INCOMPLETE,
      vehicle: vehicleInfo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.mockDriverProfiles.push(newProfile);
    return newProfile;
  }

  private async simulateUpdateDriverProfile(profileId: string, updates: Partial<DriverProfile>): Promise<DriverProfile> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const profileIndex = this.mockDriverProfiles.findIndex(p => p.id === profileId);
    if (profileIndex === -1) {
      throw new Error('Profil livreur non trouvé');
    }

    const updatedProfile = {
      ...this.mockDriverProfiles[profileIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Recalculer le statut
    updatedProfile.status = calculateDriverStatus(updatedProfile);

    this.mockDriverProfiles[profileIndex] = updatedProfile;
    return updatedProfile;
  }

  private async simulateGetDriverProfileByUserId(userId: string): Promise<DriverProfile | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.mockDriverProfiles.find(p => p.userId === userId) || null;
  }

  private async simulateUploadDocument(file: File): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simuler une URL de document uploadé
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    return `https://storage.wali.ci/documents/${timestamp}.${extension}`;
  }

  private async simulateGetDriverStats(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      totalDeliveries: 156,
      completedDeliveries: 148,
      cancelledDeliveries: 8,
      averageRating: 4.7,
      totalEarnings: 125000,
      thisMonthEarnings: 28000,
      documentsStatus: {
        license: DocumentStatus.APPROVED,
        insurance: DocumentStatus.APPROVED,
        registration: DocumentStatus.APPROVED,
      },
    };
  }

  private getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('wali_access_token');
    }
    return null;
  }
}

export const driverService = new DriverService();
