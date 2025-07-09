import { Injectable, ConflictException, UnauthorizedException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from './sms.service';
import { RegisterDto, LoginDto, VerifyOtpDto, RefreshTokenDto } from './dto';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { parsePhoneNumber } from 'libphonenumber-js';

export interface AuthResponse {
  user: Omit<User, 'createdAt' | 'updatedAt'>;
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  phone: string;
  role: UserRole;
  type: 'access' | 'refresh';
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private smsService: SmsService,
  ) {}

  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(registerDto: RegisterDto): Promise<{ message: string; phone: string }> {
    const { phone, email, firstName, lastName, role } = registerDto;

    // Normalisation du numéro de téléphone
    const normalizedPhone = this.normalizePhoneNumber(phone);

    // Vérification si l'utilisateur existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { phone: normalizedPhone }
    });

    if (existingUser) {
      throw new ConflictException('Un compte existe déjà avec ce numéro de téléphone');
    }

    // Vérification de l'email si fourni
    if (email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email }
      });

      if (existingEmail) {
        throw new ConflictException('Un compte existe déjà avec cette adresse email');
      }
    }

    // Création de l'utilisateur (non vérifié)
    await this.prisma.user.create({
      data: {
        phone: normalizedPhone,
        email,
        firstName,
        lastName,
        role: role || UserRole.CLIENT,
        isVerified: false,
        isActive: true
      }
    });

    // Génération et envoi du code OTP
    const otp = this.smsService.generateOtp(normalizedPhone);
    const smsSent = await this.smsService.sendOtp(normalizedPhone, otp);

    if (!smsSent) {
      this.logger.warn(`Échec de l'envoi du SMS d'inscription pour ${normalizedPhone}`);
    }

    this.logger.log(`Utilisateur créé avec succès: ${normalizedPhone}`);

    return {
      message: 'Compte créé avec succès. Un code de vérification a été envoyé par SMS.',
      phone: normalizedPhone
    };
  }

  /**
   * Connexion d'un utilisateur
   */
  async login(loginDto: LoginDto): Promise<{ message: string; phone: string }> {
    const { phone } = loginDto;
    const normalizedPhone = this.normalizePhoneNumber(phone);

    // Vérification si l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { phone: normalizedPhone }
    });

    if (!user) {
      throw new NotFoundException('Aucun compte trouvé avec ce numéro de téléphone');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Votre compte a été désactivé. Contactez le support.');
    }

    // Génération et envoi du code OTP
    const otp = this.smsService.generateOtp(normalizedPhone);
    const smsSent = await this.smsService.sendOtp(normalizedPhone, otp);

    if (!smsSent) {
      this.logger.warn(`Échec de l'envoi du SMS de connexion pour ${normalizedPhone}`);
    }

    this.logger.log(`Code OTP envoyé pour connexion: ${normalizedPhone}`);

    return {
      message: 'Un code de vérification a été envoyé par SMS.',
      phone: normalizedPhone
    };
  }

  /**
   * Vérification du code OTP et authentification
   */
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<AuthResponse> {
    const { phone, otp } = verifyOtpDto;
    const normalizedPhone = this.normalizePhoneNumber(phone);

    // Vérification du code OTP
    const isValidOtp = this.smsService.verifyOtp(normalizedPhone, otp);
    if (!isValidOtp) {
      throw new UnauthorizedException('Code de vérification invalide ou expiré');
    }

    // Récupération de l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { phone: normalizedPhone }
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Marquer l'utilisateur comme vérifié s'il ne l'était pas
    if (!user.isVerified) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true }
      });

      // Envoi du SMS de bienvenue pour les nouveaux utilisateurs
      await this.smsService.sendWelcomeSms(normalizedPhone, user.firstName);
    }

    // Génération des tokens
    const tokens = await this.generateTokens(user);

    this.logger.log(`Utilisateur authentifié avec succès: ${normalizedPhone}`);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role,
        isActive: user.isActive,
        isVerified: true
      },
      ...tokens
    };
  }

  /**
   * Rafraîchissement du token d'accès
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<{ accessToken: string }> {
    const { refreshToken } = refreshTokenDto;

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET')
      }) as JwtPayload;

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Token de rafraîchissement invalide');
      }

      // Vérification que l'utilisateur existe toujours
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub }
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Utilisateur non trouvé ou désactivé');
      }

      // Génération d'un nouveau token d'accès
      const accessToken = await this.generateAccessToken(user);

      return { accessToken };

    } catch (error) {
      throw new UnauthorizedException('Token de rafraîchissement invalide ou expiré');
    }
  }

  /**
   * Génération des tokens JWT
   */
  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user)
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Génération du token d'accès
   */
  private async generateAccessToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
      type: 'access'
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '15m'
    });
  }

  /**
   * Génération du token de rafraîchissement
   */
  private async generateRefreshToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
      type: 'refresh'
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d'
    });
  }

  /**
   * Normalisation du numéro de téléphone
   */
  private normalizePhoneNumber(phone: string): string {
    try {
      const phoneNumber = parsePhoneNumber(phone, 'CI');
      if (!phoneNumber.isValid()) {
        throw new BadRequestException('Numéro de téléphone invalide');
      }
      return phoneNumber.format('E.164');
    } catch (error) {
      throw new BadRequestException('Format de numéro de téléphone invalide');
    }
  }

  /**
   * Validation d'un utilisateur par ID (pour les guards)
   */
  async validateUser(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId, isActive: true }
    });
  }
}
