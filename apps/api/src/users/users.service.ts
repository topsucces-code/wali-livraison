import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupère le profil de l'utilisateur connecté
   */
  async getProfile(userId: string): Promise<Omit<User, 'createdAt' | 'updatedAt'>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isActive: true,
        isVerified: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (!user.isActive) {
      throw new NotFoundException('Compte utilisateur désactivé');
    }

    return user;
  }

  /**
   * Récupère un utilisateur par son ID (pour les autres utilisateurs)
   */
  async getUserById(userId: string): Promise<Partial<User>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isVerified: true,
        // Ne pas exposer les informations sensibles
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  /**
   * Met à jour le profil de l'utilisateur connecté
   */
  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Omit<User, 'createdAt' | 'updatedAt'>> {
    const { firstName, lastName, email, avatar } = updateProfileDto;

    // Vérifier que l'utilisateur existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (!existingUser.isActive) {
      throw new NotFoundException('Compte utilisateur désactivé');
    }

    // Vérifier l'unicité de l'email si fourni et différent de l'actuel
    if (email && email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        throw new ConflictException('Cette adresse email est déjà utilisée');
      }
    }

    // Mise à jour du profil
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email !== undefined && { email }),
        ...(avatar !== undefined && { avatar }),
      },
      select: {
        id: true,
        phone: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isActive: true,
        isVerified: true,
      },
    });

    this.logger.log(`Profil mis à jour pour l'utilisateur: ${userId}`);

    return updatedUser;
  }

  /**
   * Supprime le compte de l'utilisateur connecté
   */
  async deleteAccount(userId: string): Promise<{ message: string }> {
    // Vérifier que l'utilisateur existe
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Soft delete : désactiver le compte au lieu de le supprimer
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        email: null, // Libérer l'email pour réutilisation
      },
    });

    this.logger.log(`Compte supprimé pour l'utilisateur: ${userId}`);

    return {
      message: 'Votre compte a été supprimé avec succès',
    };
  }

  /**
   * Récupère les statistiques de l'utilisateur
   */
  async getUserStats(userId: string): Promise<{
    totalOrders: number;
    completedOrders: number;
    totalSpent: number;
    averageRating: number;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Statistiques des commandes
    const [totalOrders, completedOrders, transactions, ratings] = await Promise.all([
      this.prisma.order.count({
        where: { clientId: userId },
      }),
      this.prisma.order.count({
        where: { 
          clientId: userId,
          status: 'DELIVERED',
        },
      }),
      this.prisma.transaction.findMany({
        where: { 
          userId,
          status: 'COMPLETED',
        },
        select: { amount: true },
      }),
      this.prisma.rating.findMany({
        where: { toUserId: userId },
        select: { rating: true },
      }),
    ]);

    const totalSpent = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
      : 0;

    return {
      totalOrders,
      completedOrders,
      totalSpent,
      averageRating: Math.round(averageRating * 10) / 10, // Arrondir à 1 décimale
    };
  }
}
