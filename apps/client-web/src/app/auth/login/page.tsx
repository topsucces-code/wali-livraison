'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Mail, Phone, Lock, Loader2, AlertCircle, Package } from 'lucide-react';
import { useWaliAuth } from '@/hooks/useWaliAuth';
import { validateEmail, validatePhone } from '@/lib/auth';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useWaliAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    rememberMe: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Validation en temps réel
  const validateField = (field: string, value: string) => {
    const errors = { ...validationErrors };
    
    switch (field) {
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
        if (value && value.length < 6) {
          errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
        } else {
          delete errors.password;
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
    const identifier = loginMethod === 'email' ? formData.email : formData.phone;
    if (!identifier || !formData.password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (Object.keys(validationErrors).length > 0) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    try {
      const credentials = {
        [loginMethod]: identifier,
        password: formData.password,
      };

      await login(credentials);

      toast.success('Connexion réussie !');
      router.push('/wali-dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Erreur de connexion');
    }
  };

  // Comptes de démonstration
  const demoAccounts = [
    {
      type: 'Client',
      email: 'client@wali.ci',
      phone: '+22507123456',
      password: 'password123',
      description: 'Compte client pour passer des commandes',
    },
    {
      type: 'Livreur',
      email: 'livreur@wali.ci',
      phone: '+22501987654',
      password: 'password123',
      description: 'Compte livreur pour accepter des livraisons',
    },
  ];

  const fillDemoAccount = (account: typeof demoAccounts[0]) => {
    setFormData(prev => ({
      ...prev,
      email: account.email,
      phone: account.phone,
      password: account.password,
    }));
    setLoginMethod('email');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Logo et titre */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Package className="h-12 w-12 text-blue-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">WALI</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Connexion</h1>
          <p className="text-gray-600 mt-2">
            Connectez-vous à votre compte WALI Livraison
          </p>
        </div>

        {/* Formulaire de connexion */}
        <Card>
          <CardHeader>
            <CardTitle>Se connecter</CardTitle>
            <CardDescription>
              Utilisez votre email ou numéro de téléphone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Méthode de connexion */}
              <Tabs value={loginMethod} onValueChange={(value) => setLoginMethod(value as 'email' | 'phone')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email" className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </TabsTrigger>
                  <TabsTrigger value="phone" className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>Téléphone</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="email" className="space-y-4">
                  <div>
                    <Label htmlFor="email">Adresse email</Label>
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
                </TabsContent>
                
                <TabsContent value="phone" className="space-y-4">
                  <div>
                    <Label htmlFor="phone">Numéro de téléphone</Label>
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
                  </div>
                </TabsContent>
              </Tabs>

              {/* Mot de passe */}
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Votre mot de passe"
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

              {/* Options */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, rememberMe: checked as boolean }))
                    }
                  />
                  <Label htmlFor="remember" className="text-sm">
                    Se souvenir de moi
                  </Label>
                </div>
                <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">
                  Mot de passe oublié ?
                </Link>
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

              {/* Bouton de connexion */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Comptes de démonstration */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">🧪 Comptes de Démonstration</CardTitle>
            <CardDescription className="text-blue-700">
              Testez l'application avec ces comptes prédéfinis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {demoAccounts.map((account, index) => (
                <div key={index} className="p-3 bg-white rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{account.type}</h4>
                      <p className="text-xs text-gray-600">{account.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {account.email} • {account.phone}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fillDemoAccount(account)}
                    >
                      Utiliser
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lien d'inscription */}
        <div className="text-center">
          <p className="text-gray-600">
            Pas encore de compte ?{' '}
            <Link href="/auth/register" className="text-blue-600 hover:underline font-medium">
              Créer un compte
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
