import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsPhoneNumber, MinLength, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({
    description: 'Numéro de téléphone (format international)',
    example: '+2250701234567'
  })
  @IsPhoneNumber('CI', { message: 'Le numéro de téléphone doit être valide pour la Côte d\'Ivoire' })
  phone: string;

  @ApiProperty({
    description: 'Adresse email (optionnelle)',
    example: 'user@example.com',
    required: false
  })
  @IsOptional()
  @IsEmail({}, { message: 'L\'adresse email doit être valide' })
  email?: string;

  @ApiProperty({
    description: 'Prénom',
    example: 'Kouassi'
  })
  @IsString({ message: 'Le prénom est requis' })
  @MinLength(2, { message: 'Le prénom doit contenir au moins 2 caractères' })
  firstName: string;

  @ApiProperty({
    description: 'Nom de famille',
    example: 'Yao'
  })
  @IsString({ message: 'Le nom de famille est requis' })
  @MinLength(2, { message: 'Le nom de famille doit contenir au moins 2 caractères' })
  lastName: string;

  @ApiProperty({
    description: 'Rôle de l\'utilisateur',
    enum: UserRole,
    example: UserRole.CLIENT,
    default: UserRole.CLIENT
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Le rôle doit être valide' })
  role?: UserRole = UserRole.CLIENT;
}
