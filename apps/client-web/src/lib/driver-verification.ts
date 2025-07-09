// Types pour l'inscription et vérification des livreurs - Côte d'Ivoire

export enum VehicleType {
  MOTO = 'MOTO',
  VOITURE = 'VOITURE',
  SCOOTER = 'SCOOTER',
  VELO = 'VELO',
  TRICYCLE = 'TRICYCLE',
  CAMIONNETTE = 'CAMIONNETTE',
}

export enum DriverStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION', // En attente de vérification
  VERIFIED = 'VERIFIED', // Vérifié et actif
  SUSPENDED = 'SUSPENDED', // Suspendu
  REJECTED = 'REJECTED', // Rejeté
  INCOMPLETE = 'INCOMPLETE', // Inscription incomplète
}

export enum DocumentStatus {
  NOT_UPLOADED = 'NOT_UPLOADED',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export interface VehicleInfo {
  type: VehicleType;
  brand: string; // Marque (Honda, Yamaha, Toyota, etc.)
  model: string; // Modèle
  year?: number; // Année
  color: string; // Couleur
  registrationNumber: string; // Numéro d'immatriculation CI
  engineNumber?: string; // Numéro de moteur
  chassisNumber?: string; // Numéro de châssis
}

export interface DrivingLicense {
  number: string; // Numéro du permis
  category: LicenseCategory; // Catégorie (A, B, C, etc.)
  issueDate: string; // Date de délivrance
  expiryDate: string; // Date d'expiration
  issuingAuthority: string; // Autorité de délivrance
  photoUrl?: string; // Photo du permis
  status: DocumentStatus;
  rejectionReason?: string;
}

export enum LicenseCategory {
  A = 'A', // Motocyclettes
  A1 = 'A1', // Motocyclettes légères
  B = 'B', // Voitures particulières
  C = 'C', // Poids lourds
  D = 'D', // Transport en commun
  E = 'E', // Remorques
}

export interface VehicleInsurance {
  policyNumber: string; // Numéro de police
  insurer: string; // Compagnie d'assurance
  startDate: string; // Date de début
  expiryDate: string; // Date d'expiration
  coverage: InsuranceCoverage; // Type de couverture
  photoUrl?: string; // Photo de l'attestation
  status: DocumentStatus;
  rejectionReason?: string;
}

export enum InsuranceCoverage {
  THIRD_PARTY = 'THIRD_PARTY', // Responsabilité civile
  COMPREHENSIVE = 'COMPREHENSIVE', // Tous risques
  THIRD_PARTY_FIRE_THEFT = 'THIRD_PARTY_FIRE_THEFT', // RC + Vol/Incendie
}

export interface VehicleRegistration {
  certificateNumber: string; // Numéro de carte grise
  registrationDate: string; // Date d'immatriculation
  ownerName: string; // Nom du propriétaire
  isOwner: boolean; // Le livreur est-il propriétaire ?
  photoUrl?: string; // Photo de la carte grise
  status: DocumentStatus;
  rejectionReason?: string;
}

export interface DriverProfile {
  id: string;
  userId: string; // Référence vers User
  status: DriverStatus;
  
  // Informations véhicule (obligatoires)
  vehicle: VehicleInfo;
  
  // Documents (optionnels à l'inscription, obligatoires pour activation)
  drivingLicense?: DrivingLicense;
  insurance?: VehicleInsurance;
  registration?: VehicleRegistration;
  
  // Informations complémentaires
  experienceYears?: number; // Années d'expérience
  previousCompanies?: string[]; // Entreprises précédentes
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  
  // Statut de vérification
  verificationNotes?: string; // Notes de l'équipe de vérification
  verifiedAt?: string; // Date de vérification
  verifiedBy?: string; // ID de l'administrateur qui a vérifié
  
