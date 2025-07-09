import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const txRef = searchParams.get('tx_ref');
    const transactionId = searchParams.get('transaction_id');

    console.log('Callback Flutterwave reçu:', {
      status,
      txRef,
      transactionId,
    });

    // Construire l'URL de redirection avec les paramètres
    const redirectUrl = new URL('/payments/callback', request.nextUrl.origin);
    redirectUrl.searchParams.set('provider', 'flutterwave');
    redirectUrl.searchParams.set('status', status || 'unknown');
    
    if (txRef) {
      redirectUrl.searchParams.set('reference', txRef);
    }
    
    if (transactionId) {
      redirectUrl.searchParams.set('transaction_id', transactionId);
    }

    // Rediriger vers la page de callback
    return redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Erreur callback Flutterwave:', error);
    
    // Rediriger vers une page d'erreur
    const errorUrl = new URL('/payments/error', request.nextUrl.origin);
    errorUrl.searchParams.set('provider', 'flutterwave');
    errorUrl.searchParams.set('error', 'callback_error');
    
    return redirect(errorUrl.toString());
  }
}
