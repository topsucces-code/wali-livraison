'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Truck, 
  Car, 
  Bike, 
  Motorcycle, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  Package
} from 'lucide-react';
import { 
  VehicleType, 
  VehicleInfo, 
  VEHICLE_BRANDS, 
  validateIvorianPlateNumber,
  getVehicleTypeLabel,
  requiresLicense
} from '@/lib/driver-verification';
import { useDriver } from '@/hooks/useDriver';
import { useWaliAuth } from '@/hooks/useWaliAuth';
import Link from 'next/link';

export default function DriverVehicleRegistrationPage() {
  const router = useRouter();
  const { user, isDriver } = useWaliAuth();
  const { createProfile, isLoading } = useDriver();
  
  const [formData, setFormData] = useState<VehicleInfo>({
    type: VehicleType.MOTO,
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    registrationNumber: '',
    engineNumber: '',
    chassisNumber: '',
  });
  
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Redirection si pas livreur
  if (user && !isDriver) {
    router.push('/dashboard');
    return null;
  }

  const vehicleTypeOptions = [
    {
      value: VehicleType.MOTO,
      label: 'Motocyclette',
      icon: Motorcycle,
      description: 'Idéal pour les livraisons rapides en ville',
      requiresLicense: true,
    },
    {
      value: VehicleType.SCOOTER,
      label: 'Scooter',
      icon: Motorcycle,
      description: 'Parfait pour les courtes distances',
      requiresLicense: true,
    },
    {
      value: VehicleType.VELO,
      label: 'Vélo',
      icon: Bike,
      description: 'Écologique et économique',
      requiresLicense: false,
    },
    {
      value: VehicleType.VOITURE,
      label: 'Voiture',
      icon: Car,
      description: 'Pour les gros colis et longues distances',
      requiresLicense: true,
    },
    {
      value: VehicleType.TRICYCLE,
      label: 'Tricycle',
      icon: Truck,
      description: 'Capacité de charge importante',
      requiresLicense: true,
    },
    {
      value: VehicleType.CAMIONNETTE,
      label: 'Camionnette',
      icon: Truck,
      description: 'Pour les livraisons volumineuses',
      requiresLicense: true,
    },
  ];

  const validateField = (field: string, value: string | number) => {
    const errors = { ...validationErrors };
    
    switch (field) {
      case 'brand':
        if (!value || (typeof value === 'string' && value.trim().length < 2)) {
          errors.brand = 'La marque est obligatoire';
        } else {
          delete errors.brand;
        }
        break;
      case 'model':
        if (!value || (typeof value === 'string' && value.trim().length < 2)) {
          errors.model = 'Le modèle est obligatoire';
        } else {
          delete errors.model;
        }
        break;
      case 'color':
        if (!value || (typeof value === 'string' && value.trim().length < 2)) {
          errors.color = 'La couleur est obligatoire';
        } else {
          delete errors.color;
        }
        break;
      case 'registrationNumber':
        if (!value || (typeof value === 'string' && value.trim().length === 0)) {
          errors.registrationNumber = 'Le numéro d\'immatriculation est obligatoire';
        } else if (typeof value === 'string' && !validateIvorianPlateNumber(value)) {
          errors.registrationNumber = 'Format invalide (ex: 1234 CI 01)';
        } else {
          delete errors.registrationNumber;
        }
        break;
      case 'year':
        const currentYear = new Date().getFullYear();
        if (typeof value === 'number' && (value < 1990 || value > currentYear)) {
          errors.year = `L'année doit être entre 1990 et ${currentYear}`;
        } else {
          delete errors.year;
        }
        break;
    }
    
    setValidationErrors(errors);
  };

  const handleInputChange = (field: keyof VehicleInfo, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleVehicleTypeChange = (type: VehicleType) => {
    setFormData(prev => ({ 
      ...prev, 
      type,
      brand: '', // Reset brand when type changes
      model: '',
    }));
    // Clear brand/model errors when type changes
    const errors = { ...validationErrors };
    delete errors.brand;
    delete errors.model;
    setValidationErrors(errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation finale
    const requiredFields = ['brand', 'model', 'color', 'registrationNumber'];
    const missingFields = requiredFields.filter(field => 
      !formData[field as keyof VehicleInfo] || 
      String(formData[field as keyof VehicleInfo]).trim().length === 0
    );
    
    if (missingFields.length > 0) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (Object.keys(validationErrors).length > 0) {
      alert('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    try {
      await createProfile(formData);
      
      // Redirection selon le type de véhicule
      if (requiresLicense(formData.type)) {
        router.push('/driver/register/documents');
      } else {
        router.push('/driver/dashboard');
      }
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  };

  const availableBrands = VEHICLE_BRANDS[formData.type] || [];

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
            Étape 1 : Informations sur votre véhicule
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progression</span>
            <span>1/3</span>
          </div>
          <Progress value={33} className="h-2" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Formulaire principal */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Informations du véhicule</CardTitle>
                <CardDescription>
                  Renseignez les détails de votre véhicule de livraison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Type de véhicule */}
                  <div>
                    <Label className="text-base font-medium">Type de véhicule *</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      {vehicleTypeOptions.map((option) => {
                        const IconComponent = option.icon;
                        return (
                          <div
                            key={option.value}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                              formData.type === option.value
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleVehicleTypeChange(option.value)}
                          >
                            <div className="flex items-start space-x-3">
                              <IconComponent className="h-6 w-6 text-blue-600 mt-1" />
                              <div className="flex-1">
                                <h4 className="font-medium">{option.label}</h4>
                                <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                                {option.requiresLicense && (
                                  <p className="text-xs text-orange-600 mt-1">
                                    ⚠️ Permis de conduire requis
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Marque */}
                  <div>
                    <Label htmlFor="brand">Marque *</Label>
                    <Select value={formData.brand} onValueChange={(value) => handleInputChange('brand', value)}>
                      <SelectTrigger className={validationErrors.brand ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Sélectionnez la marque" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBrands.map((brand) => (
                          <SelectItem key={brand} value={brand}>
                            {brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {validationErrors.brand && (
                      <p className="text-sm text-red-600 mt-1">{validationErrors.brand}</p>
                    )}
                  </div>

                  {/* Modèle et Année */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="model">Modèle *</Label>
                      <Input
                        id="model"
                        placeholder="Ex: CB 125, Corolla, etc."
                        value={formData.model}
                        onChange={(e) => handleInputChange('model', e.target.value)}
                        className={validationErrors.model ? 'border-red-500' : ''}
                      />
                      {validationErrors.model && (
                        <p className="text-sm text-red-600 mt-1">{validationErrors.model}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="year">Année</Label>
                      <Input
                        id="year"
                        type="number"
                        min="1990"
                        max={new Date().getFullYear()}
                        value={formData.year}
                        onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                        className={validationErrors.year ? 'border-red-500' : ''}
                      />
                      {validationErrors.year && (
                        <p className="text-sm text-red-600 mt-1">{validationErrors.year}</p>
                      )}
                    </div>
                  </div>

                  {/* Couleur */}
                  <div>
                    <Label htmlFor="color">Couleur *</Label>
                    <Input
                      id="color"
                      placeholder="Ex: Rouge, Bleu, Noir, etc."
                      value={formData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                      className={validationErrors.color ? 'border-red-500' : ''}
                    />
                    {validationErrors.color && (
                      <p className="text-sm text-red-600 mt-1">{validationErrors.color}</p>
                    )}
                  </div>

                  {/* Numéro d'immatriculation */}
                  <div>
                    <Label htmlFor="registrationNumber">Numéro d'immatriculation *</Label>
                    <Input
                      id="registrationNumber"
                      placeholder="Ex: 1234 CI 01"
                      value={formData.registrationNumber}
                      onChange={(e) => handleInputChange('registrationNumber', e.target.value.toUpperCase())}
                      className={validationErrors.registrationNumber ? 'border-red-500' : ''}
                    />
                    {validationErrors.registrationNumber && (
                      <p className="text-sm text-red-600 mt-1">{validationErrors.registrationNumber}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Format ivoirien : 4 chiffres + CI + 2 chiffres
                    </p>
                  </div>

                  {/* Numéros optionnels */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="engineNumber">Numéro de moteur (optionnel)</Label>
                      <Input
                        id="engineNumber"
                        placeholder="Numéro gravé sur le moteur"
                        value={formData.engineNumber}
                        onChange={(e) => handleInputChange('engineNumber', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="chassisNumber">Numéro de châssis (optionnel)</Label>
                      <Input
                        id="chassisNumber"
                        placeholder="Numéro d'identification du véhicule"
                        value={formData.chassisNumber}
                        onChange={(e) => handleInputChange('chassisNumber', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Boutons */}
                  <div className="flex justify-between pt-6">
                    <Button variant="outline" asChild>
                      <Link href="/auth/register">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour
                      </Link>
                    </Button>
                    
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        'Enregistrement...'
                      ) : (
                        <>
                          Continuer
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar informatif */}
          <div className="space-y-6">
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900">📋 Documents requis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {requiresLicense(formData.type) ? (
                    <>
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <span>Permis de conduire valide</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <span>Assurance véhicule</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <span>Carte grise</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Aucun document requis pour les vélos</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>💡 Conseils</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>• Vérifiez que votre véhicule est en bon état</p>
                <p>• Assurez-vous d'avoir tous les documents à jour</p>
                <p>• Les informations doivent correspondre exactement aux documents officiels</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
