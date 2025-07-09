# 🔐 Configuration des Secrets GitHub

## Secrets Requis pour CI/CD

Pour que les workflows GitHub Actions fonctionnent correctement, vous devez configurer les secrets suivants dans votre repository GitHub.

### 📍 Comment Ajouter des Secrets

1. Allez dans **Settings** > **Secrets and variables** > **Actions**
2. Cliquez sur **New repository secret**
3. Ajoutez chaque secret avec sa valeur

## 🚀 Secrets de Déploiement

### Staging Environment
```
STAGING_SERVER
Description: Adresse IP ou nom de domaine du serveur de staging
Exemple: staging.wali-livraison.ci

STAGING_SSH_KEY
Description: Clé SSH privée pour accéder au serveur de staging
Format: Clé RSA complète (-----BEGIN OPENSSH PRIVATE KEY-----)
```

### Production Environment
```
PRODUCTION_SERVER
Description: Adresse IP ou nom de domaine du serveur de production
Exemple: api.wali-livraison.ci

PRODUCTION_SSH_KEY
Description: Clé SSH privée pour accéder au serveur de production
Format: Clé RSA complète (-----BEGIN OPENSSH PRIVATE KEY-----)
```

## 📢 Secrets de Notification

### Slack Integration
```
SLACK_WEBHOOK
Description: URL du webhook Slack pour les notifications de déploiement
Format: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
```

## 🔒 Secrets de Base de Données

### Database Access
```
DATABASE_URL
Description: URL de connexion à la base de données de production
Format: postgresql://user:password@host:port/database

REDIS_URL
Description: URL de connexion à Redis
Format: redis://user:password@host:port
```

## 🔑 Secrets d'API

### Services Externes
```
JWT_SECRET
Description: Clé secrète pour signer les tokens JWT
Format: Chaîne aléatoire sécurisée (minimum 32 caractères)

STRIPE_SECRET_KEY
Description: Clé secrète Stripe pour les paiements
Format: sk_live_... ou sk_test_...

TWILIO_AUTH_TOKEN
Description: Token d'authentification Twilio pour SMS
Format: Token fourni par Twilio

GOOGLE_MAPS_API_KEY
Description: Clé API Google Maps pour la géolocalisation
Format: Clé fournie par Google Cloud Console
```

## 📱 Secrets Mobile Money

### Orange Money
```
ORANGE_MONEY_API_KEY
Description: Clé API Orange Money
Format: Clé fournie par Orange

ORANGE_MONEY_SECRET
Description: Secret Orange Money
Format: Secret fourni par Orange
```

### MTN Mobile Money
```
MTN_API_KEY
Description: Clé API MTN Mobile Money
Format: Clé fournie par MTN

MTN_API_SECRET
Description: Secret MTN Mobile Money
Format: Secret fourni par MTN
```

### Wave
```
WAVE_API_KEY
Description: Clé API Wave
Format: Clé fournie par Wave

WAVE_SECRET
Description: Secret Wave
Format: Secret fourni par Wave
```

## 🛡️ Secrets de Sécurité

### Monitoring et Logs
```
SENTRY_DSN
Description: DSN Sentry pour le monitoring des erreurs
Format: https://...@sentry.io/...

DATADOG_API_KEY
Description: Clé API Datadog pour les métriques
Format: Clé fournie par Datadog
```

## ⚠️ Bonnes Pratiques

### Sécurité des Secrets
1. **Ne jamais** commiter de secrets dans le code
2. **Utiliser** des secrets différents pour staging et production
3. **Rotation régulière** des clés et tokens
4. **Accès minimal** - donner seulement les permissions nécessaires

### Validation des Secrets
```bash
# Vérifier que tous les secrets sont configurés
gh secret list

# Tester la connectivité
curl -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/OWNER/REPO/actions/secrets
```

## 🔄 Mise à Jour des Secrets

### Quand Mettre à Jour
- Rotation de sécurité programmée
- Compromission suspectée
- Changement d'environnement
- Mise à jour des services tiers

### Comment Mettre à Jour
1. Générer les nouvelles clés/tokens
2. Tester en staging d'abord
3. Mettre à jour les secrets GitHub
4. Déployer et vérifier
5. Révoquer les anciens secrets

## 📞 Support

En cas de problème avec les secrets :
1. Vérifier la syntaxe et le format
2. Tester les connexions manuellement
3. Consulter les logs GitHub Actions
4. Contacter l'équipe DevOps

---

**Important :** Ces secrets sont critiques pour la sécurité et le fonctionnement de WALI Livraison. Traitez-les avec le plus grand soin !
