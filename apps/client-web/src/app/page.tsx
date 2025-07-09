'use client';

import Link from 'next/link';
import { MapPin, Package, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PriceCalculator } from '@/components/price-calculator';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">WALI Livraison</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-500 hover:text-gray-900">Accueil</a>
              <a href="#" className="text-gray-500 hover:text-gray-900">Services</a>
              <a href="#" className="text-gray-500 hover:text-gray-900">Tarifs</a>
              <a href="#" className="text-gray-500 hover:text-gray-900">Contact</a>
            </nav>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => window.location.href = '/auth'}>
                Connexion
              </Button>
              <Button onClick={() => window.location.href = '/auth'}>
                Inscription
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl">
              Livraison rapide et fiable
              <span className="text-blue-600"> en Côte d'Ivoire</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Envoyez vos colis, commandez vos repas ou faites vos courses. 
              WALI Livraison vous connecte avec des livreurs de confiance partout en Côte d'Ivoire.
            </p>
            
            {/* Statistiques */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">1000+</div>
                <div className="text-sm text-gray-600">Livraisons réussies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">30min</div>
                <div className="text-sm text-gray-600">Temps moyen</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">24/7</div>
                <div className="text-sm text-gray-600">Service disponible</div>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/login">
                Se connecter
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/register">
                Créer un compte
              </Link>
            </Button>
          </div>

          {/* Calculateur de Prix Principal */}
          <div className="mt-16">
            <PriceCalculator onPriceCalculated={(result) => {
              console.log('Prix calculé:', result);
            }} />
          </div>

          {/* Services */}
          <div className="mt-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Nos Services</h2>
              <p className="text-gray-600">Découvrez tous nos services de livraison</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <span>Livraison Express</span>
                  </CardTitle>
                  <CardDescription>
                    Envoyez vos colis rapidement partout en Côte d'Ivoire
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Livraison en 30-60 minutes</li>
                    <li>• Suivi en temps réel</li>
                    <li>• Paiement mobile intégré</li>
                    <li>• À partir de 1000 FCFA</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-gray-200 opacity-60">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>🍽️</span>
                    <span>Livraison de Repas</span>
                  </CardTitle>
                  <CardDescription>
                    Commandez vos plats préférés (Bientôt disponible)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Restaurants partenaires</li>
                    <li>• Livraison chaude garantie</li>
                    <li>• Menu varié</li>
                    <li>• Bientôt disponible</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-gray-200 opacity-60">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>🛒</span>
                    <span>Courses et Achats</span>
                  </CardTitle>
                  <CardDescription>
                    Faites vos courses sans vous déplacer (Bientôt disponible)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Supermarchés partenaires</li>
                    <li>• Produits frais</li>
                    <li>• Liste de courses</li>
                    <li>• Bientôt disponible</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Pourquoi choisir WALI Livraison ?
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Une plateforme moderne adaptée aux réalités ivoiriennes
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900">Livraison Rapide</h3>
                <p className="mt-2 text-base text-gray-500">
                  Livraison en moins de 2 heures dans Abidjan et les grandes villes
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                  <MapPin className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900">Suivi en Temps Réel</h3>
                <p className="mt-2 text-base text-gray-500">
                  Suivez votre livreur en direct sur la carte jusqu'à la livraison
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                  <Star className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900">Livreurs Vérifiés</h3>
                <p className="mt-2 text-base text-gray-500">
                  Tous nos livreurs sont vérifiés et notés par la communauté
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center">
              <Package className="h-8 w-8 text-blue-400" />
              <span className="ml-2 text-xl font-bold text-white">WALI Livraison</span>
            </div>
            <p className="mt-4 text-gray-400">
              Votre partenaire de confiance pour la livraison en Côte d'Ivoire
            </p>
            <div className="mt-6 flex justify-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-white">
                Conditions d'utilisation
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                Politique de confidentialité
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                Contact
              </a>
            </div>
            <p className="mt-6 text-gray-400 text-sm">
              © 2025 WALI Livraison. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
