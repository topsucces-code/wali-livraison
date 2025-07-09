# 🔧 Démarrage Manuel - WALI Livraison

## ⚠️ Problèmes Identifiés et Solution Manuelle

Nous avons rencontré des conflits de dépendances avec les packages React Native et certains packages Radix UI. Voici la **solution manuelle étape par étape** pour démarrer le projet.

## 🚀 Solution Recommandée : Installation Manuelle

### Étape 1: Nettoyage Initial
```bash
# Supprimer les node_modules existants
rm -rf node_modules
rm -rf package-lock.json

# Ou sur Windows PowerShell :
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
```

### Étape 2: Installation des Outils de Base
```bash
# Installer les outils essentiels globalement
npm install -g turbo

# Installer les dépendances de base du projet racine
npm init -y
npm install turbo prettier eslint typescript --save-dev
```

### Étape 3: Installation des Packages Partagés
```bash
# Package Database
cd packages/database
npm install @prisma/client prisma tsx --save
npm install typescript --save-dev

# Package Shared  
cd ../shared
npm install zod --save
npm install typescript --save-dev

# Package UI
cd ../ui
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react --save
npm install typescript react @types/react --save-dev

cd ../..
```

### Étape 4: Installation Backend API
```bash
cd apps/api
npm init -y

# Dépendances principales NestJS
npm install @nestjs/common @nestjs/core @nestjs/platform-express
npm install @nestjs/config @nestjs/jwt @nestjs/passport @nestjs/swagger
npm install @prisma/client prisma passport passport-jwt bcryptjs
npm install class-validator class-transformer reflect-metadata rxjs

# Dépendances de développement
npm install -D @nestjs/cli @nestjs/testing typescript @types/node
npm install -D @types/passport-jwt @types/bcryptjs

cd ../..
```

### Étape 5: Installation Frontend Client Web
```bash
cd apps/client-web
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Dépendances supplémentaires
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @tanstack/react-query axios react-hook-form zod
npm install lucide-react class-variance-authority clsx tailwind-merge

cd ../..
```

### Étape 6: Installation Admin Panel
```bash
cd apps/admin-panel
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Dépendances supplémentaires
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @tanstack/react-query @tanstack/react-table axios
npm install recharts react-hook-form zod next-auth
npm install lucide-react class-variance-authority clsx tailwind-merge

cd ../..
```

### Étape 7: Configuration de la Base de Données
```bash
# Copier le fichier d'environnement
cp .env.example .env

# Éditer .env avec vos valeurs :
# DATABASE_URL="postgresql://postgres:password@localhost:5432/wali_livraison"
# JWT_SECRET="your-secret-key"

# Générer le client Prisma
cd packages/database
npx prisma generate
npx prisma db push

cd ../..
```

### Étape 8: Applications React Native (Optionnel)
```bash
# Créer les applications React Native séparément
npx react-native@latest init WaliClient --template react-native-template-typescript
npx react-native@latest init WaliDriver --template react-native-template-typescript

# Les déplacer dans le dossier apps
mv WaliClient apps/mobile-client-rn
mv WaliDriver apps/mobile-driver-rn
```

## 🎯 Démarrage des Applications

### Backend API
```bash
cd apps/api
npm run start:dev
# Accessible sur http://localhost:3001
```

### Client Web
```bash
cd apps/client-web
npm run dev
# Accessible sur http://localhost:3000
```

### Admin Panel
```bash
cd apps/admin-panel
npm run dev
# Accessible sur http://localhost:3002
```

## 📋 Configuration Minimale Fonctionnelle

### 1. Fichier .env Minimal
```env
# Base de données (PostgreSQL local ou Docker)
DATABASE_URL="postgresql://postgres:password@localhost:5432/wali_livraison"

# JWT pour l'authentification
JWT_SECRET="development-secret-key-change-in-production"

# Environnement
NODE_ENV="development"

# Ports (optionnel)
PORT=3001
```

### 2. Base de Données PostgreSQL

**Option A: Docker (Recommandé)**
```bash
# Créer un fichier docker-compose-simple.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: wali_livraison
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:

# Démarrer
docker-compose -f docker-compose-simple.yml up -d
```

**Option B: Installation Locale**
- Installer PostgreSQL 15+
- Créer la base de données `wali_livraison`
- Configurer l'URL dans .env

### 3. Scripts package.json Racine Simplifié
```json
{
  "name": "wali-livraison",
  "private": true,
  "scripts": {
    "dev:api": "cd apps/api && npm run start:dev",
    "dev:web": "cd apps/client-web && npm run dev",
    "dev:admin": "cd apps/admin-panel && npm run dev",
    "db:generate": "cd packages/database && npx prisma generate",
    "db:push": "cd packages/database && npx prisma db push",
    "db:studio": "cd packages/database && npx prisma studio"
  },
  "devDependencies": {
    "turbo": "latest",
    "prettier": "^3.0.0",
    "typescript": "^5.0.0"
  }
}
```

## ✅ Vérification du Fonctionnement

### Tests de Base
```bash
# Tester la génération Prisma
npm run db:generate

# Tester le démarrage des applications
npm run dev:api    # Port 3001
npm run dev:web    # Port 3000  
npm run dev:admin  # Port 3002
```

### URLs de Vérification
- **API Backend :** http://localhost:3001
- **Client Web :** http://localhost:3000
- **Admin Panel :** http://localhost:3002
- **Prisma Studio :** http://localhost:5555 (avec `npm run db:studio`)

## 🎉 Résultat Attendu

Après cette installation manuelle :
- ✅ Backend NestJS fonctionnel
- ✅ Frontend Next.js opérationnel  
- ✅ Base de données configurée
- ✅ Environnement de développement prêt

## 📞 Support

Si vous rencontrez encore des problèmes :

1. **Vérifiez les versions :**
   - Node.js 18+
   - npm 9+
   - PostgreSQL 15+

2. **Nettoyez le cache :**
   ```bash
   npm cache clean --force
   ```

3. **Installez les dépendances une par une** plutôt qu'en lot

4. **Utilisez les versions exactes** spécifiées dans les package.json

**Le projet WALI Livraison sera opérationnel avec cette approche manuelle !** 🚀
