# Notifications

> Part of [GraphQL API](./index.md) GraphQL API

---

## Subscriptions

### notificationReceived

Subscribe to notifications for the current user

Receives real-time notifications including order updates,
price alerts, stock alerts, and system messages.

**Returns:** `Notification!`

| Field       | Type                 | Description                                  |
| ----------- | -------------------- | -------------------------------------------- |
| `id`        | `UUID!`              | Unique identifier                            |
| `type`      | `NotificationType!`  | Notification type                            |
| `title`     | `String!`            | Notification title                           |
| `body`      | `String!`            | Notification body                            |
| `target`    | `NotificationTarget` | The target entity this notification is about |
| `isRead`    | `Boolean!`           | Whether the notification has been read       |
| `readAt`    | `DateTime`           | When the notification was read               |
| `actionUrl` | `String`             | Action URL (if applicable)                   |
| `createdAt` | `DateTime!`          | When created                                 |
| `updatedAt` | `DateTime!`          | When last updated                            |

**NotificationType values:**

| NotificationType Value | Description                 |
| ---------------------- | --------------------------- |
| `ORDER_UPDATE`         | Order status update         |
| `PRICE_ALERT`          | Price drop on wishlist item |
| `STOCK_ALERT`          | Product back in stock       |
| `PROMOTION`            | Promotional offer           |
| `SYSTEM`               | System announcement         |

**NotificationTarget possible types:**

| Type    | Description      |
| ------- | ---------------- |
| `Order` | A customer order |

Orders track the purchase lifecycle from cart to delivery.
**Circular Reference:** Order -> User -> Orders |
| `Product` | A product available for purchase

Products belong to categories and can have multiple variants (size, color, etc.).
Each product tracks inventory and pricing information. |
| `Review` | A product review written by a user

**Circular Reference:** Review -> User -> Reviews
**Circular Reference:** Review -> Product -> Reviews |
| `User` | A registered user of the platform

Users can be customers, sellers, or administrators. Each user has a profile,
can place orders, write reviews, and manage their wishlist.

**Circular Reference:** User -> Order -> User (orderBy)
**Circular Reference:** User -> Review -> User (author) |

**Order fields:**

| Field             | Type                                   | Description                                        |
| ----------------- | -------------------------------------- | -------------------------------------------------- |
| `id`              | `UUID!`                                | Unique identifier                                  |
| `orderNumber`     | `String!`                              | Human-readable order number                        |
| `customer`        | `User!` _(max depth reached)_          | Customer who placed the order (circular reference) |
| `status`          | `OrderStatus!` _(max depth reached)_   | Current order status                               |
| `items`           | `[OrderItem!]!` _(max depth reached)_  | Order line items                                   |
| `subtotal`        | `Money!`                               | Subtotal before tax and shipping                   |
| `taxAmount`       | `Money!`                               | Tax amount                                         |
| `shippingAmount`  | `Money!`                               | Shipping cost                                      |
| `discountAmount`  | `Money!`                               | Discount amount                                    |
| `total`           | `Money!`                               | Total order amount                                 |
| `currency`        | `Currency!` _(max depth reached)_      | Currency used for this order                       |
| `shippingAddress` | `Address!` _(max depth reached)_       | Shipping address                                   |
| `billingAddress`  | `Address!` _(max depth reached)_       | Billing address                                    |
| `payment`         | `PaymentInfo!` _(max depth reached)_   | Payment information                                |
| `shipping`        | `ShippingInfo` _(max depth reached)_   | Shipping information                               |
| `appliedCoupons`  | `[Coupon!]!` _(max depth reached)_     | Applied coupon codes                               |
| `customerNotes`   | `String`                               | Order notes from customer                          |
| `internalNotes`   | `String`                               | Internal notes (admin only)                        |
| `timeline`        | `[OrderEvent!]!` _(max depth reached)_ | Order history/timeline                             |
| `createdAt`       | `DateTime!`                            | When created                                       |
| `updatedAt`       | `DateTime!`                            | When last updated                                  |

**Product fields:**

