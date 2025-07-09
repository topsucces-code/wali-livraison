import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/services/payment.service';
import { PaymentProvider } from '@/lib/payments';

export async function POST(request: NextRequest) {
  try {
    // Récupérer les données du webhook
    const webhookData = await request.json();
    
    // Récupérer la signature pour validation
    const signature = request.headers.get('verif-hash') || '';
    
    console.log('Webhook Flutterwave reçu:', {
      event: webhookData.event,
      txRef: webhookData.data?.tx_ref,
      status: webhookData.data?.status,
    });

    // Traiter le webhook
    const result = await paymentService.handleWebhook(
      PaymentProvider.FLUTTERWAVE,
      webhookData,
      signature
    );

    if (result.success) {
      console.log('Webhook Flutterwave traité avec succès:', result.transactionId);
      
      return NextResponse.json({
        success: true,
        message: 'Webhook traité avec succès',
      });
    } else {
      console.error('Erreur lors du traitement du webhook Flutterwave');
      
      return NextResponse.json(
        {
          success: false,
          message: 'Erreur lors du traitement du webhook',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Erreur webhook Flutterwave:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur serveur',
      },
      { status: 500 }
    );
  }
}

// Méthode GET pour vérification de l'endpoint
export async function GET() {
  return NextResponse.json({
    message: 'Endpoint webhook Flutterwave actif',
    provider: 'Flutterwave',
    timestamp: new Date().toISOString(),
  });
}
