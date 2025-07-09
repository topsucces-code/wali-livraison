import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsOptional, 
  IsEnum, 
  IsDateString,
  MaxLength
} from 'class-validator';
import { OrderStatus } from '@wali/shared';

export class UpdateOrderDto {
  @ApiProperty({
    description: 'Nouveau statut de la commande',
    enum: OrderStatus,
    example: OrderStatus.CONFIRMED,
    required: false
  })
  @IsOptional()
  @IsEnum(OrderStatus, { 
    message: 'Le statut doit être PENDING, CONFIRMED, ASSIGNED, PICKED_UP, IN_TRANSIT, DELIVERED, CANCELLED ou FAILED' 
  })
  status?: OrderStatus;

  @ApiProperty({
    description: 'ID du livreur assigné',
    example: 'cuid123456789',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'L\'ID du livreur doit être une chaîne de caractères' })
  driverId?: string;

  @ApiProperty({
    description: 'Notes ou instructions mises à jour',
    example: 'Client a changé d\'adresse, nouvelle adresse confirmée',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString({ message: 'Les notes doivent être une chaîne de caractères' })
  @MaxLength(500, { message: 'Les notes ne peuvent pas dépasser 500 caractères' })
  notes?: string;

  @ApiProperty({
    description: 'Nouvelle date et heure de livraison souhaitée',
    example: '2024-01-15T16:00:00Z',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'La date de livraison doit être au format ISO 8601' })
  scheduledAt?: string;

  @ApiProperty({
    description: 'Preuve de livraison (URL de photo ou signature)',
    example: 'https://storage.wali.ci/proofs/order-123-delivered.jpg',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString({ message: 'La preuve de livraison doit être une chaîne de caractères' })
  @MaxLength(500, { message: 'La preuve de livraison ne peut pas dépasser 500 caractères' })
  proofOfDelivery?: string;
}
