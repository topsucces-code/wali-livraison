'use client';

import { useState } from 'react';
import { 
  Users, 
  Package, 
  TrendingUp, 
  DollarSign, 
  MapPin,
  Clock,
  Star,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Mock data
const statsData = [
  {
    title: "Commandes Totales",
    value: "2,847",
    change: "+12.5%",
    icon: Package,
    color: "text-blue-600"
  },
  {
    title: "Chiffre d'Affaires",
    value: "1,247,500 FCFA",
    change: "+8.2%",
    icon: DollarSign,
    color: "text-green-600"
  },
  {
    title: "Livreurs Actifs",
    value: "156",
    change: "+3.1%",
    icon: Users,
    color: "text-purple-600"
  },
  {
    title: "Temps Moyen",
    value: "42 min",
    change: "-5.3%",
    icon: Clock,
    color: "text-orange-600"
  }
];

const ordersData = [
  { name: 'Lun', commandes: 45, revenus: 125000 },
  { name: 'Mar', commandes: 52, revenus: 142000 },
  { name: 'Mer', commandes: 38, revenus: 98000 },
  { name: 'Jeu', commandes: 61, revenus: 167000 },
  { name: 'Ven', commandes: 73, revenus: 201000 },
  { name: 'Sam', commandes: 89, revenus: 245000 },
  { name: 'Dim', commandes: 67, revenus: 178000 },
];

const orderTypesData = [
  { name: 'Livraison Colis', value: 45, color: '#3B82F6' },
  { name: 'Repas', value: 35, color: '#10B981' },
  { name: 'Courses', value: 20, color: '#F59E0B' },
];

const recentOrders = [
  {
    id: 'ORD-001',
    client: 'Kouassi Jean',
    type: 'Colis',
    status: 'En cours',
    amount: '15,000 FCFA',
    time: 'Il y a 5 min'
  },
  {
    id: 'ORD-002',
    client: 'Aya Marie',
    type: 'Repas',
    status: 'Livré',
    amount: '8,500 FCFA',
    time: 'Il y a 12 min'
  },
  {
    id: 'ORD-003',
    client: 'Bamba Sekou',
    type: 'Courses',
    status: 'Assigné',
    amount: '32,000 FCFA',
    time: 'Il y a 18 min'
  },
];

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState('7d');

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            Exporter
          </Button>
          <Button size="sm">
            Actualiser
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsData.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className={stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                      {stat.change}
                    </span>
                    {' '}par rapport au mois dernier
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Orders Chart */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Commandes de la Semaine</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={ordersData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="commandes" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Commandes Récentes</CardTitle>
                <CardDescription>
                  Vous avez {recentOrders.length} nouvelles commandes aujourd'hui.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {recentOrders.map((order, index) => (
                    <div key={index} className="flex items-center">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {order.id} - {order.client}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.type} • {order.status}
                        </p>
                      </div>
                      <div className="ml-auto font-medium">
                        {order.amount}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Revenue Chart */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Revenus Hebdomadaires</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={ordersData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="revenus" 
                      stroke="#10B981" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Order Types */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Types de Commandes</CardTitle>
                <CardDescription>
                  Répartition par type de service
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={orderTypesData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {orderTypesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Avancées</CardTitle>
              <CardDescription>
                Analyses détaillées des performances de la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Les analytics avancées seront disponibles dans la prochaine version
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rapports</CardTitle>
              <CardDescription>
                Générez et exportez des rapports détaillés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  La génération de rapports sera disponible dans la prochaine version
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
