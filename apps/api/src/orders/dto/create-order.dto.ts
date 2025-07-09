import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsArray, 
  IsEnum, 
  IsDateString,
  ValidateNested,
  Min,
  Max,
  MinLength,
  MaxLength,
  ArrayMinSize
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType } from '@wali/shared';

export class CreateOrderItemDto {
  @ApiProperty({
    description: 'Nom de l\'article',
    example: 'Riz au gras',
    minLength: 2,
    maxLength: 100
  })
  @IsString({ message: 'Le nom de l\'article doit être une chaîne de caractères' })
  @MinLength(2, { message: 'Le nom de l\'article doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom de l\'article ne peut pas dépasser 100 caractères' })
  name: string;

  @ApiProperty({
    description: 'Description de l\'article (optionnel)',
    example: 'Riz au gras avec poulet et légumes',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @MaxLength(500, { message: 'La description ne peut pas dépasser 500 caractères' })
  description?: string;

  @ApiProperty({
    description: 'Quantité',
    example: 2,
    minimum: 1,
    maximum: 100
  })
  @IsNumber({}, { message: 'La quantité doit être un nombre' })
  @Min(1, { message: 'La quantité doit être au moins 1' })
  @Max(100, { message: 'La quantité ne peut pas dépasser 100' })
  quantity: number;

  @ApiProperty({
    description: 'Prix unitaire en FCFA',
    example: 2500,
    minimum: 0
  })
  @IsNumber({}, { message: 'Le prix unitaire doit être un nombre' })
  @Min(0, { message: 'Le prix unitaire ne peut pas être négatif' })
  unitPrice: number;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Type de commande',
    enum: OrderType,
    example: OrderType.FOOD
  })
  @IsEnum(OrderType, { message: 'Le type de commande doit être DELIVERY, FOOD ou SHOPPING' })
  type: OrderType;

  @ApiProperty({
    description: 'Adresse de récupération',
    example: 'Restaurant Chez Tante Marie, Rue des Jardins, Cocody',
    minLength: 10,
    maxLength: 200
  })
  @IsString({ message: 'L\'adresse de récupération doit être une chaîne de caractères' })
  @MinLength(10, { message: 'L\'adresse de récupération doit contenir au moins 10 caractères' })
  @MaxLength(200, { message: 'L\'adresse de récupération ne peut pas dépasser 200 caractères' })
  pickupAddress: string;

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
    description: 'Adresse de livraison',
    example: 'Villa 12, Résidence Les Palmiers, Cocody',
    minLength: 10,
    maxLength: 200
  })
  @IsString({ message: 'L\'adresse de livraison doit être une chaîne de caractères' })
  @MinLength(10, { message: 'L\'adresse de livraison doit contenir au moins 10 caractères' })
  @MaxLength(200, { message: 'L\'adresse de livraison ne peut pas dépasser 200 caractères' })
  deliveryAddress: string;

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
    description: 'Notes ou instructions spéciales (optionnel)',
    example: 'Sonner à l\'interphone, appartement 3A',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString({ message: 'Les notes doivent être une chaîne de caractères' })
  @MaxLength(500, { message: 'Les notes ne peuvent pas dépasser 500 caractères' })
  notes?: string;

  @ApiProperty({
    description: 'Date et heure de livraison souhaitée (optionnel)',
    example: '2024-01-15T14:30:00Z',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'La date de livraison doit être au format ISO 8601' })
  scheduledAt?: string;

  @ApiProperty({
    description: 'Liste des articles à livrer',
    type: [CreateOrderItemDto],
    minItems: 1
  })
  @IsArray({ message: 'Les articles doivent être un tableau' })
  @ArrayMinSize(1, { message: 'Au moins un article est requis' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
