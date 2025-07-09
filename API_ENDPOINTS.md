# Documentation des APIs - WALI LIVRAISON

## 🔐 Authentification

### Auth Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| POST | `/auth/register` | Inscription utilisateur | `{ phone, firstName, lastName, role }` |
| POST | `/auth/login` | Connexion | `{ phone, password }` |
| POST | `/auth/verify-phone` | Vérification téléphone | `{ phone, code }` |
| POST | `/auth/send-sms` | Envoi code SMS | `{ phone }` |
| POST | `/auth/refresh` | Renouvellement token | `{ refreshToken }` |
| POST | `/auth/logout` | Déconnexion | - |
| POST | `/auth/forgot-password` | Mot de passe oublié | `{ phone }` |
| POST | `/auth/reset-password` | Réinitialisation | `{ phone, code, newPassword }` |

## 👥 Gestion des Utilisateurs

### Users Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| GET | `/users/profile` | Profil utilisateur connecté | - |
| PUT | `/users/profile` | Mise à jour profil | `{ firstName, lastName, email, avatar }` |
| GET | `/users/:id` | Profil utilisateur par ID | - |
| DELETE | `/users/account` | Suppression compte | - |

### Addresses Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| GET | `/addresses` | Liste des adresses utilisateur | - |
| POST | `/addresses` | Création adresse | `{ label, street, city, district, landmark, latitude, longitude }` |
| PUT | `/addresses/:id` | Modification adresse | `{ label, street, city, district, landmark, latitude, longitude }` |
| DELETE | `/addresses/:id` | Suppression adresse | - |
| PUT | `/addresses/:id/default` | Définir adresse par défaut | - |

## 🚚 Gestion des Commandes

### Orders Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| GET | `/orders` | Liste des commandes | Query: `{ status?, type?, page?, limit? }` |
| POST | `/orders` | Création commande | `{ type, pickupAddress, deliveryAddress, items?, notes? }` |
| GET | `/orders/:id` | Détails commande | - |
| PUT | `/orders/:id/status` | Mise à jour statut | `{ status, latitude?, longitude? }` |
| POST | `/orders/:id/cancel` | Annulation commande | `{ reason }` |
| GET | `/orders/:id/tracking` | Suivi temps réel | - |
| POST | `/orders/:id/proof` | Preuve de livraison | `{ proofType, imageUrl?, signature? }` |

### Pricing Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| POST | `/pricing/calculate` | Calcul tarif livraison | `{ pickupLatitude, pickupLongitude, deliveryLatitude, deliveryLongitude, vehicleType? }` |
| GET | `/pricing/config` | Configuration tarifs | - |

## 🏍️ Gestion des Livreurs

### Drivers Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| POST | `/drivers/profile` | Création profil livreur | `{ licenseNumber, vehicleType, vehiclePlate }` |
| GET | `/drivers/profile` | Profil livreur connecté | - |
| PUT | `/drivers/profile` | Mise à jour profil | `{ vehicleType, vehiclePlate, isAvailable }` |
| PUT | `/drivers/status` | Changement statut | `{ isOnline, latitude?, longitude? }` |
| PUT | `/drivers/location` | Mise à jour position | `{ latitude, longitude }` |
| GET | `/drivers/orders/available` | Commandes disponibles | Query: `{ latitude, longitude, radius? }` |
| POST | `/drivers/orders/:id/accept` | Accepter commande | - |
| POST | `/drivers/orders/:id/reject` | Refuser commande | `{ reason }` |
| GET | `/drivers/earnings` | Historique gains | Query: `{ startDate?, endDate?, page?, limit? }` |

### Driver Documents Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| POST | `/drivers/documents` | Upload document | `{ type, file }` (multipart) |
| GET | `/drivers/documents` | Liste documents | - |
| DELETE | `/drivers/documents/:id` | Suppression document | - |

## 🏪 Gestion des Partenaires

### Partners Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| POST | `/partners/profile` | Création profil partenaire | `{ businessName, businessType, description }` |
| GET | `/partners/profile` | Profil partenaire connecté | - |
| PUT | `/partners/profile` | Mise à jour profil | `{ businessName, description, logo }` |

