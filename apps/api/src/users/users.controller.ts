import { 
  Controller, 
  Get, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam 
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '@prisma/client';

@ApiTags('Utilisateurs')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ 
    summary: 'Profil de l\'utilisateur connecté',
    description: 'Récupère les informations complètes du profil de l\'utilisateur actuellement connecté'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profil utilisateur récupéré avec succès.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'cuid123456789' },
        phone: { type: 'string', example: '+2250701234567' },
        email: { type: 'string', example: 'kouassi.yao@example.com' },
        firstName: { type: 'string', example: 'Kouassi' },
        lastName: { type: 'string', example: 'Yao' },
        avatar: { type: 'string', example: 'https://example.com/avatar.jpg' },
        role: { type: 'string', enum: ['CLIENT', 'DRIVER', 'PARTNER', 'ADMIN'] },
        isActive: { type: 'boolean', example: true },
        isVerified: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Token d\'authentification requis' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Utilisateur non trouvé ou compte désactivé' 
  })
  async getProfile(@CurrentUser() user: User) {
    return this.usersService.getProfile(user.id);
  }

  @Put('profile')
  @ApiOperation({ 
    summary: 'Mise à jour du profil utilisateur',
    description: 'Met à jour les informations du profil de l\'utilisateur connecté'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profil mis à jour avec succès.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        avatar: { type: 'string' },
        role: { type: 'string' },
        isActive: { type: 'boolean' },
        isVerified: { type: 'boolean' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données de mise à jour invalides' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Adresse email déjà utilisée' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Utilisateur non trouvé' 
  })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Statistiques de l\'utilisateur',
    description: 'Récupère les statistiques d\'utilisation de l\'utilisateur connecté'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistiques récupérées avec succès.',
    schema: {
      type: 'object',
      properties: {
        totalOrders: { type: 'number', example: 12 },
        completedOrders: { type: 'number', example: 10 },
        totalSpent: { type: 'number', example: 28500 },
        averageRating: { type: 'number', example: 4.8 }
      }
    }
  })
  async getUserStats(@CurrentUser() user: User) {
    return this.usersService.getUserStats(user.id);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Profil utilisateur par ID',
    description: 'Récupère les informations publiques d\'un utilisateur par son ID'
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'utilisateur',
    example: 'cuid123456789'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profil utilisateur récupéré avec succès.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        avatar: { type: 'string' },
        role: { type: 'string' },
        isVerified: { type: 'boolean' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Utilisateur non trouvé' 
  })
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Delete('account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Suppression du compte utilisateur',
    description: 'Supprime définitivement le compte de l\'utilisateur connecté'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Compte supprimé avec succès.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Votre compte a été supprimé avec succès' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Utilisateur non trouvé' 
  })
  async deleteAccount(@CurrentUser() user: User) {
    return this.usersService.deleteAccount(user.id);
  }
}
