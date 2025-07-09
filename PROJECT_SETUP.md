# Configuration et Setup du Projet - WALI LIVRAISON

## 🚀 Initialisation du Projet

### 1. Création du Monorepo Turborepo

```bash
# Initialisation du projet
npx create-turbo@latest wali-livraison
cd wali-livraison

# Installation des dépendances globales
npm install -D typescript @types/node eslint prettier
```

### 2. Structure des Dossiers

```
wali-livraison/
├── apps/
│   ├── api/                 # Backend NestJS
│   ├── admin-panel/         # Panel d'administration Next.js
│   ├── client-web/          # Site client Next.js
│   ├── mobile-client/       # App mobile client React Native
│   └── mobile-driver/       # App mobile livreur React Native
├── packages/
│   ├── ui/                  # Composants UI partagés (Shadcn/ui)
│   ├── database/            # Schémas Prisma et migrations
│   ├── shared/              # Types TypeScript et utilitaires
│   ├── config/              # Configurations ESLint, Prettier, etc.
│   └── mobile-ui/           # Composants UI React Native
├── tools/
│   └── deployment/          # Scripts de déploiement
├── docs/                    # Documentation
├── turbo.json              # Configuration Turborepo
├── package.json            # Dépendances racine
└── README.md
```

## 🔧 Configuration des Applications

### Backend NestJS (apps/api)

```bash
# Création de l'application NestJS
cd apps
npx @nestjs/cli new api
cd api

# Installation des dépendances principales
npm install @nestjs/config @nestjs/jwt @nestjs/passport
npm install @nestjs/swagger @nestjs/throttler @nestjs/schedule
npm install @prisma/client prisma
npm install passport passport-jwt passport-local
npm install bcryptjs class-validator class-transformer
npm install @nestjs/websockets @nestjs/platform-socket.io

# Dépendances de développement
npm install -D @types/bcryptjs @types/passport-jwt @types/passport-local
```

**Structure des modules NestJS :**
```
src/
├── auth/                   # Module d'authentification
├── users/                  # Gestion des utilisateurs
├── orders/                 # Gestion des commandes
├── drivers/                # Gestion des livreurs
├── partners/               # Gestion des partenaires
├── restaurants/            # Gestion des restaurants
├── stores/                 # Gestion des magasins
├── products/               # Gestion des produits
├── payments/               # Gestion des paiements
├── notifications/          # Système de notifications
├── geolocation/            # Services de géolocalisation
├── upload/                 # Upload de fichiers
├── admin/                  # Administration
├── common/                 # Utilitaires communs
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
└── main.ts
```

### Frontend Next.js (admin-panel & client-web)

```bash
# Panel d'administration
cd apps
npx create-next-app@latest admin-panel --typescript --tailwind --eslint --app
cd admin-panel

# Installation des dépendances UI
npm install @radix-ui/react-slot @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu @radix-ui/react-select
npm install lucide-react class-variance-authority clsx tailwind-merge
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install recharts react-hook-form @hookform/resolvers zod

# Site client web
cd ../
npx create-next-app@latest client-web --typescript --tailwind --eslint --app
cd client-web
# Mêmes dépendances que admin-panel
```

### Applications React Native

```bash
# App client mobile
cd apps
npx react-native@latest init MobileClient --template react-native-template-typescript
cd MobileClient

# Dépendances principales
npm install @react-navigation/native @react-navigation/stack
npm install @react-navigation/bottom-tabs @react-navigation/drawer
npm install react-native-screens react-native-safe-area-context
npm install react-native-gesture-handler react-native-reanimated
npm install @tanstack/react-query react-native-async-storage
npm install react-native-maps react-native-geolocation-service
npm install react-native-image-picker react-native-permissions

# App livreur mobile
cd ../
npx react-native@latest init MobileDriver --template react-native-template-typescript
cd MobileDriver
# Mêmes dépendances que MobileClient
```

## 📦 Configuration des Packages Partagés

### Package Database (packages/database)

```bash
mkdir -p packages/database
cd packages/database

# Initialisation Prisma
npm init -y
npm install prisma @prisma/client
npx prisma init
```

**package.json :**
```json
{
  "name": "@wali/database",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "tsx seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "prisma": "^5.0.0"
  }
}
```

### Package Shared (packages/shared)

```bash
mkdir -p packages/shared
cd packages/shared
npm init -y
npm install zod
```

**Types partagés (packages/shared/src/types.ts) :**
```typescript
export interface User {
  id: string;
  phone: string;
  email?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  CLIENT = 'CLIENT',
  DRIVER = 'DRIVER',
  PARTNER = 'PARTNER',
  ADMIN = 'ADMIN'
}

export interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  driverId?: string;
  type: OrderType;
  status: OrderStatus;
  pickupAddress: string;
  deliveryAddress: string;
  totalAmount: number;
  createdAt: Date;
}

export enum OrderType {
  DELIVERY = 'DELIVERY',
  FOOD = 'FOOD',
  SHOPPING = 'SHOPPING'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}
```

