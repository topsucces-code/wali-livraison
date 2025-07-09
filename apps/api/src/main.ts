import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Sécurité
  app.use(helmet());
  app.use(compression());

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limite chaque IP à 100 requêtes par windowMs
      message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
    }),
  );

  // CORS
  app.enableCors({
    origin: configService.get('ALLOWED_ORIGINS')?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
    ],
    credentials: true,
  });

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Préfixe global pour les APIs
  app.setGlobalPrefix('api/v1');

  // Documentation Swagger
  const config = new DocumentBuilder()
    .setTitle('WALI Livraison API')
    .setDescription('API pour l\'application de livraison WALI')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentification et autorisation')
    .addTag('Users', 'Gestion des utilisateurs')
    .addTag('Orders', 'Gestion des commandes')
    .addTag('Drivers', 'Gestion des livreurs')
    .addTag('Partners', 'Gestion des partenaires')
    .addTag('Restaurants', 'Gestion des restaurants')
    .addTag('Stores', 'Gestion des magasins')
    .addTag('Products', 'Gestion des produits')
    .addTag('Payments', 'Gestion des paiements')
    .addTag('Notifications', 'Système de notifications')
    .addTag('Admin', 'Administration')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get('PORT') || 3001;
  await app.listen(port);

  console.log(`🚀 WALI Livraison API démarrée sur le port ${port}`);
  console.log(`📚 Documentation Swagger disponible sur http://localhost:${port}/api/docs`);
}

bootstrap();
