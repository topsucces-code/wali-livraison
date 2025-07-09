export interface Transaction {
  id: string;
  orderId: string;
  userId: string;
  type: TransactionType;
  method: PaymentMethod;
  amount: number;
  currency: string;
  status: TransactionStatus;
  externalId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export enum TransactionType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  COMMISSION = 'COMMISSION',
  DRIVER_PAYOUT = 'DRIVER_PAYOUT',
  PARTNER_PAYOUT = 'PARTNER_PAYOUT'
}

export enum PaymentMethod {
  CASH = 'CASH',
  STRIPE = 'STRIPE',
  ORANGE_MONEY = 'ORANGE_MONEY',
  MTN_MONEY = 'MTN_MONEY',
  WAVE = 'WAVE'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}
