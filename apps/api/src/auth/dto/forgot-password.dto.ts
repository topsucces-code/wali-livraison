import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Numéro de téléphone (format international)',
    example: '+2250701234567'
  })
  @IsPhoneNumber('CI', { message: 'Le numéro de téléphone doit être valide pour la Côte d\'Ivoire' })
  phone: string;
}