### Restaurants Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| GET | `/restaurants` | Liste restaurants | Query: `{ latitude?, longitude?, cuisine?, isOpen? }` |
| POST | `/restaurants` | Création restaurant | `{ name, description, cuisine, deliveryFee, minimumOrder }` |
| GET | `/restaurants/:id` | Détails restaurant | - |
| PUT | `/restaurants/:id` | Modification restaurant | `{ name, description, cuisine, deliveryFee, minimumOrder, isOpen }` |
| GET | `/restaurants/:id/menu` | Menu restaurant | - |
| PUT | `/restaurants/:id/hours` | Horaires d'ouverture | `{ openingHours }` |

### Stores Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| GET | `/stores` | Liste magasins | Query: `{ latitude?, longitude?, type?, isOpen? }` |
| POST | `/stores` | Création magasin | `{ name, description, type, deliveryFee, minimumOrder }` |
| GET | `/stores/:id` | Détails magasin | - |
| PUT | `/stores/:id` | Modification magasin | `{ name, description, type, deliveryFee, minimumOrder, isOpen }` |
| GET | `/stores/:id/catalog` | Catalogue magasin | - |

## 📦 Gestion des Produits

### Products Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| GET | `/products` | Liste produits | Query: `{ restaurantId?, storeId?, categoryId?, search?, page?, limit? }` |
| POST | `/products` | Création produit | `{ name, description, price, categoryId, image?, stock?, preparationTime? }` |
| GET | `/products/:id` | Détails produit | - |
| PUT | `/products/:id` | Modification produit | `{ name, description, price, image?, stock?, preparationTime?, isAvailable }` |
| DELETE | `/products/:id` | Suppression produit | - |

### Categories Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| GET | `/categories` | Liste catégories | Query: `{ restaurantId?, storeId? }` |
| POST | `/categories` | Création catégorie | `{ name, description, image?, sortOrder? }` |
| PUT | `/categories/:id` | Modification catégorie | `{ name, description, image?, sortOrder? }` |
| DELETE | `/categories/:id` | Suppression catégorie | - |

## 💳 Gestion des Paiements

### Payments Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| POST | `/payments/process` | Traitement paiement | `{ orderId, method, amount, metadata? }` |
| GET | `/payments/methods` | Méthodes disponibles | - |
| POST | `/payments/stripe/intent` | Création PaymentIntent | `{ orderId, amount }` |
| POST | `/payments/mobile-money` | Paiement mobile money | `{ orderId, phone, provider, amount }` |
| GET | `/payments/:id/status` | Statut paiement | - |
| POST | `/payments/:id/refund` | Remboursement | `{ amount?, reason }` |

### Transactions Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| GET | `/transactions` | Historique transactions | Query: `{ type?, status?, startDate?, endDate?, page?, limit? }` |
| GET | `/transactions/:id` | Détails transaction | - |

## 🔔 Notifications

### Notifications Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| GET | `/notifications` | Liste notifications | Query: `{ isRead?, type?, page?, limit? }` |
| PUT | `/notifications/:id/read` | Marquer comme lu | - |
| PUT | `/notifications/read-all` | Marquer tout comme lu | - |
| DELETE | `/notifications/:id` | Suppression notification | - |

## ⭐ Évaluations

### Ratings Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| POST | `/ratings` | Création évaluation | `{ orderId, toUserId, rating, comment? }` |
| GET | `/ratings/user/:id` | Évaluations utilisateur | Query: `{ page?, limit? }` |
| GET | `/ratings/order/:id` | Évaluations commande | - |

## 📊 Administration

### Admin Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| GET | `/admin/dashboard` | Données dashboard | Query: `{ period?, startDate?, endDate? }` |
| GET | `/admin/analytics` | Analytics détaillées | Query: `{ metric, period, groupBy? }` |
| GET | `/admin/heatmap` | Données heatmap | Query: `{ date?, bounds? }` |

### Admin Users Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| GET | `/admin/users` | Liste utilisateurs | Query: `{ role?, status?, search?, page?, limit? }` |
| GET | `/admin/users/:id` | Détails utilisateur | - |
| PUT | `/admin/users/:id/status` | Changement statut | `{ isActive, reason? }` |
| PUT | `/admin/users/:id/verify` | Vérification utilisateur | `{ isVerified }` |

