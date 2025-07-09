import { ApiProperty } from '@nestjs/swagger';
import { 
  IsNumber, 
  IsEnum, 
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType } from '@wali/shared';
import { CreateOrderItemDto } from './create-order.dto';

export class PriceCalculationDto {
  @ApiProperty({
    description: 'Type de commande',
    enum: OrderType,
    example: OrderType.FOOD
  })
  @IsEnum(OrderType, { message: 'Le type de commande doit être DELIVERY, FOOD ou SHOPPING' })
  type: OrderType;

  @ApiProperty({
    description: 'Latitude de l\'adresse de récupération',
    example: 5.3364,
    minimum: -90,
    maximum: 90
  })
  @IsNumber({}, { message: 'La latitude de récupération doit être un nombre' })
  @Min(-90, { message: 'La latitude doit être comprise entre -90 et 90' })
  @Max(90, { message: 'La latitude doit être comprise entre -90 et 90' })
  pickupLatitude: number;

  @ApiProperty({
    description: 'Longitude de l\'adresse de récupération',
    example: -4.0267,
    minimum: -180,
    maximum: 180
  })
  @IsNumber({}, { message: 'La longitude de récupération doit être un nombre' })
  @Min(-180, { message: 'La longitude doit être comprise entre -180 et 180' })
  @Max(180, { message: 'La longitude doit être comprise entre -180 et 180' })
  pickupLongitude: number;

  @ApiProperty({
    description: 'Latitude de l\'adresse de livraison',
    example: 5.3400,
    minimum: -90,
    maximum: 90
  })
  @IsNumber({}, { message: 'La latitude de livraison doit être un nombre' })
  @Min(-90, { message: 'La latitude doit être comprise entre -90 et 90' })
  @Max(90, { message: 'La latitude doit être comprise entre -90 et 90' })
  deliveryLatitude: number;

  @ApiProperty({
    description: 'Longitude de l\'adresse de livraison',
    example: -4.0300,
    minimum: -180,
    maximum: 180
  })
  @IsNumber({}, { message: 'La longitude de livraison doit être un nombre' })
  @Min(-180, { message: 'La longitude doit être comprise entre -180 et 180' })
  @Max(180, { message: 'La longitude doit être comprise entre -180 et 180' })
  deliveryLongitude: number;

  @ApiProperty({
    description: 'Liste des articles (optionnel, requis pour les courses)',
    type: [CreateOrderItemDto],
    required: false
  })
  @IsOptional()
  @IsArray({ message: 'Les articles doivent être un tableau' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];
}