### Package UI (packages/ui)

```bash
mkdir -p packages/ui
cd packages/ui
npm init -y

# Installation Shadcn/ui
npm install @radix-ui/react-slot class-variance-authority clsx
npm install tailwind-merge lucide-react
npm install -D tailwindcss postcss autoprefixer typescript
```

## 🔧 Configuration Turborepo

**turbo.json :**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "type-check": {},
    "test": {},
    "db:generate": {
      "cache": false
    },
    "db:push": {
      "cache": false
    }
  }
}
```

## 🗄️ Configuration Base de Données

### Variables d'Environnement (.env)

```env
# Base de données
DATABASE_URL="postgresql://username:password@localhost:5432/wali_livraison"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# SMS (exemple avec Twilio)
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Paiements
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Orange Money
ORANGE_MONEY_CLIENT_ID="your-orange-client-id"
ORANGE_MONEY_CLIENT_SECRET="your-orange-secret"

# MTN Mobile Money
MTN_SUBSCRIPTION_KEY="your-mtn-key"
MTN_API_USER="your-mtn-user"
MTN_API_KEY="your-mtn-api-key"

# Wave
WAVE_API_KEY="your-wave-key"
WAVE_SECRET="your-wave-secret"

# Upload/Storage
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_BUCKET_NAME="wali-livraison-files"
AWS_REGION="eu-west-1"

# Redis (pour les sessions et cache)
REDIS_URL="redis://localhost:6379"

# Google Maps
GOOGLE_MAPS_API_KEY="your-google-maps-key"
```

### Configuration PostgreSQL

```sql
-- Création de la base de données
CREATE DATABASE wali_livraison;
CREATE USER wali_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE wali_livraison TO wali_user;

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- Pour la géolocalisation
```

## 🚀 Scripts de Développement

### Package.json racine

```json
{
  "name": "wali-livraison",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "test": "turbo run test",
    "db:generate": "turbo run db:generate",
    "db:push": "turbo run db:push",
    "db:migrate": "turbo run db:migrate",
    "db:studio": "turbo run db:studio",
    "clean": "turbo run clean",
    "format": "prettier --write \"**/*.{ts,tsx,md}\"",
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "turbo run build --filter=docs^... && changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.26.0",
    "eslint": "^8.48.0",
    "prettier": "^3.0.0",
    "turbo": "latest",
    "typescript": "^5.0.0"
  },
  "packageManager": "npm@9.0.0",
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

## 🔐 Configuration de Sécurité

### Middleware de Sécurité (NestJS)

```typescript
// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Sécurité
  app.use(helmet());
  app.use(compression());

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limite chaque IP à 100 requêtes par windowMs
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Documentation Swagger
  const config = new DocumentBuilder()
    .setTitle('WALI Livraison API')
    .setDescription('API pour l\'application de livraison WALI')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
```

## 📱 Configuration Mobile

### Configuration React Native

**metro.config.js (pour les apps mobiles) :**
```javascript
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  watchFolders: [
    path.resolve(__dirname, '../../packages'),
  ],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, '../../node_modules'),
    ],
  },
};

module.exports = mergeConfig(defaultConfig, config);
```

### Configuration des Permissions (Android)

**android/app/src/main/AndroidManifest.xml :**
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.CALL_PHONE" />
<uses-permission android:name="android.permission.VIBRATE" />
```

### Configuration iOS (Info.plist)

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Cette app a besoin d'accéder à votre localisation pour les livraisons</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Cette app a besoin d'accéder à votre localisation pour les livraisons</string>
<key>NSCameraUsageDescription</key>
<string>Cette app a besoin d'accéder à la caméra pour les preuves de livraison</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Cette app a besoin d'accéder aux photos pour les preuves de livraison</string>
```

## 🧪 Configuration des Tests

### Jest Configuration

**jest.config.js (racine) :**
```javascript
module.exports = {
  projects: [
    '<rootDir>/apps/api',
    '<rootDir>/apps/admin-panel',
    '<rootDir>/apps/client-web',
    '<rootDir>/packages/shared',
    '<rootDir>/packages/ui',
  ],
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

## 🚀 Commandes de Démarrage

```bash
# Installation des dépendances
npm install

# Génération des types Prisma
npm run db:generate

# Démarrage en mode développement
npm run dev

# Build de production
npm run build

# Tests
npm run test

# Linting
npm run lint

# Formatage du code
npm run format
```
```
