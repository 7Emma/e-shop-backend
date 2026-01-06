# E-Shop Backend API

API REST complète pour une plateforme de commerce électronique construite avec Node.js, Express et MongoDB.

## Table des matières

- [Installation](#installation)
- [Configuration](#configuration)
- [Démarrage](#démarrage)
- [Structure du projet](#structure-du-projet)
- [API Endpoints](#api-endpoints)
- [Authentification](#authentification)
- [Models](#models)

## Installation

### Prérequis

- Node.js (v16+)
- MongoDB (local ou cloud)
- Yarn ou npm

### Étapes

1. **Cloner le repository**
```bash
cd backend
```

2. **Installer les dépendances**
```bash
yarn install
```

3. **Configurer les variables d'environnement**
Créez un fichier `.env` à la racine du projet :
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/eshop
JWT_SECRET=your_jwt_secret_key_change_in_production
FRONTEND_URL=http://localhost:5173
```

## Configuration

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| NODE_ENV | Environnement d'exécution | development |
| PORT | Port du serveur | 5000 |
| MONGODB_URI | URL de connexion MongoDB | mongodb://localhost:27017/eshop |
| JWT_SECRET | Clé secrète JWT | secret_key |
| FRONTEND_URL | URL du frontend | http://localhost:5173 |

### MongoDB

Si vous utilisez MongoDB localement :
```bash
mongod
```

Pour MongoDB Atlas (cloud) :
1. Créez un compte sur [mongodb.com](https://mongodb.com)
2. Créez un cluster
3. Récupérez la chaîne de connexion
4. Mettez à jour `MONGODB_URI` dans `.env`

## Démarrage

### Mode développement (avec nodemon)
```bash
yarn dev
```

### Mode production
```bash
yarn start
```

Le serveur démarrera sur `http://localhost:5000`

## Structure du projet

```
src/
├── config/
│   └── database.js           # Configuration MongoDB
├── controllers/
├── middlewares/
│   └── auth.js              # Middlewares d'authentification
├── models/
│   ├── User.js              # Modèle utilisateur
│   ├── Product.js           # Modèle produit
│   ├── Cart.js              # Modèle panier
│   ├── Order.js             # Modèle commande
│   ├── Wishlist.js          # Modèle liste de souhaits
│   └── Review.js            # Modèle avis produit
├── routes/
│   ├── auth.js              # Routes authentification
│   ├── products.js          # Routes produits
│   ├── cart.js              # Routes panier
│   ├── orders.js            # Routes commandes
│   ├── wishlist.js          # Routes liste de souhaits
│   ├── users.js             # Routes utilisateurs
│   └── reviews.js           # Routes avis
└── server.js                # Point d'entrée
```

## API Endpoints

### Authentification (`/api/auth`)

#### Inscription
```
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Inscription réussie",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean@example.com",
    "role": "user"
  }
}
```

#### Connexion
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "jean@example.com",
  "password": "password123"
}
```

### Produits (`/api/products`)

#### Récupérer tous les produits
```
GET /api/products?category=Électronique&search=téléphone&minPrice=100&maxPrice=1000&page=1&limit=12&sortBy=price&order=asc
```

**Paramètres de requête:**
- `category` - Filtre par catégorie
- `search` - Recherche par nom/description
- `minPrice` - Prix minimum
- `maxPrice` - Prix maximum
- `page` - Numéro de page (défaut: 1)
- `limit` - Produits par page (défaut: 12)
- `sortBy` - Tri par champ (défaut: createdAt)
- `order` - Ordre (asc/desc, défaut: desc)

**Réponse:**
```json
{
  "success": true,
  "products": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Produit 1",
      "category": "Électronique",
      "price": 299.99,
      "originalPrice": 399.99,
      "image": "https://...",
      "rating": 4.5,
      "reviews": 25,
      "stock": 50
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 12,
    "pages": 9
  }
}
```

#### Récupérer un produit
```
GET /api/products/:id
```

#### Créer un produit (Admin)
```
POST /api/products
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Nouveau Produit",
  "description": "Description...",
  "category": "Électronique",
  "price": 199.99,
  "originalPrice": 299.99,
  "image": "url...",
  "stock": 50,
  "sku": "SKU123"
}
```

#### Mettre à jour un produit (Admin)
```
PUT /api/products/:id
Authorization: Bearer {token}
```

#### Supprimer un produit (Admin)
```
DELETE /api/products/:id
Authorization: Bearer {token}
```

### Panier (`/api/cart`)

#### Récupérer le panier
```
GET /api/cart
Authorization: Bearer {token}
```

#### Ajouter un produit au panier
```
POST /api/cart/add
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": "507f1f77bcf86cd799439011",
  "quantity": 1
}
```

#### Mettre à jour la quantité
```
PUT /api/cart/update/:productId
Authorization: Bearer {token}
Content-Type: application/json

{
  "quantity": 2
}
```

#### Supprimer du panier
```
DELETE /api/cart/remove/:productId
Authorization: Bearer {token}
```

#### Vider le panier
```
DELETE /api/cart/clear
Authorization: Bearer {token}
```

### Commandes (`/api/orders`)

#### Récupérer les commandes de l'utilisateur
```
GET /api/orders
Authorization: Bearer {token}
```

#### Récupérer une commande
```
GET /api/orders/:id
Authorization: Bearer {token}
```

#### Créer une commande
```
POST /api/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "shippingAddress": {
    "street": "123 Rue de la Paix",
    "city": "Paris",
    "zipCode": "75001",
    "country": "France",
    "phone": "0123456789"
  },
  "notes": "Note spéciale"
}
```

#### Mettre à jour le statut (Admin)
```
PUT /api/orders/:id/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "shipped",
  "paymentStatus": "paid"
}
```

**Statuts disponibles:**
- pending, processing, shipped, delivered, cancelled

**Statuts de paiement:**
- pending, paid, failed

#### Récupérer toutes les commandes (Admin)
```
GET /api/orders/admin/all
Authorization: Bearer {token}
```

### Liste de souhaits (`/api/wishlist`)

#### Récupérer la wishlist
```
GET /api/wishlist
Authorization: Bearer {token}
```

#### Ajouter à la wishlist
```
POST /api/wishlist/add/:productId
Authorization: Bearer {token}
```

#### Supprimer de la wishlist
```
DELETE /api/wishlist/remove/:productId
Authorization: Bearer {token}
```

#### Vérifier si wishlisté
```
POST /api/wishlist/check/:productId
Authorization: Bearer {token}
```

### Utilisateurs (`/api/users`)

#### Récupérer le profil
```
GET /api/users/profile
Authorization: Bearer {token}
```

#### Mettre à jour le profil
```
PUT /api/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Jean",
  "lastName": "Dupont",
  "phone": "0123456789",
  "address": {
    "street": "123 Rue",
    "city": "Paris",
    "zipCode": "75001",
    "country": "France"
  },
  "profileImage": "url..."
}
```

#### Changer le mot de passe
```
PUT /api/users/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword",
  "confirmPassword": "newpassword"
}
```

#### Récupérer tous les utilisateurs (Admin)
```
GET /api/users/all
Authorization: Bearer {token}
```

#### Supprimer un utilisateur (Admin)
```
DELETE /api/users/:id
Authorization: Bearer {token}
```

### Avis (`/api/reviews`)

#### Récupérer les avis d'un produit
```
GET /api/reviews/product/:productId
```

#### Créer un avis
```
POST /api/reviews
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": "507f1f77bcf86cd799439011",
  "rating": 5,
  "title": "Excellent produit",
  "comment": "C'est vraiment un excellent produit..."
}
```

#### Mettre à jour un avis
```
PUT /api/reviews/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "rating": 4,
  "title": "Bon produit",
  "comment": "Finalement pas mal..."
}
```

#### Supprimer un avis
```
DELETE /api/reviews/:id
Authorization: Bearer {token}
```

## Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification.

### Utilisation du token

Incluez le token dans l'en-tête `Authorization`:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Durée de validité

Les tokens expirent après 7 jours. Les utilisateurs doivent se reconnecter pour obtenir un nouveau token.

## Models

### User

```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashé),
  phone: String,
  address: {
    street: String,
    city: String,
    zipCode: String,
    country: String
  },
  role: String (user ou admin),
  isEmailVerified: Boolean,
  profileImage: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Product

