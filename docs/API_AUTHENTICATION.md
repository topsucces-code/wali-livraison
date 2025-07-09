# 🔐 API d'Authentification WALI Livraison

## Vue d'Ensemble

L'API d'authentification de WALI Livraison utilise un système d'authentification par SMS avec codes OTP (One-Time Password) adapté au marché ivoirien. Cette approche privilégie les numéros de téléphone comme identifiants principaux, conformément aux habitudes locales.

## 🎯 Fonctionnalités Principales

### ✅ **Authentification par SMS**
- Inscription et connexion via numéro de téléphone
- Codes OTP à 6 chiffres envoyés par SMS
- Validation automatique des numéros ivoiriens (+225)

### ✅ **Gestion des Tokens JWT**
- Access tokens (15 minutes de validité)
- Refresh tokens (7 jours de validité)
- Rotation automatique des tokens

### ✅ **Sécurité Renforcée**
- Validation des numéros de téléphone
- Chiffrement des données sensibles
- Protection contre les attaques par force brute

## 📱 Endpoints Disponibles

### Base URL
```
http://localhost:3001/api/v1/auth
```

---

## 1. 📝 Inscription d'un Utilisateur

### `POST /register`

Crée un nouveau compte utilisateur et envoie un code OTP par SMS.

#### **Paramètres de Requête**
```json
{
  "phone": "+2250701234567",
  "email": "kouassi.yao@example.com",
  "firstName": "Kouassi",
  "lastName": "Yao",
  "role": "CLIENT"
}
```

#### **Réponse de Succès (201)**
```json
{
  "message": "Compte créé avec succès. Un code de vérification a été envoyé par SMS.",
  "phone": "+2250701234567"
}
```

#### **Erreurs Possibles**
- `409 Conflict` : Un compte existe déjà avec ce numéro
- `400 Bad Request` : Données invalides

---

## 2. 🔑 Connexion d'un Utilisateur

### `POST /login`

Initie la connexion d'un utilisateur existant en envoyant un code OTP.

#### **Paramètres de Requête**
```json
{
  "phone": "+2250701234567"
}
```

#### **Réponse de Succès (200)**
```json
{
  "message": "Un code de vérification a été envoyé par SMS.",
  "phone": "+2250701234567"
}
```

#### **Erreurs Possibles**
- `404 Not Found` : Aucun compte trouvé
- `401 Unauthorized` : Compte désactivé

---

## 3. ✅ Vérification du Code OTP

### `POST /verify-otp`

Vérifie le code OTP et retourne les tokens d'authentification.

#### **Paramètres de Requête**
```json
{
  "phone": "+2250701234567",
  "otp": "123456"
}
```

#### **Réponse de Succès (200)**
```json
{
  "user": {
    "id": "uuid-user-id",
    "phone": "+2250701234567",
    "email": "kouassi.yao@example.com",
    "firstName": "Kouassi",
    "lastName": "Yao",
    "avatar": null,
    "role": "CLIENT",
    "isActive": true,
    "isVerified": true
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### **Erreurs Possibles**
- `401 Unauthorized` : Code OTP invalide ou expiré
- `404 Not Found` : Utilisateur non trouvé

---

## 4. 🔄 Rafraîchissement du Token

### `POST /refresh`

Génère un nouveau token d'accès à partir du refresh token.

#### **Paramètres de Requête**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### **Réponse de Succès (200)**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### **Erreurs Possibles**
- `401 Unauthorized` : Refresh token invalide ou expiré

---

## 5. 👤 Profil Utilisateur

### `GET /profile`

Retourne les informations du profil de l'utilisateur connecté.

#### **Headers Requis**
```
Authorization: Bearer <access_token>
```

#### **Réponse de Succès (200)**
```json
{
  "id": "uuid-user-id",
  "phone": "+2250701234567",
  "email": "kouassi.yao@example.com",
  "firstName": "Kouassi",
  "lastName": "Yao",
  "avatar": null,
  "role": "CLIENT",
  "isActive": true,
  "isVerified": true
}
```

---

## 6. ✔️ Vérification du Token

### `GET /check`

Vérifie la validité du token d'authentification.

#### **Headers Requis**
```
Authorization: Bearer <access_token>
```

#### **Réponse de Succès (200)**
```json
{
  "valid": true,
  "user": {
    "id": "uuid-user-id",
    "phone": "+2250701234567",
    "role": "CLIENT"
  }
}
```

---

## 🔒 Sécurité et Authentification

### **Types de Tokens**

#### Access Token
- **Durée de vie :** 15 minutes
- **Usage :** Authentification des requêtes API
- **Format :** JWT signé avec secret

#### Refresh Token
- **Durée de vie :** 7 jours
- **Usage :** Renouvellement des access tokens
- **Format :** JWT signé avec secret séparé

### **Headers d'Authentification**
```
Authorization: Bearer <access_token>
```

### **Gestion des Erreurs d'Authentification**
- `401 Unauthorized` : Token manquant, invalide ou expiré
- `403 Forbidden` : Permissions insuffisantes

---

## 📱 Spécificités Côte d'Ivoire

### **Format des Numéros de Téléphone**
- **Format accepté :** `+2250701234567`
- **Validation :** Numéros ivoiriens uniquement
- **Normalisation :** Format E.164 automatique

### **Codes OTP**
- **Longueur :** 6 chiffres
- **Validité :** 5 minutes
- **Code de développement :** `123456` (mode dev uniquement)

### **Messages SMS**
- **Vérification :** "Votre code de vérification WALI Livraison est: {code}. Ce code expire dans 5 minutes."
- **Bienvenue :** "Bienvenue sur WALI Livraison, {prénom}! Votre compte a été créé avec succès."

---

## 🧪 Tests et Développement

### **Mode Développement**
- Code OTP universel : `123456`
- SMS simulés (logs uniquement)
- Tokens avec durée étendue

### **Variables d'Environnement**
```env
# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_REFRESH_EXPIRES_IN="7d"

# OTP Configuration
OTP_SECRET="WALI_LIVRAISON_OTP_SECRET"

# Twilio SMS
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
```

---

## 📊 Codes d'Erreur

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Données de requête invalides |
| 401 | Unauthorized | Authentification requise ou invalide |
| 403 | Forbidden | Permissions insuffisantes |
| 404 | Not Found | Ressource non trouvée |
| 409 | Conflict | Conflit (ex: utilisateur existe déjà) |
| 500 | Internal Server Error | Erreur serveur |

---

## 🚀 Utilisation avec les Clients

### **Frontend Web (Next.js)**
```typescript
// Exemple d'utilisation
const authResponse = await fetch('/api/v1/auth/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '+2250701234567', otp: '123456' })
});
```

### **Applications Mobiles**
```typescript
// Stockage sécurisé des tokens
await SecureStore.setItemAsync('accessToken', response.accessToken);
await SecureStore.setItemAsync('refreshToken', response.refreshToken);
```

---

## 📞 Support et Contact

Pour toute question concernant l'API d'authentification :
- **Documentation Swagger :** http://localhost:3001/api/docs
- **Tests automatisés :** `npm run test:auth`
- **Logs de développement :** Consultez la console de l'API

**L'API d'authentification WALI Livraison est optimisée pour le marché ivoirien et prête pour la production !** 🇨🇮
