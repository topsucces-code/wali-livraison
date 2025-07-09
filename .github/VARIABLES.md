# ⚙️ Configuration des Variables GitHub

## Variables d'Environnement pour CI/CD

Ce document explique comment configurer les variables d'environnement pour les workflows GitHub Actions de WALI Livraison.

### 📍 Comment Ajouter des Variables

1. Allez dans **Settings** > **Secrets and variables** > **Actions**
2. Cliquez sur l'onglet **Variables**
3. Cliquez sur **New repository variable**
4. Ajoutez chaque variable avec sa valeur

## 🔧 Variables de Configuration

### Contrôle des Déploiements
```
ENABLE_STAGING_DEPLOY
Description: Active/désactive le déploiement automatique en staging
Valeurs: 'true' ou 'false'
Défaut: 'false'

ENABLE_PRODUCTION_DEPLOY
Description: Active/désactive le déploiement automatique en production
Valeurs: 'true' ou 'false'
Défaut: 'false'
```

### Configuration des Environnements
```
NODE_ENV
Description: Environnement Node.js
Valeurs: 'development', 'staging', 'production'
Défaut: 'production'

API_VERSION
Description: Version de l'API
Format: 'v1', 'v2', etc.
Défaut: 'v1'
```

## 🚀 Variables de Déploiement

### Serveurs de Déploiement
```
STAGING_DOMAIN
Description: Domaine du serveur de staging
Exemple: staging.wali-livraison.ci

PRODUCTION_DOMAIN
Description: Domaine du serveur de production
Exemple: api.wali-livraison.ci

CDN_URL
Description: URL du CDN pour les assets statiques
Exemple: https://cdn.wali-livraison.ci
```

### Configuration Docker
```
DOCKER_REGISTRY
Description: Registry Docker pour les images
Exemple: ghcr.io/wali-team

DOCKER_IMAGE_TAG
Description: Tag par défaut pour les images Docker
Exemple: latest, stable

DOCKER_BUILD_ARGS
Description: Arguments de build Docker
Exemple: --platform=linux/amd64
```

## 📊 Variables de Monitoring

### Métriques et Logs
```
ENABLE_MONITORING
Description: Active/désactive le monitoring
Valeurs: 'true' ou 'false'
Défaut: 'true'

LOG_LEVEL
Description: Niveau de log
Valeurs: 'debug', 'info', 'warn', 'error'
Défaut: 'info'

METRICS_ENDPOINT
Description: Endpoint pour les métriques
Exemple: https://metrics.wali-livraison.ci
```

## 🔒 Variables de Sécurité

### Configuration de Sécurité
```
SECURITY_SCAN_ENABLED
Description: Active/désactive les scans de sécurité
Valeurs: 'true' ou 'false'
Défaut: 'true'

VULNERABILITY_THRESHOLD
Description: Seuil de vulnérabilités acceptées
Valeurs: 'low', 'medium', 'high', 'critical'
Défaut: 'medium'
```

## 🧪 Variables de Test

### Configuration des Tests
```
RUN_E2E_TESTS
Description: Active/désactive les tests E2E
Valeurs: 'true' ou 'false'
Défaut: 'true'

TEST_TIMEOUT
Description: Timeout pour les tests (en minutes)
Exemple: '30'
Défaut: '15'

PARALLEL_TESTS
Description: Nombre de tests en parallèle
Exemple: '4'
Défaut: '2'
```

## 📱 Variables Spécifiques à WALI

### Configuration Métier
```
SUPPORTED_COUNTRIES
Description: Pays supportés (séparés par des virgules)
Exemple: 'CI,BF,ML'
Défaut: 'CI'

DEFAULT_CURRENCY
Description: Devise par défaut
Exemple: 'XOF'
Défaut: 'XOF'

MAX_DELIVERY_DISTANCE
Description: Distance maximale de livraison (en km)
Exemple: '50'
Défaut: '30'
```

### Intégrations Tierces
```
PAYMENT_PROVIDERS
Description: Fournisseurs de paiement activés
Exemple: 'stripe,orange_money,mtn_money,wave'
Défaut: 'stripe'

SMS_PROVIDER
Description: Fournisseur SMS
Valeurs: 'twilio', 'orange', 'custom'
Défaut: 'twilio'

MAP_PROVIDER
Description: Fournisseur de cartes
Valeurs: 'google', 'mapbox', 'osm'
Défaut: 'google'
```

## 🔄 Variables par Environnement

### Development
```
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_MONITORING=false
RUN_E2E_TESTS=false
```

### Staging
```
NODE_ENV=staging
LOG_LEVEL=info
ENABLE_MONITORING=true
RUN_E2E_TESTS=true
ENABLE_STAGING_DEPLOY=true
```

### Production
```
NODE_ENV=production
LOG_LEVEL=warn
ENABLE_MONITORING=true
RUN_E2E_TESTS=false
ENABLE_PRODUCTION_DEPLOY=true
SECURITY_SCAN_ENABLED=true
```

## 📋 Checklist de Configuration

### Configuration Initiale
- [ ] Variables de base configurées
- [ ] Environnements définis
- [ ] Déploiements configurés
- [ ] Monitoring activé

### Avant le Premier Déploiement
- [ ] Domaines configurés
- [ ] Secrets ajoutés
- [ ] Tests validés
- [ ] Sécurité vérifiée

### Maintenance Régulière
- [ ] Variables mises à jour
- [ ] Logs vérifiés
- [ ] Métriques surveillées
- [ ] Sécurité auditée

## 🛠️ Commandes Utiles

### Lister les Variables
```bash
# Via GitHub CLI
gh variable list

# Via API
curl -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/OWNER/REPO/actions/variables
```

### Définir une Variable
```bash
# Via GitHub CLI
gh variable set VARIABLE_NAME --body "value"

# Via interface web
# Settings > Secrets and variables > Actions > Variables
```

## 📞 Support

Pour toute question sur la configuration des variables :
1. Consulter la documentation GitHub Actions
2. Vérifier les logs des workflows
3. Tester en staging d'abord
4. Contacter l'équipe DevOps

---

**Note :** Ces variables contrôlent le comportement des workflows CI/CD. Configurez-les selon vos besoins spécifiques.
