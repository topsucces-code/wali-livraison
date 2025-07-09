# Schéma de Base de Données - WALI LIVRAISON

## 📊 Modèles Prisma

### Modèle User (Utilisateur)
```prisma
model User {
  id          String   @id @default(cuid())
  phone       String   @unique
  email       String?  @unique
  firstName   String
  lastName    String
  avatar      String?
  role        UserRole @default(CLIENT)
  isActive    Boolean  @default(true)
  isVerified  Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  clientOrders    Order[]        @relation("ClientOrders")
  driverOrders    Order[]        @relation("DriverOrders")
  driverProfile   DriverProfile?
  partnerProfile  PartnerProfile?
  addresses       Address[]
  transactions    Transaction[]
  notifications   Notification[]
  ratings         Rating[]       @relation("RatingFrom")
  receivedRatings Rating[]       @relation("RatingTo")

  @@map("users")
}

enum UserRole {
  CLIENT
  DRIVER
  PARTNER
  ADMIN
}
```

### Modèle DriverProfile (Profil Livreur)
```prisma
model DriverProfile {
  id                String            @id @default(cuid())
  userId            String            @unique
  licenseNumber     String            @unique
  vehicleType       VehicleType
  vehiclePlate      String
  isOnline          Boolean           @default(false)
  isAvailable       Boolean           @default(true)
  currentLatitude   Float?
  currentLongitude  Float?
  documentsVerified Boolean           @default(false)
  rating            Float             @default(0)
  totalEarnings     Float             @default(0)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  // Relations
  user              User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  documents         DriverDocument[]

  @@map("driver_profiles")
}

enum VehicleType {
  MOTO
  CAR
  TRUCK
  BICYCLE
}

model DriverDocument {
  id              String        @id @default(cuid())
  driverProfileId String
  type            DocumentType
  url             String
  isVerified      Boolean       @default(false)
  createdAt       DateTime      @default(now())

  // Relations
  driverProfile   DriverProfile @relation(fields: [driverProfileId], references: [id], onDelete: Cascade)

  @@map("driver_documents")
}

enum DocumentType {
  LICENSE
  ID_CARD
  VEHICLE_REGISTRATION
  INSURANCE
}
```

### Modèle PartnerProfile (Profil Partenaire)
```prisma
model PartnerProfile {
  id            String        @id @default(cuid())
  userId        String        @unique
  businessName  String
  businessType  BusinessType
  description   String?
  logo          String?
  isVerified    Boolean       @default(false)
  isActive      Boolean       @default(true)
  rating        Float         @default(0)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // Relations
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  restaurants   Restaurant[]
  stores        Store[]

  @@map("partner_profiles")
}

enum BusinessType {
  RESTAURANT
  STORE
  PHARMACY
  SUPERMARKET
}
```

### Modèle Order (Commande)
```prisma
model Order {
  id                String      @id @default(cuid())
  orderNumber       String      @unique
  clientId          String
  driverId          String?
  type              OrderType
  status            OrderStatus @default(PENDING)
  
  // Adresses
  pickupAddress     String
  pickupLatitude    Float
  pickupLongitude   Float
  deliveryAddress   String
  deliveryLatitude  Float
  deliveryLongitude Float
  
  // Tarification
  basePrice         Float
  deliveryFee       Float
  totalAmount       Float
  
  // Timing
  estimatedDuration Int?        // en minutes
  scheduledAt       DateTime?
  pickedUpAt        DateTime?
  deliveredAt       DateTime?
  
  // Métadonnées
  notes             String?
  proofOfDelivery   String?     // URL de la photo/signature
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  // Relations
  client            User        @relation("ClientOrders", fields: [clientId], references: [id])
  driver            User?       @relation("DriverOrders", fields: [driverId], references: [id])
  items             OrderItem[]
  transactions      Transaction[]
  trackingEvents    TrackingEvent[]
  ratings           Rating[]

  @@map("orders")
}

enum OrderType {
  DELIVERY      // Livraison simple point A vers B
  FOOD          // Commande de repas
  SHOPPING      // Courses/achats
}

enum OrderStatus {
  PENDING       // En attente
  CONFIRMED     // Confirmée
  ASSIGNED      // Assignée à un livreur
  PICKED_UP     // Récupérée
  IN_TRANSIT    // En transit
  DELIVERED     // Livrée
  CANCELLED     // Annulée
  FAILED        // Échec de livraison
}
```

### Modèle OrderItem (Article de Commande)
```prisma
model OrderItem {
  id          String  @id @default(cuid())
  orderId     String
  productId   String?
  name        String
  description String?
  quantity    Int     @default(1)
  unitPrice   Float
  totalPrice  Float
  
  // Relations
  order       Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product     Product? @relation(fields: [productId], references: [id])

  @@map("order_items")
}
```

