import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, VerifyOtpDto, RefreshTokenDto } from './dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from '@prisma/client';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Inscription d\'un nouvel utilisateur',
    description: 'Crée un nouveau compte utilisateur et envoie un code OTP par SMS pour vérification'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Compte créé avec succès. Code OTP envoyé par SMS.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Compte créé avec succès. Un code de vérification a été envoyé par SMS.' },
        phone: { type: 'string', example: '+2250701234567' }
      }
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Un compte existe déjà avec ce numéro de téléphone ou cette adresse email' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données d\'inscription invalides' 
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Connexion d\'un utilisateur',
    description: 'Initie la connexion d\'un utilisateur existant en envoyant un code OTP par SMS'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Code OTP envoyé par SMS.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Un code de vérification a été envoyé par SMS.' },
        phone: { type: 'string', example: '+2250701234567' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Aucun compte trouvé avec ce numéro de téléphone' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Compte désactivé' 
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Vérification du code OTP',
    description: 'Vérifie le code OTP et retourne les tokens d\'authentification'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Code OTP vérifié avec succès. Utilisateur authentifié.',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            avatar: { type: 'string' },
            role: { type: 'string', enum: ['CLIENT', 'DRIVER', 'PARTNER', 'ADMIN'] },
            isActive: { type: 'boolean' },
            isVerified: { type: 'boolean' }
          }
        },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Code de vérification invalide ou expiré' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Utilisateur non trouvé' 
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Rafraîchissement du token d\'accès',
    description: 'Génère un nouveau token d\'accès à partir du token de rafraîchissement'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Nouveau token d\'accès généré.',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token de rafraîchissement invalide ou expiré' 
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Profil de l\'utilisateur connecté',
    description: 'Retourne les informations du profil de l\'utilisateur actuellement connecté'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profil utilisateur récupéré avec succès.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        avatar: { type: 'string' },
        role: { type: 'string', enum: ['CLIENT', 'DRIVER', 'PARTNER', 'ADMIN'] },
        isActive: { type: 'boolean' },
        isVerified: { type: 'boolean' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token d\'authentification requis' 
  })
  async getProfile(@CurrentUser() user: User) {
    const { createdAt, updatedAt, ...userProfile } = user;
    return userProfile;
  }

  @Get('check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Vérification du token',
    description: 'Vérifie la validité du token d\'authentification'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token valide.',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token invalide ou expiré' 
  })
  async checkToken(@CurrentUser() user: User) {
    return {
      valid: true,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role
      }
    };
  }
}
