# API Admin - Documentation des Endpoints

Documentation complète des endpoints d'administration pour gérer la plateforme E-Shop.

## 🔐 Sécurité

Tous les endpoints admin nécessitent:
1. **Header Authorization**: `Bearer <JWT_TOKEN>`
2. **Rôle**: `admin` (vérifié par middleware `verifyAdmin`)

### Exemple de requête

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  http://localhost:5000/api/admin/stats
```

---

## 📊 Statistiques

### GET `/api/admin/stats`

Obtenir les statistiques principales du dashboard.

**Réponse:**
```json
{
  "success": true,
  "stats": {
    "totalProducts": 150,
    "totalUsers": 2345,
    "totalOrders": 456,
    "totalRevenue": 54890.50,
    "pendingOrders": 12
  }
}
```

### GET `/api/admin/stats/sales`

Obtenir les statistiques de ventes sur une période.

**Query Parameters:**
- `period`: `day`, `week`, `month` (défaut), `year`

**Exemple:**
```http
GET /api/admin/stats/sales?period=week
```

**Réponse:**
```json
{
  "success": true,
  "sales": [
    {
      "_id": "2024-01-05",
      "sales": 5,
      "revenue": 1250.00
    },
    {
      "_id": "2024-01-04",
      "sales": 3,
      "revenue": 899.99
    }
  ]
}
```

### GET `/api/admin/stats/top-products`

Obtenir les produits les plus vendus.

**Query Parameters:**
- `limit`: Nombre de produits (défaut: 10)

**Réponse:**
```json
{
  "success": true,
  "products": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "totalSold": 145,
      "totalRevenue": 18750.50,
      "product": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Laptop Gaming",
        "price": 1299.99
      }
    }
  ]
}
```

### GET `/api/admin/stats/active-users`

Obtenir les statistiques d'utilisateurs actifs.

**Query Parameters:**
- `period`: `day`, `week`, `month` (défaut)

**Réponse:**
```json
{
  "success": true,
  "activeUsers": 234,
  "totalUsers": 2345,
  "percentage": "9.98"
}
```

### GET `/api/admin/stats/revenue`

Obtenir les revenus sur une période.

**Query Parameters:**
- `period`: `day`, `week`, `month` (défaut), `year`

**Réponse:**
```json
{
  "success": true,
  "revenue": {
    "total": 54890.50,
    "count": 456,
    "average": 120.37
  }
}
```

---

## 📦 Gestion des Produits

### GET `/api/admin/products`

Obtenir tous les produits avec filtres.

**Query Parameters:**
- `page`: Numéro de page (défaut: 1)
- `limit`: Produits par page (défaut: 10)
- `category`: Filtrer par catégorie
- `search`: Rechercher par nom ou SKU

**Exemple:**
```http
GET /api/admin/products?category=Électronique&search=laptop&page=1
```

**Réponse:**
```json
{
  "success": true,
  "products": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Laptop Gaming",
      "description": "...",
      "category": "Électronique",
      "price": 1299.99,
      "originalPrice": 1499.99,
      "image": "...",
      "stock": 50,
      "sku": "LAPTOP-001",
      "isActive": true
    }
  ],
  "total": 150,
  "pages": 15
}
```

---

## 👥 Gestion des Utilisateurs

### GET `/api/admin/users`

Obtenir tous les utilisateurs.

**Query Parameters:**
- `page`: Numéro de page (défaut: 1)
- `limit`: Utilisateurs par page (défaut: 10)
- `role`: Filtrer par rôle (`user`, `admin`)
- `search`: Rechercher par email, nom ou prénom

**Exemple:**
```http
GET /api/admin/users?role=user&search=jean&page=1
```

**Réponse:**
```json
{
  "success": true,
  "users": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean@example.com",
      "phone": "+33612345678",
      "address": {
        "street": "123 Rue de la Paix",
        "city": "Paris",
        "zipCode": "75001",
        "country": "France"
      },
      "role": "user",
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ],
  "total": 2345,
  "pages": 235
}
```

### GET `/api/admin/users/:userId`

Obtenir les détails d'un utilisateur spécifique.

**Réponse:**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439012",
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean@example.com",
    "phone": "+33612345678",
    "address": {...},
    "role": "user",
    "isEmailVerified": true,
    "profileImage": "...",
    "createdAt": "2024-01-01T10:00:00Z"
  }
}
```

### PUT `/api/admin/users/:userId/role`

Changer le rôle d'un utilisateur.

**Body:**
```json
{
  "role": "admin"
}
```

**Rôles disponibles:**
- `user` - Utilisateur normal
- `admin` - Administrateur

**Réponse:**
```json
{
  "success": true,
  "message": "Rôle mis à jour",
  "user": {
    "_id": "507f1f77bcf86cd799439012",
    "role": "admin"
  }
}
```