### Modèle Restaurant
```prisma
model Restaurant {
  id              String         @id @default(cuid())
  partnerProfileId String
  name            String
  description     String?
  cuisine         String[]
  logo            String?
  coverImage      String?
  isOpen          Boolean        @default(true)
  openingHours    Json           // Structure JSON pour les horaires
  deliveryFee     Float          @default(0)
  minimumOrder    Float          @default(0)
  rating          Float          @default(0)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  // Relations
  partnerProfile  PartnerProfile @relation(fields: [partnerProfileId], references: [id], onDelete: Cascade)
  addresses       Address[]
  categories      Category[]
  products        Product[]

  @@map("restaurants")
}
```

### Modèle Store (Magasin)
```prisma
model Store {
  id              String         @id @default(cuid())
  partnerProfileId String
  name            String
  description     String?
  type            StoreType
  logo            String?
  coverImage      String?
  isOpen          Boolean        @default(true)
  openingHours    Json
  deliveryFee     Float          @default(0)
  minimumOrder    Float          @default(0)
  rating          Float          @default(0)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  // Relations
  partnerProfile  PartnerProfile @relation(fields: [partnerProfileId], references: [id], onDelete: Cascade)
  addresses       Address[]
  categories      Category[]
  products        Product[]

  @@map("stores")
}

enum StoreType {
  SUPERMARKET
  PHARMACY
  ELECTRONICS
  CLOTHING
  GENERAL
}
```

### Modèle Product (Produit)
```prisma
model Product {
  id            String    @id @default(cuid())
  restaurantId  String?
  storeId       String?
  categoryId    String
  name          String
  description   String?
  price         Float
  image         String?
  isAvailable   Boolean   @default(true)
  stock         Int?      // null = stock illimité
  preparationTime Int?    // en minutes
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  restaurant    Restaurant? @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  store         Store?      @relation(fields: [storeId], references: [id], onDelete: Cascade)
  category      Category    @relation(fields: [categoryId], references: [id])
  orderItems    OrderItem[]

  @@map("products")
}

model Category {
  id            String    @id @default(cuid())
  restaurantId  String?
  storeId       String?
  name          String
  description   String?
  image         String?
  sortOrder     Int       @default(0)
  createdAt     DateTime  @default(now())

  // Relations
  restaurant    Restaurant? @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  store         Store?      @relation(fields: [storeId], references: [id], onDelete: Cascade)
  products      Product[]

  @@map("categories")
}
```

### Modèle Address (Adresse)
```prisma
model Address {
  id           String      @id @default(cuid())
  userId       String?
  restaurantId String?
  storeId      String?
  label        String?     // "Maison", "Bureau", etc.
  street       String
  city         String
  district     String?     // Quartier
  landmark     String?     // Point de repère
  latitude     Float
  longitude    Float
  isDefault    Boolean     @default(false)
  createdAt    DateTime    @default(now())

  // Relations
  user         User?       @relation(fields: [userId], references: [id], onDelete: Cascade)
  restaurant   Restaurant? @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  store        Store?      @relation(fields: [storeId], references: [id], onDelete: Cascade)

  @@map("addresses")
}
```

### Modèle Transaction (Transaction)
```prisma
model Transaction {
  id              String            @id @default(cuid())
  orderId         String
  userId          String
  type            TransactionType
  method          PaymentMethod
  amount          Float
  currency        String            @default("XOF") // Franc CFA
  status          TransactionStatus @default(PENDING)
  externalId      String?           // ID du provider de paiement
  metadata        Json?             // Données supplémentaires
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  order           Order             @relation(fields: [orderId], references: [id])
  user            User              @relation(fields: [userId], references: [id])

  @@map("transactions")
}

enum TransactionType {
  PAYMENT       // Paiement client
  REFUND        // Remboursement
  COMMISSION    // Commission plateforme
  DRIVER_PAYOUT // Paiement livreur
  PARTNER_PAYOUT // Paiement partenaire
}

enum PaymentMethod {
  CASH          // Espèces
  STRIPE        // Carte bancaire
  ORANGE_MONEY  // Orange Money
  MTN_MONEY     // MTN Mobile Money
  WAVE          // Wave
}

enum TransactionStatus {
  PENDING
  COMPLETED
  FAILED
  CANCELLED
  REFUNDED
}
```

### Modèles Supplémentaires
```prisma
model TrackingEvent {
  id          String    @id @default(cuid())
  orderId     String
  status      OrderStatus
  latitude    Float?
  longitude   Float?
  description String?
  createdAt   DateTime  @default(now())

  // Relations
  order       Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@map("tracking_events")
}

model Rating {
  id          String   @id @default(cuid())
  orderId     String
  fromUserId  String
  toUserId    String
  rating      Int      // 1-5
  comment     String?
  createdAt   DateTime @default(now())

  // Relations
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  fromUser    User     @relation("RatingFrom", fields: [fromUserId], references: [id])
  toUser      User     @relation("RatingTo", fields: [toUserId], references: [id])

  @@unique([orderId, fromUserId, toUserId])
  @@map("ratings")
}

model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  title     String
  message   String
  data      Json?            // Données supplémentaires
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())

  // Relations
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notifications")
}

enum NotificationType {
  ORDER_UPDATE
  PAYMENT_SUCCESS
  PAYMENT_FAILED
  DRIVER_ASSIGNED
  DELIVERY_COMPLETED
  PROMOTION
  SYSTEM
}
```
```
