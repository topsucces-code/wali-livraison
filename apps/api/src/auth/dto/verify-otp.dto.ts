import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsPhoneNumber, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Numéro de téléphone (format international)',
    example: '+2250701234567'
  })
  @IsPhoneNumber('CI', { message: 'Le numéro de téléphone doit être valide pour la Côte d\'Ivoire' })
  phone: string;

  @ApiProperty({
    description: 'Code OTP à 6 chiffres',
    example: '123456'
  })
  @IsString({ message: 'Le code OTP est requis' })
  @Length(6, 6, { message: 'Le code OTP doit contenir exactement 6 chiffres' })
  otp: string;
}
