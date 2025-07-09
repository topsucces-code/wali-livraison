# 🗺️ Configuration Google Maps API pour WALI Livraison

## 🔧 Étapes de Configuration Google Cloud Console

### 1. Créer un Projet Google Cloud
1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un nouveau projet ou sélectionner un projet existant
3. Nommer le projet : "WALI Livraison Maps"

### 2. Activer les APIs Nécessaires
Dans Google Cloud Console, aller dans "APIs & Services" > "Library" et activer :

#### APIs Requises :
- ✅ **Maps JavaScript API** (pour les cartes interactives)
- ✅ **Places API** (pour l'autocomplete d'adresses)
- ✅ **Geocoding API** (pour convertir adresses ↔ coordonnées)
- ✅ **Distance Matrix API** (pour calculer distances et temps)
- ✅ **Directions API** (pour les itinéraires)

### 3. Créer une Clé API
1. Aller dans "APIs & Services" > "Credentials"
2. Cliquer "Create Credentials" > "API Key"
3. Copier la clé générée

### 4. Configurer les Restrictions de Sécurité

#### Restrictions d'Application (Recommandé pour Production)
1. Éditer la clé API créée
2. Sous "Application restrictions", choisir "HTTP referrers (web sites)"
3. Ajouter les domaines autorisés :
   ```
   http://localhost:3003/*
   https://votre-domaine.com/*
   https://www.votre-domaine.com/*
   ```

#### Restrictions d'API
1. Sous "API restrictions", choisir "Restrict key"
2. Sélectionner uniquement les APIs nécessaires :
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Distance Matrix API
   - Directions API

### 5. Configurer la Facturation
⚠️ **Important** : Google Maps API nécessite un compte de facturation activé
1. Aller dans "Billing" dans Google Cloud Console
2. Associer une carte de crédit au projet
3. Les premiers $200/mois sont gratuits pour la plupart des utilisations

## 🔑 Configuration dans l'Application

### Fichier .env.local
```bash
# Google Maps API (Frontend)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="VOTRE_CLE_API_ICI"
```

### Fichier apps/api/.env (Backend)
```bash
# Google Maps API (Backend)
GOOGLE_MAPS_API_KEY="VOTRE_CLE_API_ICI"
```

## 🧪 Test de la Configuration

### 1. Vérifier que l'API fonctionne
Aller sur : http://localhost:3003/test-maps-simple

### 2. Tester les fonctionnalités
- ✅ Chargement de la carte
- ✅ Géolocalisation
- ✅ Autocomplete d'adresses
- ✅ Markers personnalisés

## 🚨 Résolution des Problèmes Courants

### Erreur : "Google Maps JavaScript API error: RefererNotAllowedMapError"
**Solution :** Vérifier les restrictions de domaine dans Google Cloud Console

### Erreur : "This API project is not authorized to use this API"
**Solution :** Activer l'API correspondante dans Google Cloud Console

### Erreur : "You must enable Billing on the Google Cloud Project"
**Solution :** Activer la facturation dans Google Cloud Console

### Erreur : "The provided API key is expired"
**Solution :** Régénérer une nouvelle clé API

### Carte ne se charge pas
**Solutions :**
1. Vérifier que la clé API est correcte dans .env.local
2. Vérifier que les APIs sont activées
3. Vérifier les restrictions de domaine
4. Consulter la console JavaScript (F12) pour plus de détails

## 💰 Estimation des Coûts

### Usage Gratuit (par mois)
- **Maps JavaScript API** : 28,000 chargements gratuits
- **Places API** : 17,000 requêtes gratuites
- **Geocoding API** : 40,000 requêtes gratuites
- **Distance Matrix API** : 40,000 éléments gratuits

### Coûts après Quota Gratuit
- **Maps JavaScript API** : $7 pour 1,000 chargements supplémentaires
- **Places API** : $17 pour 1,000 requêtes supplémentaires
- **Geocoding API** : $5 pour 1,000 requêtes supplémentaires

## 🔒 Sécurité et Bonnes Pratiques

### Pour le Développement
```bash
# Restrictions de domaine pour développement
http://localhost:3003/*
http://127.0.0.1:3003/*
```

### Pour la Production
```bash
# Restrictions de domaine pour production
https://wali-livraison.com/*
https://www.wali-livraison.com/*
https://app.wali-livraison.com/*
```

### Recommandations
1. **Jamais** exposer la clé API dans le code source public
2. Utiliser des restrictions d'API strictes
3. Monitorer l'usage pour éviter les dépassements de quota
4. Utiliser des clés différentes pour développement et production

## 📞 Support

Si vous rencontrez des problèmes :
1. Consulter la [documentation officielle Google Maps](https://developers.google.com/maps/documentation)
2. Vérifier les [quotas et limites](https://developers.google.com/maps/documentation/javascript/usage-and-billing)
3. Utiliser les pages de test intégrées dans l'application
