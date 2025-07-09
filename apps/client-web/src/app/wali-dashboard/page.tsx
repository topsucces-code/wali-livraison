'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Package, 
  MapPin, 
  Clock, 
  CreditCard, 
  Settings, 
  LogOut,
  Plus,
  Truck,
  Users,
  BarChart3,
  Bell
} from 'lucide-react';
import { useWaliAuth } from '@/hooks/useWaliAuth';
import { UserRole } from '@/lib/auth';
import Link from 'next/link';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { NotificationToastContainer } from '@/components/notifications/NotificationToast';
import { useNotifications } from '@/hooks/useNotifications';

export default function WaliDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, isClient, isDriver, isAdmin } = useWaliAuth();
  const { unreadCount } = useNotifications();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.CLIENT:
        return 'bg-blue-100 text-blue-800';
      case UserRole.DRIVER:
        return 'bg-green-100 text-green-800';
      case UserRole.ADMIN:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.CLIENT:
        return 'Client';
      case UserRole.DRIVER:
        return 'Livreur';
      case UserRole.ADMIN:
        return 'Administrateur';
      default:
        return 'Utilisateur';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Données simulées pour la démonstration
  const mockStats = {
    client: {
      totalOrders: 12,
      pendingOrders: 2,
      completedOrders: 10,
      totalSpent: 45000,
    },
    driver: {
      totalDeliveries: 156,
      todayDeliveries: 8,
      earnings: 125000,
      rating: 4.8,
    },
    admin: {
      totalUsers: 1250,
      activeOrders: 45,
      totalRevenue: 2500000,
      newUsers: 23,
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <Package className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">WALI</span>
              </Link>
              <div className="hidden md:block">
                <Badge className={getRoleColor(user.role)}>
                  {getRoleLabel(user.role)}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline ml-2">Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Profil utilisateur */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-lg">
                    {getInitials(user.firstName, user.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Bonjour, {user.firstName} !
                  </h1>
                  <p className="text-gray-600">
                    {user.email} • {user.phone}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge className={getRoleColor(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                    {user.isVerified ? (
                      <Badge className="bg-green-100 text-green-800">Vérifié</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">Non vérifié</Badge>
                    )}
                  </div>
                </div>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Profil
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques selon le rôle */}
        {isClient && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commandes totales</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.client.totalOrders}</div>
                <p className="text-xs text-muted-foreground">+2 ce mois-ci</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En cours</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.client.pendingOrders}</div>
                <p className="text-xs text-muted-foreground">Livraisons en cours</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Terminées</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.client.completedOrders}</div>
                <p className="text-xs text-muted-foreground">Livraisons réussies</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total dépensé</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.client.totalSpent.toLocaleString()} FCFA</div>
                <p className="text-xs text-muted-foreground">Depuis l'inscription</p>
              </CardContent>
            </Card>
          </div>
        )}

        {isDriver && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Livraisons totales</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.driver.totalDeliveries}</div>
                <p className="text-xs text-muted-foreground">Depuis le début</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aujourd'hui</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.driver.todayDeliveries}</div>
                <p className="text-xs text-muted-foreground">Livraisons du jour</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gains totaux</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.driver.earnings.toLocaleString()} FCFA</div>
                <p className="text-xs text-muted-foreground">Revenus cumulés</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Note moyenne</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.driver.rating}/5</div>
                <p className="text-xs text-muted-foreground">Évaluation clients</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {isClient && (
            <>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="h-5 w-5" />
                    <span>Nouvelle commande</span>
                  </CardTitle>
                  <CardDescription>
                    Créer une nouvelle demande de livraison
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" asChild>
                    <Link href="/">
                      Créer une commande
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Mes commandes</span>
                  </CardTitle>
                  <CardDescription>
                    Voir l'historique de vos livraisons
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Voir mes commandes
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {isDriver && (
            <>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Truck className="h-5 w-5" />
                    <span>Commandes disponibles</span>
                  </CardTitle>
                  <CardDescription>
                    Voir les livraisons à accepter
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    Voir les commandes
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Mes livraisons</span>
                  </CardTitle>
                  <CardDescription>
                    Gérer vos livraisons en cours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Mes livraisons
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          <Link href="/payments">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Paiements</span>
                </CardTitle>
                <CardDescription>
                  Gérer vos méthodes de paiement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Voir les paiements
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Mes adresses</span>
              </CardTitle>
              <CardDescription>
                Gérer vos adresses favorites
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Gérer les adresses
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Centre de notifications */}
        <div className="mt-8">
          <NotificationCenter compact={true} />
        </div>
      </div>

      {/* Toast de notifications temps réel */}
      <NotificationToastContainer />
    </div>
  );
}
