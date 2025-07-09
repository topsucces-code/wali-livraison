'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Smartphone, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import {
  PaymentStatus,
  PaymentTransaction,
  PaymentProvider,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  getPaymentInstructions,
  formatAmount,
} from '@/lib/payments';
import { usePayments } from '@/hooks/usePayments';

interface PaymentProcessorProps {
  transactionId: string;
  onPaymentComplete?: (transaction: PaymentTransaction) => void;
  onPaymentFailed?: (transaction: PaymentTransaction) => void;
  className?: string;
}

export function PaymentProcessor({
  transactionId,
  onPaymentComplete,
  onPaymentFailed,
  className = '',
}: PaymentProcessorProps) {
  const { getTransaction, checkPaymentStatus } = usePayments();
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [progress, setProgress] = useState(0);

  // Charger la transaction
  useEffect(() => {
    const tx = getTransaction(transactionId);
    if (tx) {
      setTransaction(tx);
      
      // Calculer le temps restant
      if (tx.expiresAt) {
        const expiresAt = new Date(tx.expiresAt).getTime();
        const now = Date.now();
        const remaining = Math.max(0, expiresAt - now);
        setTimeRemaining(remaining);
      }
    }
  }, [transactionId, getTransaction]);

  // Compte à rebours
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = Math.max(0, prev - 1000);
        
        // Calculer le progrès (inversé car le temps diminue)
        if (transaction?.expiresAt) {
          const totalTime = new Date(transaction.expiresAt).getTime() - new Date(transaction.initiatedAt).getTime();
          const elapsed = totalTime - newTime;
          setProgress((elapsed / totalTime) * 100);
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, transaction]);

  // Vérification automatique du statut
  useEffect(() => {
    if (!transaction || transaction.status === PaymentStatus.COMPLETED || transaction.status === PaymentStatus.FAILED) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const newStatus = await checkPaymentStatus(transactionId);
        
        if (newStatus !== transaction.status) {
          const updatedTransaction = { ...transaction, status: newStatus };
          setTransaction(updatedTransaction);
          
          if (newStatus === PaymentStatus.COMPLETED) {
            onPaymentComplete?.(updatedTransaction);
          } else if (newStatus === PaymentStatus.FAILED) {
            onPaymentFailed?.(updatedTransaction);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut:', error);
      }
    }, 5000); // Vérifier toutes les 5 secondes

    return () => clearInterval(interval);
  }, [transaction, transactionId, checkPaymentStatus, onPaymentComplete, onPaymentFailed]);

  const handleManualCheck = async () => {
    if (!transaction) return;

    try {
      setIsChecking(true);
      const newStatus = await checkPaymentStatus(transactionId);
      
      const updatedTransaction = { ...transaction, status: newStatus };
      setTransaction(updatedTransaction);
      
      if (newStatus === PaymentStatus.COMPLETED) {
        onPaymentComplete?.(updatedTransaction);
      } else if (newStatus === PaymentStatus.FAILED) {
        onPaymentFailed?.(updatedTransaction);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification manuelle:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING:
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case PaymentStatus.PROCESSING:
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case PaymentStatus.COMPLETED:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case PaymentStatus.FAILED:
        return <XCircle className="h-5 w-5 text-red-500" />;
      case PaymentStatus.CANCELLED:
        return <XCircle className="h-5 w-5 text-gray-500" />;
      case PaymentStatus.EXPIRED:
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  if (!transaction) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Transaction non trouvée</h3>
          <p className="text-gray-600">
            Impossible de charger les détails de la transaction.
          </p>
        </CardContent>
      </Card>
    );
  }

  const config = PAYMENT_PROVIDERS[transaction.provider];
  const instructions = getPaymentInstructions(
    transaction.provider, 
    transaction.amount, 
    transaction.metadata?.phoneNumber || ''
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: config.color + '20' }}>
              <span className="text-lg">{config.icon}</span>
            </div>
            <div>
              <CardTitle className="text-lg">{config.displayName}</CardTitle>
              <CardDescription>
                Paiement de {formatAmount(transaction.amount)}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusIcon(transaction.status)}
            <Badge className={PAYMENT_STATUS_COLORS[transaction.status]}>
              {PAYMENT_STATUS_LABELS[transaction.status]}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        
        {/* Barre de progression pour le temps restant */}
        {timeRemaining > 0 && transaction.status === PaymentStatus.PENDING && (
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Temps restant</span>
              <span>{formatTimeRemaining(timeRemaining)}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Instructions de paiement */}
        {transaction.status === PaymentStatus.PENDING && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Instructions de paiement</h4>
            <ol className="space-y-2">
              {instructions.map((instruction, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-700">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Code USSD, URL de paiement ou informations de carte */}
        {transaction.providerData && (
          <div className="space-y-3">
            {transaction.providerData.ussdCode && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900">Code USSD</h5>
                    <p className="text-lg font-mono text-blue-600">{transaction.providerData.ussdCode}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(transaction.providerData.ussdCode)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {transaction.providerData.paymentUrl && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900">
                      {(transaction.provider === PaymentProvider.FLUTTERWAVE || transaction.provider === PaymentProvider.PAYSTACK)
                        ? 'Interface de paiement sécurisée'
                        : 'Lien de paiement'
                      }
                    </h5>
                    <p className="text-sm text-gray-600">
                      {(transaction.provider === PaymentProvider.FLUTTERWAVE || transaction.provider === PaymentProvider.PAYSTACK)
                        ? 'Complétez votre paiement sur la page sécurisée'
                        : 'Cliquez pour ouvrir l\'interface de paiement'
                      }
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(transaction.providerData.paymentUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {transaction.providerData.qrCode && (
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <h5 className="font-medium text-gray-900 mb-3">QR Code</h5>
                <img
                  src={transaction.providerData.qrCode}
                  alt="QR Code de paiement"
                  className="mx-auto w-32 h-32"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Scannez avec votre application mobile
                </p>
              </div>
            )}

            {/* Informations de carte (si paiement par carte) */}
            {transaction.metadata?.cardLast4 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <div>
                    <h5 className="font-medium text-blue-900">Paiement par carte</h5>
                    <p className="text-sm text-blue-700">
                      Carte se terminant par {transaction.metadata.cardLast4}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Détails de la transaction */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Détails de la transaction</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">ID Transaction</span>
              <span className="font-mono">{transaction.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Commande</span>
              <span>{transaction.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Montant</span>
              <span className="font-medium">{formatAmount(transaction.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Initié le</span>
              <span>{new Date(transaction.initiatedAt).toLocaleString('fr-FR')}</span>
            </div>
            {transaction.completedAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">Terminé le</span>
                <span>{new Date(transaction.completedAt).toLocaleString('fr-FR')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Messages d'erreur */}
        {transaction.errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-medium text-red-900">Erreur de paiement</h5>
                <p className="text-sm text-red-700">{transaction.errorMessage}</p>
                {transaction.errorCode && (
                  <p className="text-xs text-red-600 mt-1">Code: {transaction.errorCode}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          {(transaction.status === PaymentStatus.PENDING || transaction.status === PaymentStatus.PROCESSING) && (
            <Button
              variant="outline"
              onClick={handleManualCheck}
              disabled={isChecking}
              className="flex-1"
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Vérifier le statut
            </Button>
          )}

          {transaction.status === PaymentStatus.COMPLETED && (
            <Button className="flex-1" onClick={() => onPaymentComplete?.(transaction)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Continuer
            </Button>
          )}

          {transaction.status === PaymentStatus.FAILED && (
            <Button variant="outline" className="flex-1" onClick={() => onPaymentFailed?.(transaction)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
