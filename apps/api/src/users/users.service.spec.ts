import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockUser = {
    id: '1',
    phone: '+2250701234567',
    email: 'test@example.com',
    firstName: 'Kouassi',
    lastName: 'Yao',
    avatar: null,
    role: UserRole.CLIENT,
    isActive: true,
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    order: {
      count: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
    },
    rating: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      const expectedProfile = {
        id: mockUser.id,
        phone: mockUser.phone,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        avatar: mockUser.avatar,
        role: mockUser.role,
        isActive: mockUser.isActive,
        isVerified: mockUser.isVerified,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(expectedProfile);

      const result = await service.getProfile('1');

      expect(result).toEqual(expectedProfile);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
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
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user is inactive', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(service.getProfile('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    const updateDto = {
      firstName: 'Nouveau',
      lastName: 'Nom',
      email: 'nouveau@example.com',
    };

    it('should update profile successfully', async () => {
      const updatedUser = { ...mockUser, ...updateDto };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockUser) // Pour la vérification d'existence
        .mockResolvedValueOnce(null); // Pour la vérification d'email

      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('1', updateDto);

      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          firstName: 'Nouveau',
          lastName: 'Nom',
          email: 'nouveau@example.com',
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
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockUser) // Pour la vérification d'existence
        .mockResolvedValueOnce({ id: '2', email: 'nouveau@example.com' }); // Email existe

      await expect(service.updateProfile('1', updateDto)).rejects.toThrow(ConflictException);
    });

    it('should not check email uniqueness if email is unchanged', async () => {
      const updateDtoSameEmail = {
        firstName: 'Nouveau',
        email: mockUser.email, // Même email
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        firstName: 'Nouveau',
      });

      await service.updateProfile('1', updateDtoSameEmail);

      // Vérifier qu'on n'a appelé findUnique qu'une seule fois (pour l'existence)
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteAccount', () => {
    it('should soft delete account successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        isActive: false,
        email: null,
      });

      const result = await service.deleteAccount('1');

      expect(result).toEqual({
        message: 'Votre compte a été supprimé avec succès',
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          isActive: false,
          email: null,
        },
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteAccount('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.order.count
        .mockResolvedValueOnce(12) // totalOrders
        .mockResolvedValueOnce(10); // completedOrders
      
      mockPrismaService.transaction.findMany.mockResolvedValue([
        { amount: 2500 },
        { amount: 3000 },
        { amount: 1500 },
      ]);

      mockPrismaService.rating.findMany.mockResolvedValue([
        { rating: 5 },
        { rating: 4 },
        { rating: 5 },
      ]);

      const result = await service.getUserStats('1');

      expect(result).toEqual({
        totalOrders: 12,
        completedOrders: 10,
        totalSpent: 7000,
        averageRating: 4.7,
      });
    });

    it('should handle zero ratings correctly', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.order.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      
      mockPrismaService.transaction.findMany.mockResolvedValue([]);
      mockPrismaService.rating.findMany.mockResolvedValue([]);

      const result = await service.getUserStats('1');

      expect(result).toEqual({
        totalOrders: 0,
        completedOrders: 0,
        totalSpent: 0,
        averageRating: 0,
      });
    });
  });
});
