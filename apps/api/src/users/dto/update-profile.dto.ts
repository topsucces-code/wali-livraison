import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength, MaxLength, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Prénom de l\'utilisateur',
    example: 'Kouassi',
    minLength: 2,
    maxLength: 50
  })
  @IsOptional()
  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  @MinLength(2, { message: 'Le prénom doit contenir au moins 2 caractères' })
  @MaxLength(50, { message: 'Le prénom ne peut pas dépasser 50 caractères' })
  firstName?: string;

  @ApiProperty({
    description: 'Nom de famille de l\'utilisateur',
    example: 'Yao',
    minLength: 2,
    maxLength: 50
  })
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(50, { message: 'Le nom ne peut pas dépasser 50 caractères' })
  lastName?: string;

  @ApiProperty({
    description: 'Adresse email de l\'utilisateur',
    example: 'kouassi.yao@example.com',
    required: false
  })
  @IsOptional()
  @IsEmail({}, { message: 'L\'adresse email doit être valide' })
  email?: string;

  @ApiProperty({
    description: 'URL de l\'avatar de l\'utilisateur',
    example: 'https://example.com/avatar.jpg',
    required: false
  })
  @IsOptional()
  @IsUrl({}, { message: 'L\'URL de l\'avatar doit être valide' })
  avatar?: string;
}