| Field                                                                          | Type                                             | Description                                                        |
| ------------------------------------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------ |
| `id`                                                                           | `UUID!`                                          | Unique identifier                                                  |
| `slug`                                                                         | `String!`                                        | URL-friendly slug                                                  |
| `name`                                                                         | `String!`                                        | Product name                                                       |
| `shortDescription`                                                             | `String!`                                        | Short description for listings                                     |
| `description`                                                                  | `String!`                                        | Full product description (supports markdown)                       |
| `images`                                                                       | `[ProductImage!]!` _(max depth reached)_         | Product images                                                     |
| `primaryImage`                                                                 | `ProductImage` _(max depth reached)_             | Primary/featured image                                             |
| `price`                                                                        | `Money!`                                         | Current price                                                      |
| `compareAtPrice`                                                               | `Money`                                          | Original price before discount (if on sale)                        |
| `isOnSale`                                                                     | `Boolean!`                                       | Whether product is currently on sale                               |
| `status`                                                                       | `ProductStatus!` _(max depth reached)_           | Product status                                                     |
| `category`                                                                     | `Category!` _(max depth reached)_                | Product category (creates circular reference)                      |
| Category contains a list of products, and each product references its category |
| `additionalCategories`                                                         | `[Category!]!` _(max depth reached)_             | Additional categories this product belongs to                      |
| `tags`                                                                         | `[String!]!`                                     | Product tags for filtering                                         |
| `variants`                                                                     | `[ProductVariant!]!` _(max depth reached)_       | Product variants (size, color combinations)                        |
| `totalInventory`                                                               | `Int!`                                           | Total inventory across all variants                                |
| `isInStock`                                                                    | `Boolean!`                                       | Whether any variant is in stock                                    |
| `seller`                                                                       | `User!` _(max depth reached)_                    | Seller who listed this product                                     |
| `reviews`                                                                      | `ReviewConnection!` _(max depth reached)_        | Product reviews (circular: Review references Product)              |
| `averageRating`                                                                | `Float`                                          | Average rating (1-5)                                               |
| `reviewCount`                                                                  | `Int!`                                           | Total number of reviews                                            |
| `relatedProducts`                                                              | `[Product!]!`                                    | Related products (for "You might also like") _(see Product above)_ |
| `frequentlyBoughtWith`                                                         | `[Product!]!`                                    | Products frequently bought together _(see Product above)_          |
| `specifications`                                                               | `[ProductSpecification!]!` _(max depth reached)_ | Product specifications/attributes                                  |
| `seo`                                                                          | `SEOMetadata` _(max depth reached)_              | SEO metadata                                                       |
| `createdAt`                                                                    | `DateTime!`                                      | When created                                                       |
| `updatedAt`                                                                    | `DateTime!`                                      | When last updated                                                  |
| `deletedAt`                                                                    | `DateTime`                                       | When deleted (soft delete)                                         |
| `isDeleted`                                                                    | `Boolean!`                                       | Whether deleted                                                    |

**Review fields:**

| Field                | Type                                    | Description                                        |
| -------------------- | --------------------------------------- | -------------------------------------------------- |
| `id`                 | `UUID!`                                 | Unique identifier                                  |
| `product`            | `Product!` _(max depth reached)_        | The product being reviewed                         |
| `author`             | `User!` _(max depth reached)_           | The user who wrote the review (circular reference) |
| `rating`             | `Int!`                                  | Rating from 1 to 5                                 |
| `title`              | `String`                                | Review title                                       |
| `body`               | `String!`                               | Review body text                                   |
| `pros`               | `[String!]`                             | Pros mentioned by reviewer                         |
| `cons`               | `[String!]`                             | Cons mentioned by reviewer                         |
| `images`             | `[ReviewImage!]` _(max depth reached)_  | Attached images                                    |
| `isVerifiedPurchase` | `Boolean!`                              | Whether reviewer is a verified purchaser           |
| `helpfulCount`       | `Int!`                                  | Number of users who found this helpful             |
| `unhelpfulCount`     | `Int!`                                  | Number of users who found this unhelpful           |
| `replies`            | `[ReviewReply!]!` _(max depth reached)_ | Replies to this review                             |
| `isApproved`         | `Boolean!`                              | Whether approved by moderators                     |
| `moderatedAt`        | `DateTime`                              | When moderated                                     |
| `moderatedBy`        | `User` _(max depth reached)_            | Who moderated                                      |
| `createdAt`          | `DateTime!`                             | When created                                       |
| `updatedAt`          | `DateTime!`                             | When last updated                                  |

**User fields:**