  // Dates
  createdAt: string;
  updatedAt: string;
}

// Marques de véhicules populaires en Côte d'Ivoire
export const VEHICLE_BRANDS = {
  MOTO: [
    'Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'TVS', 'Bajaj', 
    'Hero', 'Haojue', 'Dayun', 'Lifan', 'Zongshen'
  ],
  VOITURE: [
    'Toyota', 'Honda', 'Nissan', 'Hyundai', 'Kia', 'Volkswagen',
    'Peugeot', 'Renault', 'Ford', 'Chevrolet', 'Mitsubishi'
  ],
  SCOOTER: [
    'Honda', 'Yamaha', 'Peugeot', 'Piaggio', 'Sym', 'Kymco'
  ],
  VELO: [
    'Giant', 'Trek', 'Specialized', 'Cannondale', 'Scott', 'Autre'
  ],
  TRICYCLE: [
    'Bajaj', 'TVS', 'Piaggio', 'Mahindra', 'Autre'
  ],
  CAMIONNETTE: [
    'Toyota', 'Nissan', 'Isuzu', 'Mitsubishi', 'Ford', 'Hyundai'
  ],
};

// Compagnies d'assurance en Côte d'Ivoire
export const INSURANCE_COMPANIES = [
  'NSIA Assurances',
  'Saham Assurance',
  'Allianz Côte d\'Ivoire',
  'AXA Assurances Côte d\'Ivoire',
  'Sunu Assurances',
  'Colina Assurance',
  'Loyale Assurance',
  'Atlantique Assurance',
  'SONAR',
  'Autre',
];

// Validation des documents selon les réglementations ivoiriennes
export const DOCUMENT_REQUIREMENTS = {
  [VehicleType.MOTO]: {
    drivingLicense: { required: true, categories: [LicenseCategory.A, LicenseCategory.A1] },
    insurance: { required: true },
    registration: { required: true },
  },
  [VehicleType.SCOOTER]: {
    drivingLicense: { required: true, categories: [LicenseCategory.A, LicenseCategory.A1] },
    insurance: { required: true },
    registration: { required: true },
  },
  [VehicleType.VOITURE]: {
    drivingLicense: { required: true, categories: [LicenseCategory.B] },
    insurance: { required: true },
    registration: { required: true },
  },
  [VehicleType.CAMIONNETTE]: {
    drivingLicense: { required: true, categories: [LicenseCategory.B, LicenseCategory.C] },
    insurance: { required: true },
    registration: { required: true },
  },
  [VehicleType.TRICYCLE]: {
    drivingLicense: { required: true, categories: [LicenseCategory.A, LicenseCategory.B] },
    insurance: { required: true },
    registration: { required: true },
  },
  [VehicleType.VELO]: {
    drivingLicense: { required: false, categories: [] },
    insurance: { required: false },
    registration: { required: false },
  },
};

// Validation du numéro d'immatriculation ivoirien
export const validateIvorianPlateNumber = (plateNumber: string): boolean => {
  // Format ivoirien : XXXX CI YY (4 chiffres + CI + 2 chiffres)
  // Exemple : 1234 CI 01, 5678 CI 15
  const plateRegex = /^\d{4}\s*CI\s*\d{2}$/i;
  return plateRegex.test(plateNumber.trim());
};

// Validation du numéro de permis ivoirien
export const validateIvorianLicenseNumber = (licenseNumber: string): boolean => {
  // Format approximatif (à adapter selon le format officiel)
  // Généralement 8-12 caractères alphanumériques
  const licenseRegex = /^[A-Z0-9]{8,12}$/i;
  return licenseRegex.test(licenseNumber.trim());
};

// Vérification si un véhicule nécessite un permis
export const requiresLicense = (vehicleType: VehicleType): boolean => {
  return DOCUMENT_REQUIREMENTS[vehicleType].drivingLicense.required;
};

// Vérification si un véhicule nécessite une assurance
export const requiresInsurance = (vehicleType: VehicleType): boolean => {
  return DOCUMENT_REQUIREMENTS[vehicleType].insurance.required;
};

// Calcul du statut global du profil livreur
export const calculateDriverStatus = (profile: DriverProfile): DriverStatus => {
  const vehicleType = profile.vehicle.type;
  const requirements = DOCUMENT_REQUIREMENTS[vehicleType];
  
  // Vérifier si les documents obligatoires sont présents et approuvés
  if (requirements.drivingLicense.required) {
    if (!profile.drivingLicense || profile.drivingLicense.status !== DocumentStatus.APPROVED) {
      return DriverStatus.PENDING_VERIFICATION;
    }
  }
  
  if (requirements.insurance.required) {
    if (!profile.insurance || profile.insurance.status !== DocumentStatus.APPROVED) {
      return DriverStatus.PENDING_VERIFICATION;
    }
  }
  
  if (requirements.registration.required) {
    if (!profile.registration || profile.registration.status !== DocumentStatus.APPROVED) {
      return DriverStatus.PENDING_VERIFICATION;
    }
  }
  
  // Vérifier les dates d'expiration
  const now = new Date();
  
  if (profile.drivingLicense && new Date(profile.drivingLicense.expiryDate) < now) {
    return DriverStatus.SUSPENDED;
  }
  
  if (profile.insurance && new Date(profile.insurance.expiryDate) < now) {
    return DriverStatus.SUSPENDED;
  }
  
  return DriverStatus.VERIFIED;
};

// Messages de statut en français
export const getStatusMessage = (status: DriverStatus): string => {
  switch (status) {
    case DriverStatus.PENDING_VERIFICATION:
      return 'En attente de vérification des documents';
    case DriverStatus.VERIFIED:
      return 'Compte vérifié - Vous pouvez accepter des livraisons';
    case DriverStatus.SUSPENDED:
      return 'Compte suspendu - Documents expirés ou non conformes';
    case DriverStatus.REJECTED:
      return 'Inscription rejetée - Contactez le support';
    case DriverStatus.INCOMPLETE:
      return 'Inscription incomplète - Veuillez compléter votre profil';
    default:
      return 'Statut inconnu';
  }
};

// Messages pour les types de véhicules
export const getVehicleTypeLabel = (type: VehicleType): string => {
  switch (type) {
    case VehicleType.MOTO:
      return 'Motocyclette';
    case VehicleType.VOITURE:
      return 'Voiture particulière';
    case VehicleType.SCOOTER:
      return 'Scooter';
    case VehicleType.VELO:
      return 'Vélo';
    case VehicleType.TRICYCLE:
      return 'Tricycle';
    case VehicleType.CAMIONNETTE:
      return 'Camionnette';
    default:
      return 'Véhicule';
  }
};
