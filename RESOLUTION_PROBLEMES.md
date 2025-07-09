# 🔧 Résolution des Problèmes - WALI Livraison

## ❌ Problèmes Identifiés et Solutions

### 1. Conflits de Dépendances React Native

**Problème :**
```
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR! Could not resolve dependency:
npm ERR! peer react@">= 18.3.1" from react-native-maps@1.24.3
```

**Cause :** Version de React incompatible avec react-native-maps

**✅ Solution :**
```bash
# Option A: Installation avec résolution forcée
npm install --legacy-peer-deps

# Option B: Installation par étapes
npm install turbo prettier eslint typescript --save-dev
cd packages/database && npm install
cd ../shared && npm install
cd ../ui && npm install
cd ../../apps/api && npm install
cd ../client-web && npm install
cd ../admin-panel && npm install
```

### 2. Docker Desktop Non Démarré

**Problème :**
```
unable to get image 'redis:7-alpine': error during connect
open //./pipe/dockerDesktopLinuxEngine: Le fichier spécifié est introuvable
```

**Cause :** Docker Desktop n'est pas démarré

**✅ Solutions :**

**Option A: Démarrer Docker Desktop**
1. Ouvrir Docker Desktop
2. Attendre qu'il soit complètement démarré
3. Relancer : `docker-compose -f docker-compose.dev.yml up -d`

**Option B: Installation locale (sans Docker)**
```bash
# Installer PostgreSQL localement
# Windows: https://www.postgresql.org/download/windows/
# Créer la base de données
createdb wali_livraison

# Installer Redis localement  
# Windows: https://github.com/microsoftarchive/redis/releases
```

### 3. Package react-native-async-storage Introuvable

**Problème :**
```
npm ERR! notarget No matching version found for react-native-async-storage@^1
```

**Cause :** Nom de package incorrect

**✅ Solution :**
Le package correct est `@react-native-async-storage/async-storage`

```bash
# Déjà corrigé dans les fichiers package.json
```

### 4. Commande chmod Non Reconnue (Windows)

**Problème :**
```
chmod : Le terme «chmod» n'est pas reconnu
```

**Cause :** chmod est une commande Unix/Linux

**✅ Solution :**
Sur Windows, utilisez PowerShell directement :
```powershell
# Au lieu de chmod +x scripts/setup.sh
.\scripts\setup.ps1
```

## 🚀 Installation Étape par Étape (Méthode Recommandée)

### Étape 1: Outils de Base
```bash
npm install turbo prettier eslint typescript --save-dev
```

### Étape 2: Packages Partagés
```bash
cd packages/database
npm install
cd ../shared  
npm install
cd ../ui
npm install
cd ../..
```

### Étape 3: Applications Web
```bash
cd apps/api
npm install
cd ../client-web
npm install  
cd ../admin-panel
npm install
cd ../..
```

### Étape 4: Base de Données (avec Docker)
```bash
# Démarrer Docker Desktop d'abord
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Configurer Prisma
cd packages/database
npm run db:generate
npm run db:push
cd ../..
```

### Étape 5: Applications Mobiles (Optionnel)
```bash
cd apps/mobile-client
npm install --legacy-peer-deps
cd ../mobile-driver  
npm install --legacy-peer-deps
cd ../..
```

## 🔧 Script de Résolution Automatique

### Windows PowerShell
```powershell
.\scripts\setup.ps1
```

### Linux/Mac
```bash
./scripts/setup.sh
```

## 🆘 Solutions Alternatives

### Si Docker ne fonctionne pas

**1. PostgreSQL Local :**
```bash
# Installer PostgreSQL 15+
# Modifier .env :
DATABASE_URL="postgresql://postgres:password@localhost:5432/wali_livraison"
```

**2. Redis Local :**
```bash
# Installer Redis
# Modifier .env :
REDIS_URL="redis://localhost:6379"
```

### Si React Native pose problème

**1. Ignorer les apps mobiles temporairement :**
```bash
# Modifier package.json racine, retirer :
# "apps/mobile-client",
# "apps/mobile-driver"
```

**2. Créer les apps mobiles séparément :**
```bash
npx react-native@latest init WaliClient --template react-native-template-typescript
npx react-native@latest init WaliDriver --template react-native-template-typescript
```

## ✅ Vérification de l'Installation

### Tests de Base
```bash
# Vérifier Turbo
npx turbo --version

# Vérifier les packages
cd packages/shared && npm run build
cd ../database && npm run db:generate

# Vérifier les apps web
cd ../../apps/api && npm run build
cd ../client-web && npm run build
cd ../admin-panel && npm run build
```

### Démarrage Test
```bash
# Démarrer en mode développement
npm run dev

# Vérifier les URLs :
# http://localhost:3001 - API
# http://localhost:3000 - Client Web  
# http://localhost:3002 - Admin Panel
```

## 📞 Support Supplémentaire

### Logs Détaillés
```bash
# Voir les logs npm détaillés
npm install --verbose

# Voir les logs Docker
docker-compose -f docker-compose.dev.yml logs
```

### Nettoyage et Redémarrage
```bash
# Nettoyer le cache npm
npm cache clean --force

# Supprimer node_modules
rm -rf node_modules
rm -rf apps/*/node_modules  
rm -rf packages/*/node_modules

# Réinstaller
npm install --legacy-peer-deps
```

### Variables d'Environnement Minimales
```env
# .env minimal pour démarrer
DATABASE_URL="postgresql://postgres:password@localhost:5432/wali_livraison"
JWT_SECRET="development-secret-key"
NODE_ENV="development"
```

## 🎯 Résultat Attendu

Après résolution des problèmes :
- ✅ Toutes les dépendances installées
- ✅ Base de données accessible
- ✅ Applications web démarrables
- ✅ Documentation accessible
- ✅ Environnement de développement fonctionnel

**Le projet WALI Livraison sera prêt pour le développement !** 🚀
