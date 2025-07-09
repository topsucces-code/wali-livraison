# Script de configuration automatique pour WALI Livraison
# PowerShell Script pour Windows

Write-Host "🚀 Configuration de l'environnement WALI Livraison..." -ForegroundColor Green

# Vérification des prérequis
Write-Host "📋 Vérification des prérequis..." -ForegroundColor Yellow

# Vérifier Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js détecté: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js non trouvé. Veuillez installer Node.js 18+" -ForegroundColor Red
    exit 1
}

# Vérifier npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm détecté: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm non trouvé" -ForegroundColor Red
    exit 1
}

# Vérifier Docker (optionnel)
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker détecté: $dockerVersion" -ForegroundColor Green
    $dockerAvailable = $true
} catch {
    Write-Host "⚠️ Docker non trouvé. Les services seront configurés manuellement." -ForegroundColor Yellow
    $dockerAvailable = $false
}

# Configuration de l'environnement
Write-Host "🔧 Configuration de l'environnement..." -ForegroundColor Yellow

# Copier le fichier .env
if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Fichier .env créé" -ForegroundColor Green
} else {
    Write-Host "ℹ️ Fichier .env existe déjà" -ForegroundColor Blue
}

# Installation des dépendances
Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
Write-Host "⏳ Cela peut prendre plusieurs minutes..." -ForegroundColor Blue

# Étape 1: Installer les outils de base
Write-Host "🔧 Installation des outils de base..." -ForegroundColor Blue
try {
    npm install turbo prettier eslint typescript --save-dev
    Write-Host "✅ Outils de base installés" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Erreur lors de l'installation des outils de base" -ForegroundColor Yellow
}

# Étape 2: Installer les packages partagés
Write-Host "📦 Installation des packages partagés..." -ForegroundColor Blue
try {
    Set-Location "packages/database"
    npm install
    Set-Location "../shared"
    npm install
    Set-Location "../ui"
    npm install
    Set-Location "../.."
    Write-Host "✅ Packages partagés installés" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Erreur lors de l'installation des packages partagés" -ForegroundColor Yellow
    Set-Location "../.."
}

# Étape 3: Installer les applications web
Write-Host "🌐 Installation des applications web..." -ForegroundColor Blue
try {
    Set-Location "apps/api"
    npm install
    Set-Location "../client-web"
    npm install
    Set-Location "../admin-panel"
    npm install
    Set-Location "../.."
    Write-Host "✅ Applications web installées" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Erreur lors de l'installation des applications web" -ForegroundColor Yellow
    Set-Location "../.."
}

# Étape 4: Applications mobiles (optionnel)
Write-Host "📱 Installation des applications mobiles (optionnel)..." -ForegroundColor Blue
$installMobile = Read-Host "Installer les applications mobiles React Native ? (y/N)"
if ($installMobile -eq "y" -or $installMobile -eq "Y") {
    try {
        Set-Location "apps/mobile-client"
        npm install --legacy-peer-deps
        Set-Location "../mobile-driver"
        npm install --legacy-peer-deps
        Set-Location "../.."
        Write-Host "✅ Applications mobiles installées" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Erreur lors de l'installation des applications mobiles" -ForegroundColor Yellow
        Write-Host "💡 Les applications mobiles peuvent être installées plus tard" -ForegroundColor Blue
        Set-Location "../.."
    }
} else {
    Write-Host "⏭️ Applications mobiles ignorées (peuvent être installées plus tard)" -ForegroundColor Blue
}

# Démarrage des services Docker (si disponible)
if ($dockerAvailable) {
    Write-Host "🐳 Démarrage des services Docker..." -ForegroundColor Yellow
    
    try {
        docker-compose -f docker-compose.dev.yml up -d postgres redis
        Write-Host "✅ Services Docker démarrés" -ForegroundColor Green
        Start-Sleep -Seconds 5
    } catch {
        Write-Host "⚠️ Erreur Docker. Vérifiez que Docker Desktop est démarré." -ForegroundColor Yellow
        $dockerAvailable = $false
    }
}

# Configuration de la base de données
if ($dockerAvailable) {
    Write-Host "🗄️ Configuration de la base de données..." -ForegroundColor Yellow
    
    try {
        Set-Location "packages/database"
        npm run db:generate
        Write-Host "✅ Client Prisma généré" -ForegroundColor Green
        
        npm run db:push
        Write-Host "✅ Base de données configurée" -ForegroundColor Green
        
        Set-Location "../.."
    } catch {
        Write-Host "⚠️ Erreur de configuration de la base de données" -ForegroundColor Yellow
        Set-Location "../.."
    }
}

# Résumé de la configuration
Write-Host "`n🎉 Configuration terminée !" -ForegroundColor Green
Write-Host "📋 Résumé:" -ForegroundColor Yellow

if ($dockerAvailable) {
    Write-Host "✅ Services Docker: PostgreSQL et Redis démarrés" -ForegroundColor Green
    Write-Host "✅ Base de données: Configurée" -ForegroundColor Green
} else {
    Write-Host "⚠️ Services Docker: Non disponibles" -ForegroundColor Yellow
    Write-Host "💡 Configurez PostgreSQL et Redis manuellement" -ForegroundColor Blue
}

Write-Host "✅ Dépendances: Installées" -ForegroundColor Green
Write-Host "✅ Environnement: Configuré" -ForegroundColor Green

# Instructions de démarrage
Write-Host "`n🚀 Pour démarrer le projet:" -ForegroundColor Cyan
Write-Host "npm run dev" -ForegroundColor White

Write-Host "`n📱 URLs d'accès:" -ForegroundColor Cyan
Write-Host "• API Backend: http://localhost:3001" -ForegroundColor White
Write-Host "• Client Web: http://localhost:3000" -ForegroundColor White
Write-Host "• Admin Panel: http://localhost:3002" -ForegroundColor White
Write-Host "• Documentation API: http://localhost:3001/api/docs" -ForegroundColor White

if ($dockerAvailable) {
    Write-Host "• Adminer (DB): http://localhost:8080" -ForegroundColor White
}

Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
Write-Host "• README.md - Vue d'ensemble" -ForegroundColor White
Write-Host "• SETUP_STATUS.md - État de la configuration" -ForegroundColor White
Write-Host "• PLAN_DEVELOPPEMENT.md - Plan détaillé" -ForegroundColor White

Write-Host "`n🎯 Le projet WALI Livraison est prêt pour le développement !" -ForegroundColor Green
