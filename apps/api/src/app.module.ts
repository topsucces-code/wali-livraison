import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

// Database
import { PrismaModule } from './prisma/prisma.module';

// Auth
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

// Users
import { UsersModule } from './users/users.module';

// Addresses
import { AddressesModule } from './addresses/addresses.module';

// Orders
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    PrismaModule,

    // Authentication
    AuthModule,

    // Users Management
    UsersModule,

    // Addresses Management
    AddressesModule,

    // Orders Management
    OrdersModule,
  ],
  controllers: [],
  providers: [
    // Guard global pour l'authentification
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
