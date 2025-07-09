'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Shield, 
  Car, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  Package,
  Camera,
  X
} from 'lucide-react';
import { 
  DrivingLicense, 
  VehicleInsurance, 
  VehicleRegistration,
  DocumentStatus,
  LicenseCategory,
  InsuranceCoverage,
  INSURANCE_COMPANIES,
  validateIvorianLicenseNumber
} from '@/lib/driver-verification';
import { useDriver } from '@/hooks/useDriver';
import { useWaliAuth } from '@/hooks/useWaliAuth';
import { toast } from 'sonner';
import Link from 'next/link';

export default function DriverDocumentsPage() {
  const router = useRouter();
  const { user, isDriver } = useWaliAuth();
  const { profile, updateDrivingLicense, updateInsurance, updateRegistration, uploadDocument, isLoading } = useDriver();
  
  const [activeTab, setActiveTab] = useState<'license' | 'insurance' | 'registration'>('license');
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  
  const [licenseData, setLicenseData] = useState<DrivingLicense>({
    number: '',
    category: LicenseCategory.A,
    issueDate: '',
    expiryDate: '',
    issuingAuthority: 'Préfecture d\'Abidjan',
    status: DocumentStatus.NOT_UPLOADED,
  });
  
  const [insuranceData, setInsuranceData] = useState<VehicleInsurance>({
    policyNumber: '',
    insurer: '',
    startDate: '',
    expiryDate: '',
    coverage: InsuranceCoverage.THIRD_PARTY,
    status: DocumentStatus.NOT_UPLOADED,
  });
  
  const [registrationData, setRegistrationData] = useState<VehicleRegistration>({
    certificateNumber: '',
    registrationDate: '',
    ownerName: '',
    isOwner: true,
    status: DocumentStatus.NOT_UPLOADED,
  });

  // Redirection si pas livreur ou pas de profil
  useEffect(() => {
    if (user && !isDriver) {
      router.push('/wali-dashboard');
      return;
    }
    
    if (!profile) {
      router.push('/driver/register/vehicle');
      return;
    }
    
    // Charger les données existantes si disponibles
    if (profile.drivingLicense) {
      setLicenseData(profile.drivingLicense);
    }
    if (profile.insurance) {
      setInsuranceData(profile.insurance);
    }
    if (profile.registration) {
      setRegistrationData(profile.registration);
    }
  }, [user, isDriver, profile, router]);

  const handleFileUpload = async (documentType: 'license' | 'insurance' | 'registration', file: File) => {
    if (!file) return;
    
    // Validation du fichier
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    
    if (file.size > maxSize) {
      toast.error('Le fichier ne doit pas dépasser 5MB');
      return;
    }
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format non supporté. Utilisez JPG, PNG ou PDF');
      return;
    }

    try {
      setUploadingDoc(documentType);
      const url = await uploadDocument(documentType, file);
      
      // Mettre à jour les données avec l'URL
      switch (documentType) {
        case 'license':
          setLicenseData(prev => ({ 
            ...prev, 
            photoUrl: url, 
            status: DocumentStatus.PENDING_REVIEW 
          }));
          break;
        case 'insurance':
          setInsuranceData(prev => ({ 
            ...prev, 
            photoUrl: url, 
            status: DocumentStatus.PENDING_REVIEW 
          }));
          break;
        case 'registration':
          setRegistrationData(prev => ({ 
            ...prev, 
            photoUrl: url, 
            status: DocumentStatus.PENDING_REVIEW 
          }));
          break;
      }
      
      toast.success('Document uploadé avec succès !');
    } catch (error) {
      toast.error('Erreur lors de l\'upload du document');
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleSaveLicense = async () => {
    if (!licenseData.number || !licenseData.issueDate || !licenseData.expiryDate) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    if (!validateIvorianLicenseNumber(licenseData.number)) {
      toast.error('Format de numéro de permis invalide');
      return;
    }

    try {
      await updateDrivingLicense(licenseData);
      toast.success('Informations de permis sauvegardées !');
    } catch (error) {
      // Erreur gérée par le hook
    }
  };

  const handleSaveInsurance = async () => {
    if (!insuranceData.policyNumber || !insuranceData.insurer || !insuranceData.startDate || !insuranceData.expiryDate) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await updateInsurance(insuranceData);
      toast.success('Informations d\'assurance sauvegardées !');
    } catch (error) {
      // Erreur gérée par le hook
    }
  };

  const handleSaveRegistration = async () => {
    if (!registrationData.certificateNumber || !registrationData.registrationDate || !registrationData.ownerName) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await updateRegistration(registrationData);
      toast.success('Informations de carte grise sauvegardées !');
    } catch (error) {
      // Erreur gérée par le hook
    }
  };

  const handleFinish = () => {
    toast.success('Inscription terminée ! Votre compte sera vérifié sous 24-48h.');
    router.push('/wali-dashboard');
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const getDocumentStatus = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.NOT_UPLOADED:
        return <Badge variant="secondary">Non uploadé</Badge>;
      case DocumentStatus.PENDING_REVIEW:
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case DocumentStatus.APPROVED:
        return <Badge className="bg-green-100 text-green-800">Approuvé</Badge>;
      case DocumentStatus.REJECTED:
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  const tabs = [
    {
      id: 'license' as const,
      label: 'Permis de conduire',
      icon: FileText,
      status: licenseData.status,
    },
    {
      id: 'insurance' as const,
      label: 'Assurance',
      icon: Shield,
      status: insuranceData.status,
    },
    {
      id: 'registration' as const,
      label: 'Carte grise',
      icon: Car,
      status: registrationData.status,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Package className="h-12 w-12 text-blue-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">WALI</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Inscription Livreur</h1>
          <p className="text-gray-600 mt-2">
            Étape 2 : Documents et vérifications
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progression</span>
            <span>2/3</span>
          </div>
          <Progress value={66} className="h-2" />
        </div>

        {/* Véhicule enregistré */}
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-medium text-green-900">
                  Véhicule enregistré : {profile.vehicle.brand} {profile.vehicle.model}
                </h3>
                <p className="text-sm text-green-700">
                  {profile.vehicle.color} • {profile.vehicle.registrationNumber}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Onglets de documents */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white shadow-sm text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                  {getDocumentStatus(tab.status)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenu des onglets */}
        <Card>
          <CardContent className="p-6">
            
            {/* Permis de conduire */}
            {activeTab === 'license' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Permis de conduire</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="licenseNumber">Numéro de permis *</Label>
                      <Input
                        id="licenseNumber"
                        placeholder="Ex: CI123456789"
                        value={licenseData.number}
                        onChange={(e) => setLicenseData(prev => ({ ...prev, number: e.target.value.toUpperCase() }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="licenseCategory">Catégorie *</Label>
                      <Select 
                        value={licenseData.category} 
                        onValueChange={(value) => setLicenseData(prev => ({ ...prev, category: value as LicenseCategory }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={LicenseCategory.A}>A - Motocyclettes</SelectItem>
                          <SelectItem value={LicenseCategory.A1}>A1 - Motocyclettes légères</SelectItem>
                          <SelectItem value={LicenseCategory.B}>B - Voitures particulières</SelectItem>
                          <SelectItem value={LicenseCategory.C}>C - Poids lourds</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="licenseIssueDate">Date de délivrance *</Label>
                      <Input
                        id="licenseIssueDate"
                        type="date"
                        value={licenseData.issueDate}
                        onChange={(e) => setLicenseData(prev => ({ ...prev, issueDate: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="licenseExpiryDate">Date d'expiration *</Label>
                      <Input
                        id="licenseExpiryDate"
                        type="date"
                        value={licenseData.expiryDate}
                        onChange={(e) => setLicenseData(prev => ({ ...prev, expiryDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Label htmlFor="licenseAuthority">Autorité de délivrance</Label>
                    <Input
                      id="licenseAuthority"
                      value={licenseData.issuingAuthority}
                      onChange={(e) => setLicenseData(prev => ({ ...prev, issuingAuthority: e.target.value }))}
                    />
                  </div>
                  
                  {/* Upload photo */}
                  <div className="mt-6">
                    <Label>Photo du permis</Label>
                    <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {licenseData.photoUrl ? (
                        <div className="space-y-2">
                          <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                          <p className="text-sm text-green-600">Document uploadé</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Camera className="h-8 w-8 text-gray-400 mx-auto" />
                          <p className="text-sm text-gray-600">Cliquez pour uploader une photo</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('license', file);
                        }}
                        className="mt-2"
                        disabled={uploadingDoc === 'license'}
                      />
                      {uploadingDoc === 'license' && (
                        <p className="text-sm text-blue-600 mt-2">Upload en cours...</p>
                      )}
                    </div>
                  </div>
                  
                  <Button onClick={handleSaveLicense} disabled={isLoading} className="w-full">
                    Sauvegarder les informations du permis
                  </Button>
                </div>
              </div>
            )}

            {/* Assurance */}
            {activeTab === 'insurance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Assurance véhicule</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="policyNumber">Numéro de police *</Label>
                      <Input
                        id="policyNumber"
                        placeholder="Ex: NSIA2024001234"
                        value={insuranceData.policyNumber}
                        onChange={(e) => setInsuranceData(prev => ({ ...prev, policyNumber: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="insurer">Compagnie d'assurance *</Label>
                      <Select 
                        value={insuranceData.insurer} 
                        onValueChange={(value) => setInsuranceData(prev => ({ ...prev, insurer: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez" />
                        </SelectTrigger>
                        <SelectContent>
                          {INSURANCE_COMPANIES.map((company) => (
                            <SelectItem key={company} value={company}>
                              {company}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="insuranceStartDate">Date de début *</Label>
                      <Input
                        id="insuranceStartDate"
                        type="date"
                        value={insuranceData.startDate}
                        onChange={(e) => setInsuranceData(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="insuranceExpiryDate">Date d'expiration *</Label>
                      <Input
                        id="insuranceExpiryDate"
                        type="date"
                        value={insuranceData.expiryDate}
                        onChange={(e) => setInsuranceData(prev => ({ ...prev, expiryDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Label htmlFor="coverage">Type de couverture</Label>
                    <Select 
                      value={insuranceData.coverage} 
                      onValueChange={(value) => setInsuranceData(prev => ({ ...prev, coverage: value as InsuranceCoverage }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={InsuranceCoverage.THIRD_PARTY}>Responsabilité civile</SelectItem>
                        <SelectItem value={InsuranceCoverage.THIRD_PARTY_FIRE_THEFT}>RC + Vol/Incendie</SelectItem>
                        <SelectItem value={InsuranceCoverage.COMPREHENSIVE}>Tous risques</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Upload photo */}
                  <div className="mt-6">
                    <Label>Attestation d'assurance</Label>
                    <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {insuranceData.photoUrl ? (
                        <div className="space-y-2">
                          <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                          <p className="text-sm text-green-600">Document uploadé</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Camera className="h-8 w-8 text-gray-400 mx-auto" />
                          <p className="text-sm text-gray-600">Cliquez pour uploader une photo</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('insurance', file);
                        }}
                        className="mt-2"
                        disabled={uploadingDoc === 'insurance'}
                      />
                      {uploadingDoc === 'insurance' && (
                        <p className="text-sm text-blue-600 mt-2">Upload en cours...</p>
                      )}
                    </div>
                  </div>
                  
                  <Button onClick={handleSaveInsurance} disabled={isLoading} className="w-full">
                    Sauvegarder les informations d'assurance
                  </Button>
                </div>
              </div>
            )}

            {/* Carte grise */}
            {activeTab === 'registration' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Carte grise / Certificat d'immatriculation</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="certificateNumber">Numéro de certificat *</Label>
                      <Input
                        id="certificateNumber"
                        placeholder="Ex: CG123456789"
                        value={registrationData.certificateNumber}
                        onChange={(e) => setRegistrationData(prev => ({ ...prev, certificateNumber: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="registrationDate">Date d'immatriculation *</Label>
                      <Input
                        id="registrationDate"
                        type="date"
                        value={registrationData.registrationDate}
                        onChange={(e) => setRegistrationData(prev => ({ ...prev, registrationDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Label htmlFor="ownerName">Nom du propriétaire *</Label>
                    <Input
                      id="ownerName"
                      placeholder="Nom complet du propriétaire"
                      value={registrationData.ownerName}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, ownerName: e.target.value }))}
                    />
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isOwner"
                        checked={registrationData.isOwner}
                        onChange={(e) => setRegistrationData(prev => ({ ...prev, isOwner: e.target.checked }))}
                      />
                      <Label htmlFor="isOwner">Je suis le propriétaire du véhicule</Label>
                    </div>
                  </div>
                  
                  {/* Upload photo */}
                  <div className="mt-6">
                    <Label>Photo de la carte grise</Label>
                    <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {registrationData.photoUrl ? (
                        <div className="space-y-2">
                          <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                          <p className="text-sm text-green-600">Document uploadé</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Camera className="h-8 w-8 text-gray-400 mx-auto" />
                          <p className="text-sm text-gray-600">Cliquez pour uploader une photo</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('registration', file);
                        }}
                        className="mt-2"
                        disabled={uploadingDoc === 'registration'}
                      />
                      {uploadingDoc === 'registration' && (
                        <p className="text-sm text-blue-600 mt-2">Upload en cours...</p>
                      )}
                    </div>
                  </div>
                  
                  <Button onClick={handleSaveRegistration} disabled={isLoading} className="w-full">
                    Sauvegarder les informations de carte grise
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Boutons de navigation */}
        <div className="flex justify-between mt-8">
          <Button variant="outline" asChild>
            <Link href="/driver/register/vehicle">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          
          <Button onClick={handleFinish}>
            Terminer l'inscription
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Information */}
        <Alert className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important :</strong> Votre compte sera vérifié par notre équipe dans les 24-48h. 
            Vous recevrez une notification par email et SMS une fois la vérification terminée.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
