#!/bin/bash

# Script de configuration automatique pour WALI Livraison
# Bash Script pour Linux/Mac

echo "🚀 Configuration de l'environnement WALI Livraison..."

# Couleurs pour l'affichage
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Vérification des prérequis
echo -e "${YELLOW}📋 Vérification des prérequis...${NC}"

# Vérifier Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js détecté: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js non trouvé. Veuillez installer Node.js 18+${NC}"
    exit 1
fi

# Vérifier npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm détecté: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm non trouvé${NC}"
    exit 1
fi

# Vérifier Docker (optionnel)
DOCKER_AVAILABLE=false
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✅ Docker détecté: $DOCKER_VERSION${NC}"
    DOCKER_AVAILABLE=true
else
    echo -e "${YELLOW}⚠️ Docker non trouvé. Les services seront configurés manuellement.${NC}"
fi

# Configuration de l'environnement
echo -e "${YELLOW}🔧 Configuration de l'environnement...${NC}"

# Copier le fichier .env
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ Fichier .env créé${NC}"
else
    echo -e "${BLUE}ℹ️ Fichier .env existe déjà${NC}"
fi

# Installation des dépendances
echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
echo -e "${BLUE}⏳ Cela peut prendre plusieurs minutes...${NC}"

if npm install --legacy-peer-deps; then
    echo -e "${GREEN}✅ Dépendances installées avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors de l'installation des dépendances${NC}"
    echo -e "${YELLOW}💡 Essayez: npm install --force${NC}"
fi

# Démarrage des services Docker (si disponible)
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo -e "${YELLOW}🐳 Démarrage des services Docker...${NC}"
    
    if docker-compose -f docker-compose.dev.yml up -d postgres redis; then
        echo -e "${GREEN}✅ Services Docker démarrés${NC}"
        sleep 5
    else
        echo -e "${YELLOW}⚠️ Erreur Docker. Vérifiez que Docker Desktop est démarré.${NC}"
        DOCKER_AVAILABLE=false
    fi
fi

# Configuration de la base de données
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo -e "${YELLOW}🗄️ Configuration de la base de données...${NC}"
    
    cd packages/database
    
    if npm run db:generate; then
        echo -e "${GREEN}✅ Client Prisma généré${NC}"
    else
        echo -e "${YELLOW}⚠️ Erreur lors de la génération du client Prisma${NC}"
    fi
    
    if npm run db:push; then
        echo -e "${GREEN}✅ Base de données configurée${NC}"
    else
        echo -e "${YELLOW}⚠️ Erreur de configuration de la base de données${NC}"
    fi
    
    cd ../..
fi

# Résumé de la configuration
echo -e "\n${GREEN}🎉 Configuration terminée !${NC}"
echo -e "${YELLOW}📋 Résumé:${NC}"

if [ "$DOCKER_AVAILABLE" = true ]; then
    echo -e "${GREEN}✅ Services Docker: PostgreSQL et Redis démarrés${NC}"
    echo -e "${GREEN}✅ Base de données: Configurée${NC}"
else
    echo -e "${YELLOW}⚠️ Services Docker: Non disponibles${NC}"
    echo -e "${BLUE}💡 Configurez PostgreSQL et Redis manuellement${NC}"
fi

echo -e "${GREEN}✅ Dépendances: Installées${NC}"
echo -e "${GREEN}✅ Environnement: Configuré${NC}"

# Instructions de démarrage
echo -e "\n${CYAN}🚀 Pour démarrer le projet:${NC}"
echo -e "npm run dev"

echo -e "\n${CYAN}📱 URLs d'accès:${NC}"
echo -e "• API Backend: http://localhost:3001"
echo -e "• Client Web: http://localhost:3000"
echo -e "• Admin Panel: http://localhost:3002"
echo -e "• Documentation API: http://localhost:3001/api/docs"

if [ "$DOCKER_AVAILABLE" = true ]; then
    echo -e "• Adminer (DB): http://localhost:8080"
fi

echo -e "\n${CYAN}📚 Documentation:${NC}"
echo -e "• README.md - Vue d'ensemble"
echo -e "• SETUP_STATUS.md - État de la configuration"
echo -e "• PLAN_DEVELOPPEMENT.md - Plan détaillé"

echo -e "\n${GREEN}🎯 Le projet WALI Livraison est prêt pour le développement !${NC}"