### DELETE `/api/admin/users/:userId`

Supprimer un utilisateur et toutes ses données.

**Supprime aussi:**
- Panier de l'utilisateur
- Wishlist de l'utilisateur
- Tous les avis de l'utilisateur

**Réponse:**
```json
{
  "success": true,
  "message": "Utilisateur supprimé"
}
```

---

## 📋 Gestion des Commandes

### GET `/api/admin/orders`

Obtenir toutes les commandes.

**Query Parameters:**
- `page`: Numéro de page (défaut: 1)
- `limit`: Commandes par page (défaut: 10)
- `status`: Filtrer par statut
- `search`: Rechercher par ID ou email client

**Exemple:**
```http
GET /api/admin/orders?status=pending&page=1
```

**Statuts disponibles:**
- `pending` - En attente
- `processing` - En traitement
- `shipped` - Expédié
- `delivered` - Livré
- `cancelled` - Annulé

**Réponse:**
```json
{
  "success": true,
  "orders": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "user": {
        "_id": "507f1f77bcf86cd799439012",
        "firstName": "Jean",
        "lastName": "Dupont",
        "email": "jean@example.com"
      },
      "items": [
        {
          "product": {
            "_id": "507f1f77bcf86cd799439013",
            "name": "Laptop Gaming",
            "price": 1299.99,
            "image": "..."
          },
          "quantity": 1,
          "price": 1299.99
        }
      ],
      "totalPrice": 1299.99,
      "status": "pending",
      "shippingAddress": {...},
      "trackingNumber": null,
      "createdAt": "2024-01-05T10:00:00Z"
    }
  ],
  "total": 456,
  "pages": 46
}
```

### GET `/api/admin/orders/:orderId`

Obtenir les détails d'une commande spécifique.

**Réponse:**
```json
{
  "success": true,
  "order": {
    "_id": "507f1f77bcf86cd799439014",
    "user": {...},
    "items": [...],
    "totalPrice": 1299.99,
    "status": "pending",
    "shippingAddress": {
      "street": "...",
      "city": "...",
      "zipCode": "...",
      "country": "..."
    },
    "paymentMethod": "card",
    "paymentStatus": "completed",
    "trackingNumber": null,
    "notes": "...",
    "createdAt": "2024-01-05T10:00:00Z",
    "updatedAt": "2024-01-05T10:00:00Z"
  }
}
```

### PUT `/api/admin/orders/:orderId`

Mettre à jour une commande (statut et/ou numéro de suivi).

**Body:**
```json
{
  "status": "shipped",
  "trackingNumber": "FR123456789"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Statut mis à jour",
  "order": {
    "_id": "507f1f77bcf86cd799439014",
    "status": "shipped",
    "trackingNumber": "FR123456789"
  }
}
```

### DELETE `/api/admin/orders/:orderId`

Annuler une commande.

**Réponse:**
```json
{
  "success": true,
  "message": "Commande annulée"
}
```

---

## 💬 Gestion des Avis

### GET `/api/admin/reviews`

Obtenir tous les avis.

**Query Parameters:**
- `page`: Numéro de page (défaut: 1)
- `limit`: Avis par page (défaut: 10)

**Réponse:**
```json
{
  "success": true,
  "reviews": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "product": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Laptop Gaming"
      },
      "user": {
        "_id": "507f1f77bcf86cd799439012",
        "firstName": "Jean",
        "lastName": "Dupont",
        "email": "jean@example.com"
      },
      "rating": 5,
      "title": "Excellent produit",
      "comment": "Très satisfait de mon achat...",
      "isVerified": true,
      "helpful": 12,
      "createdAt": "2024-01-05T10:00:00Z"
    }
  ],
  "total": 1234,
  "pages": 124
}
```

### DELETE `/api/admin/reviews/:reviewId`

Supprimer un avis.

**Réponse:**
```json
{
  "success": true,
  "message": "Avis supprimé"
}
```

---

## 🔍 Codes d'Erreur

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Token manquant ou invalide"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Accès admin requis"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Ressource non trouvée"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Erreur serveur"
}
```

---

## 📝 Exemples avec cURL

### Récupérer les statistiques

```bash
curl -X GET "http://localhost:5000/api/admin/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Créer un admin

```bash
curl -X PUT "http://localhost:5000/api/admin/users/USER_ID/role" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

### Changer le statut d'une commande

```bash
curl -X PUT "http://localhost:5000/api/admin/orders/ORDER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "shipped",
    "trackingNumber": "FR123456789"
  }'
```

### Supprimer un utilisateur

```bash
curl -X DELETE "http://localhost:5000/api/admin/users/USER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**Dernière mise à jour**: 5 janvier 2024
