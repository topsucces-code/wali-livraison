'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@wali/shared';

interface AuthFormProps {
  onSuccess?: () => void;
}

type AuthStep = 'phone' | 'register' | 'otp';

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const { register, login, verifyOtp, isLoading, error, clearError } = useAuth();
  
  const [step, setStep] = useState<AuthStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  
  // Données d'inscription
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  const formatPhoneNumber = (value: string) => {
    // Supprimer tous les caractères non numériques
    const numbers = value.replace(/\D/g, '');
    
    // Si ça commence par 0, remplacer par +225
    if (numbers.startsWith('0')) {
      return '+225' + numbers.substring(1);
    }
    
    // Si ça commence par 225, ajouter +
    if (numbers.startsWith('225')) {
      return '+' + numbers;
    }
    
    // Si ça ne commence pas par +225, l'ajouter
    if (!numbers.startsWith('+225')) {
      return '+225' + numbers;
    }
    
    return numbers;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const formattedPhone = formatPhoneNumber(phone);
    
    if (formattedPhone.length !== 13) {
      alert('Veuillez entrer un numéro de téléphone valide (ex: 0701234567)');
      return;
    }

    try {
      // Essayer de se connecter d'abord
      await login({ phone: formattedPhone });
      setPhone(formattedPhone);
      setStep('otp');
      setIsNewUser(false);
    } catch (error) {
      // Si l'utilisateur n'existe pas, passer à l'inscription
      if (error instanceof Error && error.message.includes('Aucun compte trouvé')) {
        setPhone(formattedPhone);
        setStep('register');
        setIsNewUser(true);
      } else {
        console.error('Erreur lors de la connexion:', error);
      }
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!firstName.trim() || !lastName.trim()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await register({
        phone,
        email: email.trim() || undefined,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: UserRole.CLIENT,
      });
      setStep('otp');
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (otp.length !== 6) {
      alert('Veuillez entrer le code à 6 chiffres');
      return;
    }

    try {
      await verifyOtp({ phone, otp });
      onSuccess?.();
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
    }
  };

  const handleBack = () => {
    if (step === 'register' || step === 'otp') {
      setStep('phone');
      setOtp('');
      clearError();
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">WALI Livraison</h1>
        <p className="text-gray-600 mt-2">
          {step === 'phone' && 'Entrez votre numéro de téléphone'}
          {step === 'register' && 'Créez votre compte'}
          {step === 'otp' && 'Vérifiez votre numéro'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {step === 'phone' && (
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Numéro de téléphone
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0701234567"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Format: 07 01 23 45 67 ou +225 07 01 23 45 67
            </p>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
          >
            {isLoading ? 'Vérification...' : 'Continuer'}
          </button>
        </form>
      )}

      {step === 'register' && (
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                Prénom *
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Nom *
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email (optionnel)
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div className="text-sm text-gray-600">
            <p>Numéro: <span className="font-medium">{phone}</span></p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Retour
            </button>
            
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
            >
              {isLoading ? 'Création...' : 'Créer le compte'}
            </button>
          </div>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Un code de vérification a été envoyé au<br />
              <span className="font-medium">{phone}</span>
            </p>
          </div>

          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
              Code de vérification
            </label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-center text-lg tracking-widest"
              maxLength={6}
              required
            />
            <p className="mt-1 text-xs text-gray-500 text-center">
              En mode développement, utilisez le code: 123456
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Retour
            </button>
            
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
            >
              {isLoading ? 'Vérification...' : 'Vérifier'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => isNewUser ? handleRegisterSubmit(new Event('submit') as any) : handlePhoneSubmit(new Event('submit') as any)}
              className="text-sm text-orange-600 hover:text-orange-500"
              disabled={isLoading}
            >
              Renvoyer le code
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
