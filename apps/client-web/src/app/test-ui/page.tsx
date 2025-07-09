'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MapPin, 
  Navigation, 
  Edit, 
  Star, 
  Trash2, 
  Copy, 
  ExternalLink, 
  X,
  Check,
  AlertCircle,
  Heart,
  Settings
} from 'lucide-react';

export default function TestUIPage() {
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [checkboxValue, setCheckboxValue] = useState(false);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            🧪 Test UI - WALI Livraison
          </h1>
          <p className="text-xl text-muted-foreground">
            Validation de Tailwind CSS, Shadcn/ui et du thème WALI
          </p>
        </div>

        {/* Test des Couleurs Tailwind */}
        <Card>
          <CardHeader>
            <CardTitle>🎨 Test des Couleurs Tailwind</CardTitle>
            <CardDescription>Vérification du système de couleurs WALI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-16 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-medium">
                  Primary
                </div>
                <p className="text-sm text-center">Orange WALI</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-secondary rounded-lg flex items-center justify-center text-secondary-foreground font-medium">
                  Secondary
                </div>
                <p className="text-sm text-center">Gris clair</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-destructive rounded-lg flex items-center justify-center text-destructive-foreground font-medium">
                  Destructive
                </div>
                <p className="text-sm text-center">Rouge</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-muted rounded-lg flex items-center justify-center text-muted-foreground font-medium">
                  Muted
                </div>
                <p className="text-sm text-center">Gris neutre</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test des Boutons Shadcn/ui */}
        <Card>
          <CardHeader>
            <CardTitle>🔘 Test des Boutons Shadcn/ui</CardTitle>
            <CardDescription>Toutes les variantes de boutons avec états</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Variantes de boutons */}
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>

              {/* Tailles de boutons */}
              <div className="flex flex-wrap gap-3 items-center">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>

              {/* Boutons avec icônes */}
              <div className="flex flex-wrap gap-3">
                <Button>
                  <MapPin className="w-4 h-4 mr-2" />
                  Géolocaliser
                </Button>
                <Button variant="outline">
                  <Navigation className="w-4 h-4 mr-2" />
                  Ma position
                </Button>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </div>

              {/* États des boutons */}
              <div className="flex flex-wrap gap-3">
                <Button disabled>Disabled</Button>
                <Button className="animate-pulse">Loading...</Button>
                <Button className="wali-gradient">Gradient WALI</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test des Formulaires */}
        <Card>
          <CardHeader>
            <CardTitle>📝 Test des Formulaires</CardTitle>
            <CardDescription>Champs de saisie, sélecteurs et cases à cocher</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="test-input">Input Standard</Label>
                  <Input
                    id="test-input"
                    placeholder="Tapez quelque chose..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test-input-disabled">Input Disabled</Label>
                  <Input
                    id="test-input-disabled"
                    placeholder="Champ désactivé"
                    disabled
                  />
                </div>
              </div>

              {/* Select */}
              <div className="space-y-2">
                <Label>Select Dropdown</Label>
                <Select value={selectValue} onValueChange={setSelectValue}>
                  <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Sélectionner une option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="abidjan">Abidjan</SelectItem>
                    <SelectItem value="bouake">Bouaké</SelectItem>
                    <SelectItem value="yamoussoukro">Yamoussoukro</SelectItem>
                    <SelectItem value="daloa">Daloa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="test-checkbox"
                  checked={checkboxValue}
                  onCheckedChange={setCheckboxValue}
                />
                <Label htmlFor="test-checkbox">
                  Case à cocher avec animation
                </Label>
              </div>

              {/* Résultats */}
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Valeurs actuelles :</h4>
                <ul className="space-y-1 text-sm">
                  <li><strong>Input :</strong> {inputValue || 'Vide'}</li>
                  <li><strong>Select :</strong> {selectValue || 'Aucune sélection'}</li>
                  <li><strong>Checkbox :</strong> {checkboxValue ? 'Coché' : 'Non coché'}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test des Icônes Lucide */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 Test des Icônes Lucide React</CardTitle>
            <CardDescription>Collection d'icônes utilisées dans WALI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
              {[
                { icon: MapPin, name: 'MapPin' },
                { icon: Navigation, name: 'Navigation' },
                { icon: Edit, name: 'Edit' },
                { icon: Star, name: 'Star' },
                { icon: Trash2, name: 'Trash2' },
                { icon: Copy, name: 'Copy' },
                { icon: ExternalLink, name: 'ExternalLink' },
                { icon: X, name: 'X' },
                { icon: Check, name: 'Check' },
                { icon: AlertCircle, name: 'AlertCircle' },
                { icon: Heart, name: 'Heart' },
                { icon: Settings, name: 'Settings' },
              ].map(({ icon: Icon, name }) => (
                <div key={name} className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-muted transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                  <span className="text-xs text-center">{name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Test des Animations et Transitions */}
        <Card>
          <CardHeader>
            <CardTitle>✨ Test des Animations</CardTitle>
            <CardDescription>Animations CSS et transitions Tailwind</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Animations Tailwind */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="h-16 bg-primary rounded-lg animate-pulse flex items-center justify-center text-primary-foreground">
                  Pulse
                </div>
                <div className="h-16 bg-secondary rounded-lg animate-bounce flex items-center justify-center">
                  Bounce
                </div>
                <div className="h-16 bg-destructive rounded-lg animate-spin flex items-center justify-center text-destructive-foreground">
                  <Settings className="w-6 h-6" />
                </div>
                <div className="h-16 bg-muted rounded-lg animate-fade-in flex items-center justify-center">
                  Fade In
                </div>
              </div>

              {/* Hover Effects */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-card border rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
                  <h4 className="font-medium">Hover Shadow</h4>
                  <p className="text-sm text-muted-foreground">Survolez pour voir l'effet</p>
                </div>
                <div className="p-4 bg-card border rounded-lg hover:scale-105 transition-transform cursor-pointer">
                  <h4 className="font-medium">Hover Scale</h4>
                  <p className="text-sm text-muted-foreground">Survolez pour agrandir</p>
                </div>
                <div className="p-4 bg-card border rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                  <h4 className="font-medium">Hover Colors</h4>
                  <p className="text-sm opacity-75">Survolez pour changer</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Responsive */}
        <Card>
          <CardHeader>
            <CardTitle>📱 Test Responsive Design</CardTitle>
            <CardDescription>Adaptation aux différentes tailles d'écran</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-red-100 rounded-lg text-center">
                  <p className="text-sm font-medium">Mobile</p>
                  <p className="text-xs">Toujours visible</p>
                </div>
                <div className="p-4 bg-yellow-100 rounded-lg text-center hidden sm:block">
                  <p className="text-sm font-medium">SM+</p>
                  <p className="text-xs">≥640px</p>
                </div>
                <div className="p-4 bg-green-100 rounded-lg text-center hidden md:block">
                  <p className="text-sm font-medium">MD+</p>
                  <p className="text-xs">≥768px</p>
                </div>
                <div className="p-4 bg-blue-100 rounded-lg text-center hidden lg:block">
                  <p className="text-sm font-medium">LG+</p>
                  <p className="text-xs">≥1024px</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test du Thème WALI */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-primary">🧡 Thème WALI Livraison</CardTitle>
            <CardDescription>Validation du branding et des couleurs personnalisées</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="wali-gradient p-6 rounded-lg text-white text-center">
                <h3 className="text-xl font-bold mb-2">Gradient WALI</h3>
                <p>Dégradé orange personnalisé pour le branding</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border-2 border-primary rounded-lg">
                  <h4 className="font-medium text-primary mb-2">Bordure Primary</h4>
                  <p className="text-sm text-muted-foreground">Utilise la couleur orange WALI</p>
                </div>
                <div className="p-4 wali-shadow rounded-lg bg-card">
                  <h4 className="font-medium mb-2">Ombre WALI</h4>
                  <p className="text-sm text-muted-foreground">Ombre avec teinte orange subtile</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer de Test */}
        <div className="text-center py-8 border-t">
          <p className="text-muted-foreground">
            ✅ Test UI complet - Tailwind CSS, Shadcn/ui et thème WALI fonctionnels !
          </p>
          <Button 
            className="mt-4" 
            onClick={() => window.location.href = '/dashboard'}
          >
            Retour au Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