```javascript
{
  name: String,
  description: String,
  category: String (Électronique, Vêtements, Accessoires, Maison, Autres),
  price: Number,
  originalPrice: Number,
  image: String,
  images: [String],
  stock: Number,
  rating: Number (0-5),
  reviews: Number,
  sku: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Order

```javascript
{
  user: ObjectId (ref: User),
  items: [{
    product: ObjectId (ref: Product),
    quantity: Number,
    price: Number
  }],
  totalPrice: Number,
  shippingAddress: {
    street: String,
    city: String,
    zipCode: String,
    country: String,
    phone: String
  },
  status: String (pending, processing, shipped, delivered, cancelled),
  paymentStatus: String (pending, paid, failed),
  shippingCost: Number,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Cart

```javascript
{
  user: ObjectId (ref: User),
  items: [{
    product: ObjectId (ref: Product),
    quantity: Number
  }],
  totalItems: Number,
  totalPrice: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Wishlist

```javascript
{
  user: ObjectId (ref: User),
  products: [ObjectId] (ref: Product),
  createdAt: Date,
  updatedAt: Date
}
```

### Review

```javascript
{
  product: ObjectId (ref: Product),
  user: ObjectId (ref: User),
  rating: Number (1-5),
  title: String,
  comment: String,
  isVerifiedPurchase: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Sécurité

- **Helmet**: Protège contre les vulnérabilités HTTP
- **CORS**: Configure l'accès cross-origin
- **Rate Limiting**: Limite le nombre de requêtes
- **XSS Protection**: Nettoie les entrées XSS
- **JWT**: Authentification sécurisée
- **Password Hashing**: Utilise bcrypt

## Dépannage

### Erreur de connexion MongoDB
- Vérifiez que MongoDB est en cours d'exécution
- Vérifiez l'URI dans `.env`
- Vérifiez les identifiants MongoDB Atlas

### Erreur d'authentification
- Vérifiez le token JWT dans l'en-tête Authorization
- Vérifiez la valeur de `JWT_SECRET` dans `.env`

### Erreur CORS
- Vérifiez la valeur de `FRONTEND_URL` dans `.env`
- Assurez-vous que le frontend utilise l'URL correcte

## Licence

MIT
