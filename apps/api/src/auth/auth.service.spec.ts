import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SmsService } from './sms.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let smsService: SmsService;
  let jwtService: JwtService;

  const mockUser = {
    id: '1',
    phone: '+2250701234567',
    email: 'test@example.com',
    firstName: 'Kouassi',
    lastName: 'Yao',
    avatar: null,
    role: UserRole.CLIENT,
    isActive: true,
    isVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockSmsService = {
    generateOtp: jest.fn(),
    sendOtp: jest.fn(),
    verifyOtp: jest.fn(),
    sendWelcomeSms: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        JWT_SECRET: 'test-secret',
        JWT_EXPIRES_IN: '15m',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_REFRESH_EXPIRES_IN: '7d',
        NODE_ENV: 'test',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SmsService, useValue: mockSmsService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    smsService = module.get<SmsService>(SmsService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      phone: '+2250701234567',
      email: 'test@example.com',
      firstName: 'Kouassi',
      lastName: 'Yao',
      role: UserRole.CLIENT,
    };

    it('should successfully register a new user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockSmsService.generateOtp.mockReturnValue('123456');
      mockSmsService.sendOtp.mockResolvedValue(true);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        message: 'Compte créé avec succès. Un code de vérification a été envoyé par SMS.',
        phone: '+2250701234567',
      });
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          phone: '+2250701234567',
          email: 'test@example.com',
          firstName: 'Kouassi',
          lastName: 'Yao',
          role: UserRole.CLIENT,
          isVerified: false,
          isActive: true,
        },
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const loginDto = { phone: '+2250701234567' };

    it('should successfully initiate login', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockSmsService.generateOtp.mockReturnValue('123456');
      mockSmsService.sendOtp.mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        message: 'Un code de vérification a été envoyé par SMS.',
        phone: '+2250701234567',
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyOtp', () => {
    const verifyOtpDto = { phone: '+2250701234567', otp: '123456' };

    it('should successfully verify OTP and return auth response', async () => {
      mockSmsService.verifyOtp.mockReturnValue(true);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({ ...mockUser, isVerified: true });
      mockJwtService.signAsync.mockResolvedValue('mock-token');
      mockSmsService.sendWelcomeSms.mockResolvedValue(true);

      const result = await service.verifyOtp(verifyOtpDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.isVerified).toBe(true);
    });

    it('should throw UnauthorizedException for invalid OTP', async () => {
      mockSmsService.verifyOtp.mockReturnValue(false);

      await expect(service.verifyOtp(verifyOtpDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto = { refreshToken: 'valid-refresh-token' };

    it('should successfully refresh access token', async () => {
      const mockPayload = {
        sub: '1',
        phone: '+2250701234567',
        role: UserRole.CLIENT,
        type: 'refresh' as const,
      };

      mockJwtService.verify.mockReturnValue(mockPayload);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue('new-access-token');

      const result = await service.refreshToken(refreshTokenDto);

      expect(result).toEqual({ accessToken: 'new-access-token' });
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user if exists and is active', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('1');

      expect(result).toEqual(mockUser);
    });

    it('should return null if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('1');

      expect(result).toBeNull();
    });
  });
});
