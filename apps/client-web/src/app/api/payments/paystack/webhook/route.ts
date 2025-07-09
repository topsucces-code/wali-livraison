import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/services/payment.service';
import { PaymentProvider } from '@/lib/payments';

export async function POST(request: NextRequest) {
  try {
    // Récupérer les données du webhook
    const webhookData = await request.json();
    
    // Récupérer la signature pour validation
    const signature = request.headers.get('x-paystack-signature') || '';
    
    console.log('Webhook Paystack reçu:', {
      event: webhookData.event,
      reference: webhookData.data?.reference,
      status: webhookData.data?.status,
    });

    // Traiter le webhook
    const result = await paymentService.handleWebhook(
      PaymentProvider.PAYSTACK,
      webhookData,
      signature
    );

    if (result.success) {
      console.log('Webhook Paystack traité avec succès:', result.transactionId);
      
      return NextResponse.json({
        success: true,
        message: 'Webhook traité avec succès',
      });
    } else {
      console.error('Erreur lors du traitement du webhook Paystack');
      
      return NextResponse.json(
        {
          success: false,
          message: 'Erreur lors du traitement du webhook',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Erreur webhook Paystack:', error);
    
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
    message: 'Endpoint webhook Paystack actif',
    provider: 'Paystack',
    timestamp: new Date().toISOString(),
  });
}
