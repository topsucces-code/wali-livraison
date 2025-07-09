'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  Shield, 
  Car,
  Upload,
  ArrowRight,
  Home
} from 'lucide-react';
import Link from 'next/link';

export default function DriverStatusPage() {
  // Données simulées pour la démonstration
  const driverProfile = {
    id: '1',
    status: 'PENDING_VERIFICATION',
    vehicle: {
      type: 'MOTO',
      brand: 'Honda',
      model: 'CB 125',
      color: 'Rouge',
      registrationNumber: '1234 CI 01',
    },
    documents: {
      license: { status: 'PENDING_REVIEW', uploadedAt: '2024-01-15' },
      insurance: { status: 'NOT_UPLOADED', uploadedAt: null },
      registration: { status: 'APPROVED', uploadedAt: '2024-01-14' },
    },
    createdAt: '2024-01-15',
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING_VERIFICATION':
        return {
          label: 'En attente de vérification',
          color: 'bg-yellow-100 text-yellow-800',
          icon: Clock,
          description: 'Votre dossier est en cours de vérification par notre équipe.',
        };
      case 'VERIFIED':
        return {
          label: 'Vérifié',
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle,
          description: 'Votre compte est vérifié ! Vous pouvez accepter des livraisons.',
        };
      case 'SUSPENDED':
        return {
          label: 'Suspendu',
          color: 'bg-red-100 text-red-800',
          icon: AlertCircle,
          description: 'Votre compte est suspendu. Contactez le support.',
        };
      default:
        return {
          label: 'Inconnu',
          color: 'bg-gray-100 text-gray-800',
          icon: AlertCircle,
          description: 'Statut inconnu.',
        };
    }
  };

  const getDocumentStatusInfo = (status: string) => {
    switch (status) {
      case 'NOT_UPLOADED':
        return {
          label: 'Non uploadé',
          color: 'bg-gray-100 text-gray-800',
          icon: Upload,
        };
      case 'PENDING_REVIEW':
        return {
          label: 'En attente',
          color: 'bg-yellow-100 text-yellow-800',
          icon: Clock,
        };
      case 'APPROVED':
        return {
          label: 'Approuvé',
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle,
        };
      case 'REJECTED':
        return {
          label: 'Rejeté',
          color: 'bg-red-100 text-red-800',
          icon: AlertCircle,
        };
      default:
        return {
          label: 'Inconnu',
          color: 'bg-gray-100 text-gray-800',
          icon: AlertCircle,
        };
    }
  };

  const statusInfo = getStatusInfo(driverProfile.status);
  const StatusIcon = statusInfo.icon;

  // Calcul de la progression
  const totalDocuments = 3;
  const approvedDocuments = Object.values(driverProfile.documents).filter(
    doc => doc.status === 'APPROVED'
  ).length;
  const progress = Math.round((approvedDocuments / totalDocuments) * 100);

  const documents = [
    {
      id: 'license',
      name: 'Permis de conduire',
      icon: FileText,
      status: driverProfile.documents.license.status,
      uploadedAt: driverProfile.documents.license.uploadedAt,
    },
    {
      id: 'insurance',
      name: 'Assurance véhicule',
      icon: Shield,
      status: driverProfile.documents.insurance.status,
      uploadedAt: driverProfile.documents.insurance.uploadedAt,
    },
    {
      id: 'registration',
      name: 'Carte grise',
      icon: Car,
      status: driverProfile.documents.registration.status,
      uploadedAt: driverProfile.documents.registration.uploadedAt,
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
          <h1 className="text-3xl font-bold text-gray-900">Statut Livreur</h1>
          <p className="text-gray-600 mt-2">
            Suivi de votre inscription et vérification
          </p>
        </div>

        {/* Statut principal */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${statusInfo.color.replace('text-', 'bg-').replace('800', '200')}`}>
                <StatusIcon className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Statut : {statusInfo.label}
                  </h2>
                  <Badge className={statusInfo.color}>
                    {statusInfo.label}
                  </Badge>
                </div>
                <p className="text-gray-600">{statusInfo.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Véhicule enregistré */}
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Véhicule Enregistré</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-green-900">Type :</span>
                <p className="text-green-700">{driverProfile.vehicle.type}</p>
              </div>
              <div>
                <span className="font-medium text-green-900">Marque :</span>
                <p className="text-green-700">{driverProfile.vehicle.brand}</p>
              </div>
              <div>
                <span className="font-medium text-green-900">Modèle :</span>
                <p className="text-green-700">{driverProfile.vehicle.model}</p>
              </div>
              <div>
                <span className="font-medium text-green-900">Plaque :</span>
                <p className="text-green-700">{driverProfile.vehicle.registrationNumber}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progression des documents */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Progression de la Vérification</CardTitle>
            <CardDescription>
              {approvedDocuments} sur {totalDocuments} documents approuvés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Progression</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
              <p className="text-sm text-gray-600">
                {progress === 100 
                  ? '🎉 Tous vos documents sont approuvés !'
                  : `Il vous reste ${totalDocuments - approvedDocuments} document(s) à faire approuver.`
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Statut des documents */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Documents Requis</CardTitle>
            <CardDescription>
              Statut de vérification de vos documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents.map((doc) => {
                const docStatusInfo = getDocumentStatusInfo(doc.status);
                const DocIcon = doc.icon;
                const StatusIcon = docStatusInfo.icon;
                
                return (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <DocIcon className="h-5 w-5 text-gray-600" />
                      <div>
                        <h4 className="font-medium">{doc.name}</h4>
                        {doc.uploadedAt && (
                          <p className="text-xs text-gray-500">
                            Uploadé le {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusIcon className="h-4 w-4" />
                      <Badge className={docStatusInfo.color}>
                        {docStatusInfo.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Besoin d'aide ?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Notre équipe support est là pour vous aider avec votre inscription.
              </p>
              <Button variant="outline" className="w-full">
                Contacter le Support
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mettre à jour</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Modifiez vos informations ou uploadez de nouveaux documents.
              </p>
              <Button variant="outline" className="w-full">
                Modifier mon Profil
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex justify-center space-x-4">
          <Button variant="outline" asChild>
            <Link href="/wali-dashboard">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
          
          {driverProfile.status === 'VERIFIED' && (
            <Button asChild>
              <Link href="/driver/orders">
                Voir les Commandes
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          )}
        </div>

        {/* Informations importantes */}
        <Card className="mt-8 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <h3 className="font-medium text-blue-900 mb-3">📋 Informations Importantes</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p>• La vérification prend généralement 24-48 heures ouvrables</p>
              <p>• Vous recevrez une notification par email et SMS une fois vérifié</p>
              <p>• Assurez-vous que vos documents sont lisibles et à jour</p>
              <p>• En cas de rejet, vous pourrez re-uploader vos documents</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