| Field                                                                                                                                     | Type                                      | Description                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------- |
| `id`                                                                                                                                      | `UUID!`                                   | Unique identifier for the user                                               |
| `email`                                                                                                                                   | `String!`                                 | User's email address (unique)                                                |
| `displayName`                                                                                                                             | `String!`                                 | User's display name                                                          |
| `avatarUrl`                                                                                                                               | `String`                                  | URL to user's avatar image                                                   |
| `status`                                                                                                                                  | `UserStatus!` _(max depth reached)_       | User's account status                                                        |
| `role`                                                                                                                                    | `UserRole!` _(max depth reached)_         | User's role and permissions                                                  |
| `profile`                                                                                                                                 | `UserProfile` _(max depth reached)_       | User's profile information                                                   |
| `addresses`                                                                                                                               | `[Address!]!` _(max depth reached)_       | User's shipping addresses                                                    |
| @deprecated Use `addressBook` instead for better address management (deprecated: Use `addressBook` instead for better address management) |
| `addressBook`                                                                                                                             | `AddressBook!` _(max depth reached)_      | User's address book with labeled addresses                                   |
| `orders`                                                                                                                                  | `OrderConnection!` _(max depth reached)_  | Orders placed by this user (creates circular reference with Order.customer)  |
| `reviews`                                                                                                                                 | `ReviewConnection!` _(max depth reached)_ | Reviews written by this user (creates circular reference with Review.author) |
| `wishlist`                                                                                                                                | `[Product!]!` _(max depth reached)_       | Products in user's wishlist                                                  |
| `cart`                                                                                                                                    | `Cart` _(max depth reached)_              | User's shopping cart                                                         |
| `totalSpent`                                                                                                                              | `Money!`                                  | Total amount spent by this user                                              |
| `orderCount`                                                                                                                              | `Int!`                                    | Number of orders placed                                                      |
| `createdAt`                                                                                                                               | `DateTime!`                               | When the user was created                                                    |
| `updatedAt`                                                                                                                               | `DateTime!`                               | When the user was last updated                                               |
| `deletedAt`                                                                                                                               | `DateTime`                                | When the user was deleted (soft delete)                                      |
| `isDeleted`                                                                                                                               | `Boolean!`                                | Whether the user account is deleted                                          |

**Example: Price Alert**

Receive notification when a wishlisted item goes on sale

```graphql
subscription OnNotification {
  notificationReceived {
    id
    type
    title
    message
    data
    read
    createdAt
  }
}
```

```json
{
  "data": {
    "notificationReceived": {
      "id": "notif_001",
      "type": "PRICE_ALERT",
      "title": "Price Drop Alert",
      "message": "Wireless Headphones Pro is now 20% off!",
      "data": {
        "productId": "prod_123",
        "originalPrice": "199.99",
        "salePrice": "159.99",
        "discount": "20%"
      },
      "read": false,
      "createdAt": "2024-01-20T09:00:00Z"
    }
  }
}
```

**Example: Order Shipped**

Receive notification when an order ships

```graphql
subscription OnNotification {
  notificationReceived {
    id
    type
    title
    message
    data
    actionUrl
  }
}
```

```json
{
  "data": {
    "notificationReceived": {
      "id": "notif_002",
      "type": "ORDER_UPDATE",
      "title": "Your order has shipped!",
      "message": "Order #ORD-2024-001 is on its way. Estimated delivery: Jan 22.",
      "data": {
        "orderId": "ord_789",
        "orderNumber": "ORD-2024-001",
        "trackingNumber": "1234567890"
      },
      "actionUrl": "/orders/ord_789"
    }
  }
}
```

**Example: Back in Stock**

Receive notification when a previously out-of-stock item becomes available

```graphql
subscription OnNotification {
  notificationReceived {
    id
    type
    title
    message
    data
  }
}
```

```json
{
  "data": {
    "notificationReceived": {
      "id": "notif_003",
      "type": "BACK_IN_STOCK",
      "title": "Back in Stock",
      "message": "Limited Edition Speaker is back in stock! Only 5 left.",
      "data": {
        "productId": "prod_limited",
        "availableQuantity": 5
      }
    }
  }
}
```

**Example: Review Response**

Receive notification when a seller responds to your review

```graphql
subscription OnNotification {
  notificationReceived {
    id
    type
    title
    message
    data
  }
}
```

```json
{
  "data": {
    "notificationReceived": {
      "id": "notif_004",
      "type": "REVIEW_RESPONSE",
      "title": "Seller responded to your review",
      "message": "TechStore has responded to your review of Wireless Headphones Pro",
      "data": {
        "reviewId": "rev_123",
        "productId": "prod_123",
        "sellerResponse": "Thank you for your feedback! We're glad you're enjoying the product."
      }
    }
  }
}
```

**Example: Unauthenticated**

Subscription requires authentication

```graphql
subscription OnNotification {
  notificationReceived {
    id
    type
    message
  }
}
```

```json
{
  "data": null,
  "errors": [
    {
      "message": "Authentication required for notifications",
      "extensions": {
        "code": "UNAUTHENTICATED"
      },
      "path": ["notificationReceived"]
    }
  ]
}
```
