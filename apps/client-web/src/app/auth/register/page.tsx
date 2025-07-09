'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, User, Mail, Phone, Lock, Loader2, AlertCircle, Package, UserCheck, Truck } from 'lucide-react';
import { useWaliAuth } from '@/hooks/useWaliAuth';
import { validateEmail, validatePhone, validatePassword, formatIvorianPhone, UserRole } from '@/lib/auth';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useWaliAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: UserRole.CLIENT,
    acceptTerms: false,
    acceptPrivacy: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Validation en temps réel
  const validateField = (field: string, value: string) => {
    const errors = { ...validationErrors };
    
    switch (field) {
      case 'firstName':
        if (value && value.length < 2) {
          errors.firstName = 'Le prénom doit contenir au moins 2 caractères';
        } else {
          delete errors.firstName;
        }
        break;
      case 'lastName':
        if (value && value.length < 2) {
          errors.lastName = 'Le nom doit contenir au moins 2 caractères';
        } else {
          delete errors.lastName;
        }
        break;
      case 'email':
        if (value && !validateEmail(value)) {
          errors.email = 'Format d\'email invalide';
        } else {
          delete errors.email;
        }
        break;
      case 'phone':
        if (value && !validatePhone(value)) {
          errors.phone = 'Format de téléphone invalide (ex: +225 01 23 45 67 89)';
        } else {
          delete errors.phone;
        }
        break;
      case 'password':
        const passwordValidation = validatePassword(value);
        if (value && !passwordValidation.isValid) {
          errors.password = passwordValidation.errors[0];
        } else {
          delete errors.password;
        }
        // Vérifier aussi la confirmation si elle existe
        if (formData.confirmPassword && value !== formData.confirmPassword) {
          errors.confirmPassword = 'Les mots de passe ne correspondent pas';
        } else if (formData.confirmPassword && value === formData.confirmPassword) {
          delete errors.confirmPassword;
        }
        break;
      case 'confirmPassword':
        if (value && value !== formData.password) {
          errors.confirmPassword = 'Les mots de passe ne correspondent pas';
        } else {
          delete errors.confirmPassword;
        }
        break;
    }
    
    setValidationErrors(errors);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation finale
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'password', 'confirmPassword'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!formData.acceptTerms) {
      toast.error('Veuillez accepter les conditions d\'utilisation');
      return;
    }

    if (!formData.acceptPrivacy) {
      toast.error('Veuillez accepter la politique de confidentialité');
      return;
    }

    if (Object.keys(validationErrors).length > 0) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    try {
      const registerData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formatIvorianPhone(formData.phone),
        password: formData.password,
        role: formData.role,
        acceptTerms: formData.acceptTerms,
      };

      await register(registerData);

      toast.success('Inscription réussie ! Bienvenue sur WALI Livraison !');

      // Redirection selon le rôle
      if (formData.role === UserRole.DRIVER) {
        router.push('/driver/register/simple');
      } else {
        router.push('/wali-dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur d\'inscription');
    }
  };

  const roleOptions = [
    {
      value: UserRole.CLIENT,
      label: 'Client',
      description: 'Je veux passer des commandes de livraison',
      icon: UserCheck,
    },
    {
      value: UserRole.DRIVER,
      label: 'Livreur',
      description: 'Je veux livrer des commandes et gagner de l\'argent',
      icon: Truck,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        
        {/* Logo et titre */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Package className="h-12 w-12 text-green-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">WALI</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Créer un compte</h1>
          <p className="text-gray-600 mt-2">
            Rejoignez la communauté WALI Livraison
          </p>
        </div>

        {/* Formulaire d'inscription */}
        <Card>
          <CardHeader>
            <CardTitle>Inscription</CardTitle>
            <CardDescription>
              Créez votre compte en quelques minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Type de compte */}
              <div>
                <Label>Type de compte</Label>
                <div className="grid grid-cols-1 gap-3 mt-2">
                  {roleOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <div
                        key={option.value}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.role === option.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, role: option.value }))}
                      >
                        <div className="flex items-center space-x-3">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                          <div>
                            <h4 className="font-medium">{option.label}</h4>
                            <p className="text-sm text-gray-600">{option.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Nom et prénom */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    placeholder="Votre prénom"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={validationErrors.firstName ? 'border-red-500' : ''}
                  />
                  {validationErrors.firstName && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    placeholder="Votre nom"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={validationErrors.lastName ? 'border-red-500' : ''}
                  />
                  {validationErrors.lastName && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Adresse email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={validationErrors.email ? 'border-red-500' : ''}
                />
                {validationErrors.email && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.email}</p>
                )}
              </div>

              {/* Téléphone */}
              <div>
                <Label htmlFor="phone">Numéro de téléphone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+225 01 23 45 67 89"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={validationErrors.phone ? 'border-red-500' : ''}
                />
                {validationErrors.phone && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.phone}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Format ivoirien requis (Orange, MTN, Moov)
                </p>
              </div>

              {/* Mot de passe */}
              <div>
                <Label htmlFor="password">Mot de passe *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Choisissez un mot de passe sécurisé"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`pr-10 ${validationErrors.password ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.password}</p>
                )}
              </div>

              {/* Confirmation mot de passe */}
              <div>
                <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirmez votre mot de passe"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`pr-10 ${validationErrors.confirmPassword ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.confirmPassword}</p>
                )}
              </div>

              {/* Acceptation des conditions */}
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, acceptTerms: checked as boolean }))
                    }
                  />
                  <Label htmlFor="terms" className="text-sm leading-5">
                    J'accepte les{' '}
                    <Link href="/legal/terms" className="text-blue-600 hover:underline">
                      conditions d'utilisation
                    </Link>{' '}
                    de WALI Livraison *
                  </Label>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="privacy"
                    checked={formData.acceptPrivacy}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, acceptPrivacy: checked as boolean }))
                    }
                  />
                  <Label htmlFor="privacy" className="text-sm leading-5">
                    J'accepte la{' '}
                    <Link href="/legal/privacy" className="text-blue-600 hover:underline">
                      politique de confidentialité
                    </Link>{' '}
                    *
                  </Label>
                </div>
              </div>

              {/* Erreur */}
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Bouton d'inscription */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création du compte...
                  </>
                ) : (
                  'Créer mon compte'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lien de connexion */}
        <div className="text-center">
          <p className="text-gray-600">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        </div>

        {/* Retour à l'accueil */}
        <div className="text-center">
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