### Admin Orders Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| GET | `/admin/orders` | Liste commandes | Query: `{ status?, type?, clientId?, driverId?, startDate?, endDate?, page?, limit? }` |
| PUT | `/admin/orders/:id/assign` | Assignation manuelle | `{ driverId }` |
| PUT | `/admin/orders/:id/status` | Changement statut | `{ status, reason? }` |

### Admin Drivers Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| GET | `/admin/drivers` | Liste livreurs | Query: `{ status?, isOnline?, city?, page?, limit? }` |
| PUT | `/admin/drivers/:id/verify` | Vérification documents | `{ documentsVerified, notes? }` |
| PUT | `/admin/drivers/:id/suspend` | Suspension livreur | `{ reason, duration? }` |

### Admin Partners Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| GET | `/admin/partners` | Liste partenaires | Query: `{ businessType?, status?, city?, page?, limit? }` |
| PUT | `/admin/partners/:id/verify` | Vérification partenaire | `{ isVerified, notes? }` |
| PUT | `/admin/partners/:id/status` | Changement statut | `{ isActive, reason? }` |

### Admin Pricing Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| GET | `/admin/pricing/config` | Configuration tarifs | - |
| PUT | `/admin/pricing/config` | Mise à jour tarifs | `{ basePrice, pricePerKm, vehicleMultipliers, timeMultipliers }` |
| GET | `/admin/pricing/history` | Historique modifications | Query: `{ page?, limit? }` |

## 🔍 Recherche et Géolocalisation

### Search Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| GET | `/search/restaurants` | Recherche restaurants | Query: `{ q, latitude?, longitude?, cuisine?, page?, limit? }` |
| GET | `/search/stores` | Recherche magasins | Query: `{ q, latitude?, longitude?, type?, page?, limit? }` |
| GET | `/search/products` | Recherche produits | Query: `{ q, restaurantId?, storeId?, categoryId?, page?, limit? }` |

### Geolocation Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| POST | `/geolocation/geocode` | Géocodage adresse | `{ address }` |
| POST | `/geolocation/reverse` | Géocodage inverse | `{ latitude, longitude }` |
| GET | `/geolocation/nearby` | Points d'intérêt proches | Query: `{ latitude, longitude, type?, radius? }` |

## 📱 Support et Feedback

### Support Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| POST | `/support/tickets` | Création ticket | `{ subject, message, category, orderId? }` |
| GET | `/support/tickets` | Liste tickets utilisateur | Query: `{ status?, page?, limit? }` |
| GET | `/support/tickets/:id` | Détails ticket | - |
| POST | `/support/tickets/:id/messages` | Ajout message | `{ message, attachments? }` |

### Feedback Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| POST | `/feedback` | Envoi feedback | `{ type, message, rating?, metadata? }` |
| GET | `/feedback/categories` | Catégories feedback | - |

## 🔧 Utilitaires

### Health Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| GET | `/health` | Statut API | - |
| GET | `/health/db` | Statut base de données | - |
| GET | `/health/redis` | Statut Redis | - |

### Upload Module
| Méthode | Endpoint | Description | Body |
|---------|----------|-------------|------|
| POST | `/upload/image` | Upload image | `{ file }` (multipart) |
| POST | `/upload/document` | Upload document | `{ file, type }` (multipart) |
| DELETE | `/upload/:id` | Suppression fichier | - |

## 📋 Codes de Réponse HTTP

| Code | Description |
|------|-------------|
| 200 | Succès |
| 201 | Créé avec succès |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Accès refusé |
| 404 | Ressource non trouvée |
| 409 | Conflit (ressource existe déjà) |
| 422 | Données invalides |
| 429 | Trop de requêtes |
| 500 | Erreur serveur |

## 🔐 Authentification et Autorisation

### Headers Requis
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Rôles et Permissions
- **CLIENT** : Accès aux commandes, profil, adresses
- **DRIVER** : Accès aux commandes assignées, profil livreur, gains
- **PARTNER** : Accès aux restaurants/magasins, produits, commandes reçues
- **ADMIN** : Accès complet à toutes les ressources
