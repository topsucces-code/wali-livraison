import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsOptional, 
  IsNumber, 
  IsBoolean, 
  MinLength, 
  MaxLength, 
  Min, 
  Max,
  IsIn 
} from 'class-validator';
import { IVORY_COAST_CITIES } from '@wali/shared';

export class UpdateAddressDto {
  @ApiProperty({
    description: 'Libellé de l\'adresse (ex: Maison, Bureau)',
    example: 'Bureau',
    required: false,
    maxLength: 50
  })
  @IsOptional()
  @IsString({ message: 'Le libellé doit être une chaîne de caractères' })
  @MaxLength(50, { message: 'Le libellé ne peut pas dépasser 50 caractères' })
  label?: string;

  @ApiProperty({
    description: 'Rue et numéro de l\'adresse',
    example: 'Avenue Chardy, Immeuble Alpha 2000, Bureau 205',
    required: false,
    minLength: 5,
    maxLength: 200
  })
  @IsOptional()
  @IsString({ message: 'La rue doit être une chaîne de caractères' })
  @MinLength(5, { message: 'La rue doit contenir au moins 5 caractères' })
  @MaxLength(200, { message: 'La rue ne peut pas dépasser 200 caractères' })
  street?: string;

  @ApiProperty({
    description: 'Ville en Côte d\'Ivoire',
    example: 'Abidjan',
    required: false,
    enum: IVORY_COAST_CITIES
  })
  @IsOptional()
  @IsString({ message: 'La ville doit être une chaîne de caractères' })
  @IsIn(IVORY_COAST_CITIES, { 
    message: 'La ville doit être une ville valide de Côte d\'Ivoire' 
  })
  city?: string;

  @ApiProperty({
    description: 'Quartier ou district',
    example: 'Plateau',
    required: false,
    maxLength: 100
  })
  @IsOptional()
  @IsString({ message: 'Le quartier doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le quartier ne peut pas dépasser 100 caractères' })
  district?: string;

  @ApiProperty({
    description: 'Point de repère pour faciliter la localisation',
    example: 'Face à la BCEAO',
    required: false,
    maxLength: 200
  })
  @IsOptional()
  @IsString({ message: 'Le point de repère doit être une chaîne de caractères' })
  @MaxLength(200, { message: 'Le point de repère ne peut pas dépasser 200 caractères' })
  landmark?: string;

  @ApiProperty({
    description: 'Latitude GPS de l\'adresse',
    example: 5.3200,
    required: false,
    minimum: -90,
    maximum: 90
  })
  @IsOptional()
  @IsNumber({}, { message: 'La latitude doit être un nombre' })
  @Min(-90, { message: 'La latitude doit être comprise entre -90 et 90' })
  @Max(90, { message: 'La latitude doit être comprise entre -90 et 90' })
  latitude?: number;

  @ApiProperty({
    description: 'Longitude GPS de l\'adresse',
    example: -4.0100,
    required: false,
    minimum: -180,
    maximum: 180
  })
  @IsOptional()
  @IsNumber({}, { message: 'La longitude doit être un nombre' })
  @Min(-180, { message: 'La longitude doit être comprise entre -180 et 180' })
  @Max(180, { message: 'La longitude doit être comprise entre -180 et 180' })
  longitude?: number;

  @ApiProperty({
    description: 'Définir comme adresse par défaut',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean({ message: 'isDefault doit être un booléen' })
  isDefault?: boolean;
}
