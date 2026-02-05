# Orders & Checkout

> Part of [GraphQL API](./index.md) GraphQL API

---

## Queries

### Cart

#### cart

Get the current user's cart

**Returns:** `Cart`

| Field            | Type           | Description                |
| ---------------- | -------------- | -------------------------- |
| `id`             | `UUID!`        | Unique identifier          |
| `items`          | `[CartItem!]!` | Cart items                 |
| `itemCount`      | `Int!`         | Number of items in cart    |
| `subtotal`       | `Money!`       | Cart subtotal              |
| `estimatedTax`   | `Money`        | Estimated tax              |
| `estimatedTotal` | `Money!`       | Estimated total            |
| `appliedCoupons` | `[Coupon!]!`   | Applied coupon codes       |
| `updatedAt`      | `DateTime!`    | When cart was last updated |

**CartItem fields:**

| Field        | Type             | Description               |
| ------------ | ---------------- | ------------------------- |
| `id`         | `UUID!`          | Unique identifier         |
| `product`    | `Product!`       | —                         |
| `variant`    | `ProductVariant` | The specific variant      |
| `quantity`   | `Int!`           | Quantity in cart          |
| `unitPrice`  | `Money!`         | Unit price                |
| `totalPrice` | `Money!`         | Total price for this item |

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

**ProductVariant fields:**

| Field         | Type                                      | Description                                                       |
| ------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| `id`          | `UUID!`                                   | Unique identifier                                                 |
| `sku`         | `String!`                                 | SKU (Stock Keeping Unit)                                          |
| `name`        | `String!`                                 | Variant name (e.g., "Large / Blue")                               |
| `price`       | `Money`                                   | Variant-specific price (if different from base)                   |
| `options`     | `[VariantOption!]!` _(max depth reached)_ | Variant options (size, color, etc.)                               |
| `inventory`   | `InventoryInfo!` _(max depth reached)_    | Inventory information - contains warehouse details (deep nesting) |
| `weightGrams` | `Int`                                     | Weight in grams (for shipping calculation)                        |
| `isAvailable` | `Boolean!`                                | Whether this variant is available for purchase                    |

**Coupon fields:**

| Field           | Type       | Description                           |
| --------------- | ---------- | ------------------------------------- |
| `code`          | `String!`  | Coupon code                           |
| `description`   | `String!`  | Discount description                  |
| `discountValue` | `String!`  | Discount amount or percentage         |
| `isPercentage`  | `Boolean!` | Whether this is a percentage discount |

**Example: Get Cart**

Retrieve the current shopping cart with all items

```graphql
query GetCart {
  cart {
    id
    items {
      id
      product {
        name
        price
      }
      quantity
    }
    subtotal
    total
    itemCount
  }
}
```

```json
{
  "data": {
    "cart": {
      "id": "cart_123",
      "items": [
        {
          "id": "item_1",
          "product": {
            "name": "Wireless Headphones",
            "price": "99.99"
          },
          "quantity": 1
        }
      ],
      "subtotal": "99.99",
      "total": "107.99",
      "itemCount": 1
    }
  }
}
```

**Example: Empty Cart**

When the cart is empty, items array is empty and totals are zero

```graphql
query GetCart {
  cart {
    id
    items {
      id
    }
    total
    itemCount
  }
}
```

```json
{
  "data": {
    "cart": {
      "id": "cart_new_user",
      "items": [],
      "total": "0.00",
      "itemCount": 0
    }
  }
}
```

**Example: Cart with Unavailable Items**

Items that have become unavailable since being added are flagged in the response

```graphql
query GetCart {
  cart {
    id
    items {
      id
      product {
        name
        isAvailable
      }
      quantity
    }
    warnings {
      type
      message
      itemId
    }
    total
  }
}
```

```json
{
  "data": {
    "cart": {
      "id": "cart_456",
      "items": [
        {
          "id": "item_available",
          "product": {
            "name": "Wireless Headphones",
            "isAvailable": true
          },
          "quantity": 1
        },
        {
          "id": "item_unavailable",
          "product": {
            "name": "Limited Edition Speaker",
            "isAvailable": false
          },
          "quantity": 1
        }
      ],
      "warnings": [
        {
          "type": "ITEM_UNAVAILABLE",
          "message": "Limited Edition Speaker is no longer available",
          "itemId": "item_unavailable"
        }
      ],
      "total": "99.99"
    }
  }
}
```

### order

Get an order by ID

**Arguments:**

| Argument | Type    | Required | Description |
| -------- | ------- | -------- | ----------- |
| `id`     | `UUID!` | Yes      | Order ID    |

**Returns:** `Order`

| Field             | Type             | Description                                        |
| ----------------- | ---------------- | -------------------------------------------------- |
| `id`              | `UUID!`          | Unique identifier                                  |
| `orderNumber`     | `String!`        | Human-readable order number                        |
| `customer`        | `User!`          | Customer who placed the order (circular reference) |
| `status`          | `OrderStatus!`   | Current order status                               |
| `items`           | `[OrderItem!]!`  | Order line items                                   |
| `subtotal`        | `Money!`         | Subtotal before tax and shipping                   |
| `taxAmount`       | `Money!`         | Tax amount                                         |
| `shippingAmount`  | `Money!`         | Shipping cost                                      |
| `discountAmount`  | `Money!`         | Discount amount                                    |
| `total`           | `Money!`         | Total order amount                                 |
| `currency`        | `Currency!`      | Currency used for this order                       |
| `shippingAddress` | `Address!`       | Shipping address                                   |
| `billingAddress`  | `Address!`       | Billing address                                    |
| `payment`         | `PaymentInfo!`   | Payment information                                |
| `shipping`        | `ShippingInfo`   | Shipping information                               |
| `appliedCoupons`  | `[Coupon!]!`     | Applied coupon codes                               |
| `customerNotes`   | `String`         | Order notes from customer                          |
| `internalNotes`   | `String`         | Internal notes (admin only)                        |
| `timeline`        | `[OrderEvent!]!` | Order history/timeline                             |
| `createdAt`       | `DateTime!`      | When created                                       |
| `updatedAt`       | `DateTime!`      | When last updated                                  |

**User fields:**

| Field                                                                                                                                     | Type                | Description                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------- |
| `id`                                                                                                                                      | `UUID!`             | Unique identifier for the user                                               |
| `email`                                                                                                                                   | `String!`           | User's email address (unique)                                                |
| `displayName`                                                                                                                             | `String!`           | User's display name                                                          |
| `avatarUrl`                                                                                                                               | `String`            | URL to user's avatar image                                                   |
| `status`                                                                                                                                  | `UserStatus!`       | User's account status                                                        |
| `role`                                                                                                                                    | `UserRole!`         | User's role and permissions                                                  |
| `profile`                                                                                                                                 | `UserProfile`       | User's profile information                                                   |
| `addresses`                                                                                                                               | `[Address!]!`       | User's shipping addresses                                                    |
| @deprecated Use `addressBook` instead for better address management (deprecated: Use `addressBook` instead for better address management) |
| `addressBook`                                                                                                                             | `AddressBook!`      | User's address book with labeled addresses                                   |
| `orders`                                                                                                                                  | `OrderConnection!`  | Orders placed by this user (creates circular reference with Order.customer)  |
| `reviews`                                                                                                                                 | `ReviewConnection!` | Reviews written by this user (creates circular reference with Review.author) |
| `wishlist`                                                                                                                                | `[Product!]!`       | Products in user's wishlist                                                  |
| `cart`                                                                                                                                    | `Cart`              | User's shopping cart                                                         |
| `totalSpent`                                                                                                                              | `Money!`            | Total amount spent by this user                                              |
| `orderCount`                                                                                                                              | `Int!`              | Number of orders placed                                                      |
| `createdAt`                                                                                                                               | `DateTime!`         | When the user was created                                                    |
| `updatedAt`                                                                                                                               | `DateTime!`         | When the user was last updated                                               |
| `deletedAt`                                                                                                                               | `DateTime`          | When the user was deleted (soft delete)                                      |
| `isDeleted`                                                                                                                               | `Boolean!`          | Whether the user account is deleted                                          |

**UserStatus values:**

| UserStatus Value       | Description                                 |
| ---------------------- | ------------------------------------------- |
| `ACTIVE`               | User account is active and in good standing |
| `SUSPENDED`            | User account is temporarily suspended       |
| `BANNED`               | User account has been permanently banned    |
| `PENDING_VERIFICATION` | User account is pending email verification  |

**UserRole values:**

| UserRole Value | Description                                   |
| -------------- | --------------------------------------------- |
| `CUSTOMER`     | Regular customer with standard permissions    |
| `SELLER`       | Seller with ability to list products          |
| `ADMIN`        | Administrator with full system access         |
| `SUPPORT`      | Support staff with limited admin capabilities |

**UserProfile fields:**

| Field               | Type                             | Description                                  |
| ------------------- | -------------------------------- | -------------------------------------------- |
| `firstName`         | `String`                         | User's first name                            |
| `lastName`          | `String`                         | User's last name                             |
| `phoneNumber`       | `String`                         | User's phone number                          |
| `dateOfBirth`       | `DateTime`                       | User's date of birth                         |
| `bio`               | `String`                         | User's bio or description                    |
| `preferredLanguage` | `String`                         | User's preferred language (ISO 639-1 code)   |
| `preferredCurrency` | `Currency` _(max depth reached)_ | User's preferred currency                    |
| `marketingOptIn`    | `Boolean!`                       | Whether user has opted into marketing emails |

**Address fields:**

| Field         | Type       | Description                              |
| ------------- | ---------- | ---------------------------------------- |
| `id`          | `UUID!`    | Unique identifier                        |
| `street1`     | `String!`  | Street address line 1                    |
| `street2`     | `String`   | Street address line 2 (apt, suite, etc.) |
| `city`        | `String!`  | City name                                |
| `state`       | `String!`  | State or province                        |
| `postalCode`  | `String!`  | Postal/ZIP code                          |
| `countryCode` | `String!`  | Country code (ISO 3166-1 alpha-2)        |
| `isDefault`   | `Boolean!` | Whether this is the default address      |

**AddressBook fields:**

| Field             | Type                                       | Description                       |
| ----------------- | ------------------------------------------ | --------------------------------- |
| `addresses`       | `[LabeledAddress!]!` _(max depth reached)_ | All addresses in the address book |
| `defaultShipping` | `LabeledAddress` _(max depth reached)_     | Default shipping address          |
| `defaultBilling`  | `LabeledAddress` _(max depth reached)_     | Default billing address           |

**OrderConnection fields:**

| Field      | Type                                  | Description     |
| ---------- | ------------------------------------- | --------------- |
| `edges`    | `[OrderEdge!]!` _(max depth reached)_ | The orders      |
| `pageInfo` | `PageInfo!` _(max depth reached)_     | Pagination info |

**ReviewConnection fields:**

| Field      | Type                                   | Description     |
| ---------- | -------------------------------------- | --------------- |
| `edges`    | `[ReviewEdge!]!` _(max depth reached)_ | The reviews     |
| `pageInfo` | `PageInfo!` _(max depth reached)_      | Pagination info |

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
| `seller`                                                                       | `User!`                                          | Seller who listed this product _(see User above)_                  |
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

**Cart fields:**

| Field            | Type                                 | Description                |
| ---------------- | ------------------------------------ | -------------------------- |
| `id`             | `UUID!`                              | Unique identifier          |
| `items`          | `[CartItem!]!` _(max depth reached)_ | Cart items                 |
| `itemCount`      | `Int!`                               | Number of items in cart    |
| `subtotal`       | `Money!`                             | Cart subtotal              |
| `estimatedTax`   | `Money`                              | Estimated tax              |
| `estimatedTotal` | `Money!`                             | Estimated total            |
| `appliedCoupons` | `[Coupon!]!` _(max depth reached)_   | Applied coupon codes       |
| `updatedAt`      | `DateTime!`                          | When cart was last updated |

**OrderStatus values:**

| OrderStatus Value | Description                                 |
| ----------------- | ------------------------------------------- |
| `PENDING`         | Order has been placed but not yet processed |
| `CONFIRMED`       | Payment has been confirmed                  |
| `PROCESSING`      | Order is being prepared for shipment        |
| `SHIPPED`         | Order has been shipped                      |
| `DELIVERED`       | Order has been delivered                    |
| `CANCELLED`       | Order has been cancelled                    |
| `REFUNDED`        | Order has been refunded                     |

**OrderItem fields:**

| Field            | Type                        | Description                        |
| ---------------- | --------------------------- | ---------------------------------- |
| `id`             | `UUID!`                     | Unique identifier                  |
| `product`        | `Product!`                  | The product ordered                |
| `variant`        | `ProductVariant`            | The specific variant ordered       |
| `quantity`       | `Int!`                      | Quantity ordered                   |
| `unitPrice`      | `Money!`                    | Price per unit at time of order    |
| `totalPrice`     | `Money!`                    | Total price for this line item     |
| `customizations` | `[OrderItemCustomization!]` | Any customization options selected |

**ProductVariant fields:**

| Field         | Type                                      | Description                                                       |
| ------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| `id`          | `UUID!`                                   | Unique identifier                                                 |
| `sku`         | `String!`                                 | SKU (Stock Keeping Unit)                                          |
| `name`        | `String!`                                 | Variant name (e.g., "Large / Blue")                               |
| `price`       | `Money`                                   | Variant-specific price (if different from base)                   |
| `options`     | `[VariantOption!]!` _(max depth reached)_ | Variant options (size, color, etc.)                               |
| `inventory`   | `InventoryInfo!` _(max depth reached)_    | Inventory information - contains warehouse details (deep nesting) |
| `weightGrams` | `Int`                                     | Weight in grams (for shipping calculation)                        |
| `isAvailable` | `Boolean!`                                | Whether this variant is available for purchase                    |

**OrderItemCustomization fields:**

| Field            | Type      | Description                            |
| ---------------- | --------- | -------------------------------------- |
| `name`           | `String!` | Customization name                     |
| `value`          | `String!` | Customization value                    |
| `additionalCost` | `Money`   | Additional cost for this customization |

**Currency values:**

| Currency Value | Description            |
| -------------- | ---------------------- |
| `USD`          | United States Dollar   |
| `EUR`          | Euro                   |
| `GBP`          | British Pound Sterling |
| `JPY`          | Japanese Yen           |

**PaymentInfo fields:**

| Field           | Type             | Description                           |
| --------------- | ---------------- | ------------------------------------- |
| `method`        | `PaymentMethod!` | Payment method used                   |
| `status`        | `String!`        | Payment status                        |
| `transactionId` | `String`         | Transaction ID from payment processor |
| `cardLast4`     | `String`         | Last 4 digits of card (if applicable) |
| `cardBrand`     | `String`         | Card brand (if applicable)            |
| `processedAt`   | `DateTime`       | When payment was processed            |

**PaymentMethod values:**

| PaymentMethod Value | Description                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| `CARD`              | Credit or debit card payment                                                                              |
| `PAYPAL`            | PayPal payment                                                                                            |
| `BANK_TRANSFER`     | Bank transfer                                                                                             |
| `CRYPTO`            | Cryptocurrency payment (deprecated: Crypto payments will be removed in v2.0. Use CARD or PAYPAL instead.) |

**ShippingInfo fields:**

| Field               | Type              | Description              |
| ------------------- | ----------------- | ------------------------ |
| `method`            | `ShippingMethod!` | Shipping method selected |
| `carrier`           | `String`          | Carrier name             |
| `trackingNumber`    | `String`          | Tracking number          |
| `trackingUrl`       | `String`          | Tracking URL             |
| `estimatedDelivery` | `DateTime`        | Estimated delivery date  |
| `deliveredAt`       | `DateTime`        | Actual delivery date     |

**ShippingMethod fields:**

| Field              | Type       | Description                             |
| ------------------ | ---------- | --------------------------------------- |
| `id`               | `UUID!`    | Unique identifier                       |
| `name`             | `String!`  | Method name (e.g., "Standard Shipping") |
| `description`      | `String`   | Method description                      |
| `baseCost`         | `Money!`   | Base cost                               |
| `estimatedDaysMin` | `Int!`     | Estimated delivery days (min)           |
| `estimatedDaysMax` | `Int!`     | Estimated delivery days (max)           |
| `isAvailable`      | `Boolean!` | Whether this method is available        |

**Coupon fields:**

| Field           | Type       | Description                           |
| --------------- | ---------- | ------------------------------------- |
| `code`          | `String!`  | Coupon code                           |
| `description`   | `String!`  | Discount description                  |
| `discountValue` | `String!`  | Discount amount or percentage         |
| `isPercentage`  | `Boolean!` | Whether this is a percentage discount |

**OrderEvent fields:**

| Field         | Type        | Description                                  |
| ------------- | ----------- | -------------------------------------------- |
| `type`        | `String!`   | Event type                                   |
| `description` | `String!`   | Event description                            |
| `occurredAt`  | `DateTime!` | When the event occurred                      |
| `actor`       | `User`      | User who triggered the event (if applicable) |

**Example: Get Order Details**

Retrieve complete details for a specific order including items and shipping

```graphql
query GetOrder($id: UUID!) {
  order(id: $id) {
    orderNumber
    status
    total
    items {
      product {
        name
      }
      quantity
      unitPrice
    }
    shippingAddress {
      street1
      city
    }
  }
}
```

```json
{
  "data": {
    "order": {
      "orderNumber": "ORD-2024-001",
      "status": "SHIPPED",
      "total": "99.99",
      "items": [
        {
          "product": {
            "name": "Wireless Headphones"
          },
          "quantity": 1,
          "unitPrice": "99.99"
        }
      ],
      "shippingAddress": {
        "street1": "123 Main St",
        "city": "New York"
      }
    }
  }
}
```

**Example: Order Not Found**

When the order ID doesn't exist or belongs to a different user, the query returns null.

```graphql
query GetOrder($id: UUID!) {
  order(id: $id) {
    orderNumber
    status
  }
}
```

```json
{
  "data": {
    "order": null
  },
  "errors": [
    {
      "message": "Order not found",
      "extensions": {
        "code": "NOT_FOUND",
        "resourceType": "Order"
      },
      "path": ["order"]
    }
  ]
}
```

**Example: Access Denied**

Attempting to view another user's order without admin permissions results in an access error.

```graphql
query GetOrder($id: UUID!) {
  order(id: $id) {
    orderNumber
    status
  }
}
```

```json
{
  "data": {
    "order": null
  },
  "errors": [
    {
      "message": "You do not have permission to view this order",
      "extensions": {
        "code": "FORBIDDEN"
      },
      "path": ["order"]
    }
  ]
}
```

### myOrders

List orders for the current user

**Arguments:**

| Argument        | Type               | Required | Default | Description       |
| --------------- | ------------------ | -------- | ------- | ----------------- |
| `filter`        | `OrderFilterInput` | No       | —       | Filter options    |
| `sortDirection` | `SortDirection`    | No       | `DESC`  | Sort direction    |
| `first`         | `Int`              | No       | `20`    | Number of results |
| `after`         | `String`           | No       | —       | Pagination cursor |

**Returns:** `OrderConnection!`

| Field      | Type            | Description     |
| ---------- | --------------- | --------------- |
| `edges`    | `[OrderEdge!]!` | The orders      |
| `pageInfo` | `PageInfo!`     | Pagination info |

**OrderEdge fields:**

| Field    | Type      | Description       |
| -------- | --------- | ----------------- |
| `node`   | `Order!`  | The order         |
| `cursor` | `String!` | Pagination cursor |

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

**PageInfo fields:**

| Field             | Type       | Description                         |
| ----------------- | ---------- | ----------------------------------- |
| `hasNextPage`     | `Boolean!` | Whether there are more items after  |
| `hasPreviousPage` | `Boolean!` | Whether there are more items before |
| `startCursor`     | `String`   | Cursor of the first item            |
| `endCursor`       | `String`   | Cursor of the last item             |
| `totalCount`      | `Int!`     | Total count of items                |

**Example: List Recent Orders**

Get a paginated list of the current user's orders, sorted by most recent first

```graphql
query MyOrders($first: Int, $after: String) {
  myOrders(first: $first, after: $after) {
    edges {
      node {
        orderNumber
        status
        createdAt
        total
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

```json
{
  "data": {
    "myOrders": {
      "edges": [
        {
          "node": {
            "orderNumber": "ORD-2024-003",
            "status": "DELIVERED",
            "createdAt": "2024-01-20T10:00:00Z",
            "total": "149.99"
          },
          "cursor": "cursor_003"
        },
        {
          "node": {
            "orderNumber": "ORD-2024-002",
            "status": "SHIPPED",
            "createdAt": "2024-01-15T10:00:00Z",
            "total": "99.99"
          },
          "cursor": "cursor_002"
        }
      ],
      "pageInfo": {
        "hasNextPage": true,
        "endCursor": "cursor_002"
      }
    }
  }
}
```

**Example: Filter by Status**

Filter orders by their current status to find specific orders

```graphql
query MyOrders($first: Int, $status: OrderStatus) {
  myOrders(first: $first, filter: { status: $status }) {
    edges {
      node {
        orderNumber
        status
        total
      }
    }
    totalCount
  }
}
```

```json
{
  "data": {
    "myOrders": {
      "edges": [
        {
          "node": {
            "orderNumber": "ORD-2024-005",
            "status": "PENDING",
            "total": "299.99"
          }
        }
      ],
      "totalCount": 1
    }
  }
}
```

**Example: No Orders**

When the user has no orders, an empty list is returned

```graphql
query MyOrders($first: Int) {
  myOrders(first: $first) {
    edges {
      node {
        orderNumber
      }
    }
    totalCount
  }
}
```

```json
{
  "data": {
    "myOrders": {
      "edges": [],
      "totalCount": 0
    }
  }
}
```

## Mutations

### Cart

#### addToCart

Add an item to the shopping cart

**Arguments:**

| Argument | Type              | Required | Description |
| -------- | ----------------- | -------- | ----------- |
| `input`  | `AddToCartInput!` | Yes      | Item to add |

**Returns:** `Cart!`

| Field            | Type           | Description                |
| ---------------- | -------------- | -------------------------- |
| `id`             | `UUID!`        | Unique identifier          |
| `items`          | `[CartItem!]!` | Cart items                 |
| `itemCount`      | `Int!`         | Number of items in cart    |
| `subtotal`       | `Money!`       | Cart subtotal              |
| `estimatedTax`   | `Money`        | Estimated tax              |
| `estimatedTotal` | `Money!`       | Estimated total            |
| `appliedCoupons` | `[Coupon!]!`   | Applied coupon codes       |
| `updatedAt`      | `DateTime!`    | When cart was last updated |

**CartItem fields:**

| Field        | Type             | Description               |
| ------------ | ---------------- | ------------------------- |
| `id`         | `UUID!`          | Unique identifier         |
| `product`    | `Product!`       | —                         |
| `variant`    | `ProductVariant` | The specific variant      |
| `quantity`   | `Int!`           | Quantity in cart          |
| `unitPrice`  | `Money!`         | Unit price                |
| `totalPrice` | `Money!`         | Total price for this item |

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

**ProductVariant fields:**

| Field         | Type                                      | Description                                                       |
| ------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| `id`          | `UUID!`                                   | Unique identifier                                                 |
| `sku`         | `String!`                                 | SKU (Stock Keeping Unit)                                          |
| `name`        | `String!`                                 | Variant name (e.g., "Large / Blue")                               |
| `price`       | `Money`                                   | Variant-specific price (if different from base)                   |
| `options`     | `[VariantOption!]!` _(max depth reached)_ | Variant options (size, color, etc.)                               |
| `inventory`   | `InventoryInfo!` _(max depth reached)_    | Inventory information - contains warehouse details (deep nesting) |
| `weightGrams` | `Int`                                     | Weight in grams (for shipping calculation)                        |
| `isAvailable` | `Boolean!`                                | Whether this variant is available for purchase                    |

**Coupon fields:**

| Field           | Type       | Description                           |
| --------------- | ---------- | ------------------------------------- |
| `code`          | `String!`  | Coupon code                           |
| `description`   | `String!`  | Discount description                  |
| `discountValue` | `String!`  | Discount amount or percentage         |
| `isPercentage`  | `Boolean!` | Whether this is a percentage discount |

**Example: Add Single Item**

Add a product to the shopping cart

```graphql
mutation AddToCart($input: AddToCartInput!) {
  addToCart(input: $input) {
    id
    itemCount
    total
    addedItem {
      id
      product {
        name
      }
      quantity
    }
  }
}
```

```json
{
  "data": {
    "addToCart": {
      "id": "cart_123",
      "itemCount": 2,
      "total": "179.98",
      "addedItem": {
        "id": "item_new",
        "product": {
          "name": "Bluetooth Speaker"
        },
        "quantity": 1
      }
    }
  }
}
```

**Example: Product Out of Stock**

Attempting to add an out-of-stock product returns an error

```graphql
mutation AddToCart($input: AddToCartInput!) {
  addToCart(input: $input) {
    id
    itemCount
  }
}
```

```json
{
  "data": null,
  "errors": [
    {
      "message": "Product is currently out of stock",
      "extensions": {
        "code": "OUT_OF_STOCK",
        "productId": "prod_sold_out",
        "restockDate": "2024-02-01"
      },
      "path": ["addToCart"]
    }
  ]
}
```

**Example: Quantity Exceeds Stock**

When requested quantity exceeds available stock, only available quantity is added

```graphql
mutation AddToCart($input: AddToCartInput!) {
  addToCart(input: $input) {
    id
    addedItem {
      quantity
    }
    warnings {
      type
      message
    }
  }
}
```

```json
{
  "data": {
    "addToCart": {
      "id": "cart_123",
      "addedItem": {
        "quantity": 3
      },
      "warnings": [
        {
          "type": "QUANTITY_ADJUSTED",
          "message": "Only 3 units available. Quantity adjusted from 10 to 3."
        }
      ]
    }
  }
}
```

**Example: Product Not Found**

Adding a non-existent product returns a not found error

```graphql
mutation AddToCart($input: AddToCartInput!) {
  addToCart(input: $input) {
    id
  }
}
```

```json
{
  "data": null,
  "errors": [
    {
      "message": "Product not found",
      "extensions": {
        "code": "NOT_FOUND",
        "resourceType": "Product"
      },
      "path": ["addToCart"]
    }
  ]
}
```

#### updateCartItem

Update quantity of a cart item

**Arguments:**

| Argument | Type                   | Required | Description |
| -------- | ---------------------- | -------- | ----------- |
| `input`  | `UpdateCartItemInput!` | Yes      | Update data |

**Returns:** `Cart!`

| Field            | Type           | Description                |
| ---------------- | -------------- | -------------------------- |
| `id`             | `UUID!`        | Unique identifier          |
| `items`          | `[CartItem!]!` | Cart items                 |
| `itemCount`      | `Int!`         | Number of items in cart    |
| `subtotal`       | `Money!`       | Cart subtotal              |
| `estimatedTax`   | `Money`        | Estimated tax              |
| `estimatedTotal` | `Money!`       | Estimated total            |
| `appliedCoupons` | `[Coupon!]!`   | Applied coupon codes       |
| `updatedAt`      | `DateTime!`    | When cart was last updated |

**CartItem fields:**

| Field        | Type             | Description               |
| ------------ | ---------------- | ------------------------- |
| `id`         | `UUID!`          | Unique identifier         |
| `product`    | `Product!`       | —                         |
| `variant`    | `ProductVariant` | The specific variant      |
| `quantity`   | `Int!`           | Quantity in cart          |
| `unitPrice`  | `Money!`         | Unit price                |
| `totalPrice` | `Money!`         | Total price for this item |

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

**ProductVariant fields:**

| Field         | Type                                      | Description                                                       |
| ------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| `id`          | `UUID!`                                   | Unique identifier                                                 |
| `sku`         | `String!`                                 | SKU (Stock Keeping Unit)                                          |
| `name`        | `String!`                                 | Variant name (e.g., "Large / Blue")                               |
| `price`       | `Money`                                   | Variant-specific price (if different from base)                   |
| `options`     | `[VariantOption!]!` _(max depth reached)_ | Variant options (size, color, etc.)                               |
| `inventory`   | `InventoryInfo!` _(max depth reached)_    | Inventory information - contains warehouse details (deep nesting) |
| `weightGrams` | `Int`                                     | Weight in grams (for shipping calculation)                        |
| `isAvailable` | `Boolean!`                                | Whether this variant is available for purchase                    |

**Coupon fields:**

| Field           | Type       | Description                           |
| --------------- | ---------- | ------------------------------------- |
| `code`          | `String!`  | Coupon code                           |
| `description`   | `String!`  | Discount description                  |
| `discountValue` | `String!`  | Discount amount or percentage         |
| `isPercentage`  | `Boolean!` | Whether this is a percentage discount |

**Example: Update Quantity**

Change the quantity of an item in the cart

```graphql
mutation UpdateCartItem($input: UpdateCartItemInput!) {
  updateCartItem(input: $input) {
    id
    items {
      id
      quantity
    }
    total
  }
}
```

```json
{
  "data": {
    "updateCartItem": {
      "id": "cart_123",
      "items": [
        {
          "id": "item_789",
          "quantity": 3
        }
      ],
      "total": "299.97"
    }
  }
}
```

**Example: Item Not in Cart**

Attempting to update an item that doesn't exist in the cart

```graphql
mutation UpdateCartItem($input: UpdateCartItemInput!) {
  updateCartItem(input: $input) {
    id
  }
}
```

```json
{
  "data": null,
  "errors": [
    {
      "message": "Item not found in cart",
      "extensions": {
        "code": "ITEM_NOT_IN_CART",
        "itemId": "item_not_in_cart"
      },
      "path": ["updateCartItem"]
    }
  ]
}
```

**Example: Invalid Quantity**

Quantity must be a positive integer. Setting to 0 should use removeFromCart instead.

```graphql
mutation UpdateCartItem($input: UpdateCartItemInput!) {
  updateCartItem(input: $input) {
    id
  }
}
```

```json
{
  "data": null,
  "errors": [
    {
      "message": "Quantity must be a positive integer",
      "extensions": {
        "code": "INVALID_QUANTITY",
        "field": "quantity",
        "minValue": 1
      },
      "path": ["updateCartItem"]
    }
  ]
}
```

#### removeFromCart

Remove an item from the cart

**Arguments:**

| Argument     | Type    | Required | Description            |
| ------------ | ------- | -------- | ---------------------- |
| `cartItemId` | `UUID!` | Yes      | Cart item ID to remove |

**Returns:** `Cart!`

| Field            | Type           | Description                |
| ---------------- | -------------- | -------------------------- |
| `id`             | `UUID!`        | Unique identifier          |
| `items`          | `[CartItem!]!` | Cart items                 |
| `itemCount`      | `Int!`         | Number of items in cart    |
| `subtotal`       | `Money!`       | Cart subtotal              |
| `estimatedTax`   | `Money`        | Estimated tax              |
| `estimatedTotal` | `Money!`       | Estimated total            |
| `appliedCoupons` | `[Coupon!]!`   | Applied coupon codes       |
| `updatedAt`      | `DateTime!`    | When cart was last updated |

**CartItem fields:**

| Field        | Type             | Description               |
| ------------ | ---------------- | ------------------------- |
| `id`         | `UUID!`          | Unique identifier         |
| `product`    | `Product!`       | —                         |
| `variant`    | `ProductVariant` | The specific variant      |
| `quantity`   | `Int!`           | Quantity in cart          |
| `unitPrice`  | `Money!`         | Unit price                |
| `totalPrice` | `Money!`         | Total price for this item |

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

**ProductVariant fields:**

| Field         | Type                                      | Description                                                       |
| ------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| `id`          | `UUID!`                                   | Unique identifier                                                 |
| `sku`         | `String!`                                 | SKU (Stock Keeping Unit)                                          |
| `name`        | `String!`                                 | Variant name (e.g., "Large / Blue")                               |
| `price`       | `Money`                                   | Variant-specific price (if different from base)                   |
| `options`     | `[VariantOption!]!` _(max depth reached)_ | Variant options (size, color, etc.)                               |
| `inventory`   | `InventoryInfo!` _(max depth reached)_    | Inventory information - contains warehouse details (deep nesting) |
| `weightGrams` | `Int`                                     | Weight in grams (for shipping calculation)                        |
| `isAvailable` | `Boolean!`                                | Whether this variant is available for purchase                    |

**Coupon fields:**

| Field           | Type       | Description                           |
| --------------- | ---------- | ------------------------------------- |
| `code`          | `String!`  | Coupon code                           |
| `description`   | `String!`  | Discount description                  |
| `discountValue` | `String!`  | Discount amount or percentage         |
| `isPercentage`  | `Boolean!` | Whether this is a percentage discount |

**Example: Remove Item**

Remove a specific item from the cart

```graphql
mutation RemoveFromCart($id: UUID!) {
  removeFromCart(cartItemId: $id) {
    id
    itemCount
    total
  }
}
```

```json
{
  "data": {
    "removeFromCart": {
      "id": "cart_123",
      "itemCount": 1,
      "total": "99.99"
    }
  }
}
```

**Example: Remove Last Item**

Removing the last item results in an empty cart

```graphql
mutation RemoveFromCart($id: UUID!) {
  removeFromCart(cartItemId: $id) {
    id
    itemCount
    items {
      id
    }
    total
  }
}
```

```json
{
  "data": {
    "removeFromCart": {
      "id": "cart_123",
      "itemCount": 0,
      "items": [],
      "total": "0.00"
    }
  }
}
```

**Example: Item Not Found**

Attempting to remove an item that doesn't exist in the cart

```graphql
mutation RemoveFromCart($id: UUID!) {
  removeFromCart(cartItemId: $id) {
    id
  }
}
```

```json
{
  "data": null,
  "errors": [
    {
      "message": "Cart item not found",
      "extensions": {
        "code": "NOT_FOUND",
        "resourceType": "CartItem"
      },
      "path": ["removeFromCart"]
    }
  ]
}
```

### Checkout

#### placeOrder

Place an order from the current cart

Returns either an Order on success, CheckoutError on failure,
or PaymentPending if payment is still processing.

**Arguments:**

| Argument | Type               | Required | Description          |
| -------- | ------------------ | -------- | -------------------- |
| `input`  | `PlaceOrderInput!` | Yes      | Order placement data |

**Returns:** `CheckoutResult!`

| Type    | Description      |
| ------- | ---------------- |
| `Order` | A customer order |

Orders track the purchase lifecycle from cart to delivery.
**Circular Reference:** Order -> User -> Orders |
| `CheckoutError` | Error returned when checkout fails |
| `PaymentPending` | Returned when payment is still processing |

**Order fields:**

| Field             | Type             | Description                                        |
| ----------------- | ---------------- | -------------------------------------------------- |
| `id`              | `UUID!`          | Unique identifier                                  |
| `orderNumber`     | `String!`        | Human-readable order number                        |
| `customer`        | `User!`          | Customer who placed the order (circular reference) |
| `status`          | `OrderStatus!`   | Current order status                               |
| `items`           | `[OrderItem!]!`  | Order line items                                   |
| `subtotal`        | `Money!`         | Subtotal before tax and shipping                   |
| `taxAmount`       | `Money!`         | Tax amount                                         |
| `shippingAmount`  | `Money!`         | Shipping cost                                      |
| `discountAmount`  | `Money!`         | Discount amount                                    |
| `total`           | `Money!`         | Total order amount                                 |
| `currency`        | `Currency!`      | Currency used for this order                       |
| `shippingAddress` | `Address!`       | Shipping address                                   |
| `billingAddress`  | `Address!`       | Billing address                                    |
| `payment`         | `PaymentInfo!`   | Payment information                                |
| `shipping`        | `ShippingInfo`   | Shipping information                               |
| `appliedCoupons`  | `[Coupon!]!`     | Applied coupon codes                               |
| `customerNotes`   | `String`         | Order notes from customer                          |
| `internalNotes`   | `String`         | Internal notes (admin only)                        |
| `timeline`        | `[OrderEvent!]!` | Order history/timeline                             |
| `createdAt`       | `DateTime!`      | When created                                       |
| `updatedAt`       | `DateTime!`      | When last updated                                  |

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

**OrderStatus values:**

| OrderStatus Value | Description                                 |
| ----------------- | ------------------------------------------- |
| `PENDING`         | Order has been placed but not yet processed |
| `CONFIRMED`       | Payment has been confirmed                  |
| `PROCESSING`      | Order is being prepared for shipment        |
| `SHIPPED`         | Order has been shipped                      |
| `DELIVERED`       | Order has been delivered                    |
| `CANCELLED`       | Order has been cancelled                    |
| `REFUNDED`        | Order has been refunded                     |

**OrderItem fields:**

| Field            | Type                                              | Description                        |
| ---------------- | ------------------------------------------------- | ---------------------------------- |
| `id`             | `UUID!`                                           | Unique identifier                  |
| `product`        | `Product!` _(max depth reached)_                  | The product ordered                |
| `variant`        | `ProductVariant` _(max depth reached)_            | The specific variant ordered       |
| `quantity`       | `Int!`                                            | Quantity ordered                   |
| `unitPrice`      | `Money!`                                          | Price per unit at time of order    |
| `totalPrice`     | `Money!`                                          | Total price for this line item     |
| `customizations` | `[OrderItemCustomization!]` _(max depth reached)_ | Any customization options selected |

**Currency values:**

| Currency Value | Description            |
| -------------- | ---------------------- |
| `USD`          | United States Dollar   |
| `EUR`          | Euro                   |
| `GBP`          | British Pound Sterling |
| `JPY`          | Japanese Yen           |

**Address fields:**

| Field         | Type       | Description                              |
| ------------- | ---------- | ---------------------------------------- |
| `id`          | `UUID!`    | Unique identifier                        |
| `street1`     | `String!`  | Street address line 1                    |
| `street2`     | `String`   | Street address line 2 (apt, suite, etc.) |
| `city`        | `String!`  | City name                                |
| `state`       | `String!`  | State or province                        |
| `postalCode`  | `String!`  | Postal/ZIP code                          |
| `countryCode` | `String!`  | Country code (ISO 3166-1 alpha-2)        |
| `isDefault`   | `Boolean!` | Whether this is the default address      |

**PaymentInfo fields:**

| Field           | Type                                   | Description                           |
| --------------- | -------------------------------------- | ------------------------------------- |
| `method`        | `PaymentMethod!` _(max depth reached)_ | Payment method used                   |
| `status`        | `String!`                              | Payment status                        |
| `transactionId` | `String`                               | Transaction ID from payment processor |
| `cardLast4`     | `String`                               | Last 4 digits of card (if applicable) |
| `cardBrand`     | `String`                               | Card brand (if applicable)            |
| `processedAt`   | `DateTime`                             | When payment was processed            |

**ShippingInfo fields:**

| Field               | Type                                    | Description              |
| ------------------- | --------------------------------------- | ------------------------ |
| `method`            | `ShippingMethod!` _(max depth reached)_ | Shipping method selected |
| `carrier`           | `String`                                | Carrier name             |
| `trackingNumber`    | `String`                                | Tracking number          |
| `trackingUrl`       | `String`                                | Tracking URL             |
| `estimatedDelivery` | `DateTime`                              | Estimated delivery date  |
| `deliveredAt`       | `DateTime`                              | Actual delivery date     |

**Coupon fields:**

| Field           | Type       | Description                           |
| --------------- | ---------- | ------------------------------------- |
| `code`          | `String!`  | Coupon code                           |
| `description`   | `String!`  | Discount description                  |
| `discountValue` | `String!`  | Discount amount or percentage         |
| `isPercentage`  | `Boolean!` | Whether this is a percentage discount |

**OrderEvent fields:**

| Field         | Type                         | Description                                  |
| ------------- | ---------------------------- | -------------------------------------------- |
| `type`        | `String!`                    | Event type                                   |
| `description` | `String!`                    | Event description                            |
| `occurredAt`  | `DateTime!`                  | When the event occurred                      |
| `actor`       | `User` _(max depth reached)_ | User who triggered the event (if applicable) |

**CheckoutError fields:**

| Field        | Type      | Description                                 |
| ------------ | --------- | ------------------------------------------- |
| `code`       | `String!` | Error code                                  |
| `message`    | `String!` | Human-readable error message                |
| `field`      | `String`  | Field that caused the error (if applicable) |
| `suggestion` | `String`  | Suggested action to resolve                 |

**PaymentPending fields:**

| Field                  | Type       | Description                 |
| ---------------------- | ---------- | --------------------------- |
| `paymentId`            | `UUID!`    | Pending payment ID          |
| `expectedCompletionAt` | `DateTime` | Expected completion time    |
| `statusUrl`            | `String!`  | URL to check payment status |
| `instructions`         | `String`   | Instructions for the user   |

**Example: Place Standard Order**

Place a standard order with credit card payment

```graphql
mutation PlaceOrder($input: PlaceOrderInput!) {
  placeOrder(input: $input) {
    ... on Order {
      id
      orderNumber
      status
      total
    }
    ... on CheckoutError {
      code
      message
    }
  }
}
```

```json
{
  "data": {
    "placeOrder": {
      "id": "ord_789",
      "orderNumber": "ORD-2024-001",
      "status": "PENDING",
      "total": "99.99"
    }
  }
}
```

**Example: Out of Stock Item**

When an item in the order is no longer available, the order fails with a stock error. The response includes which items are affected.

```graphql
mutation PlaceOrder($input: PlaceOrderInput!) {
  placeOrder(input: $input) {
    ... on Order {
      id
      orderNumber
    }
    ... on CheckoutError {
      code
      message
      details
    }
  }
}
```

```json
{
  "data": {
    "placeOrder": {
      "code": "INSUFFICIENT_STOCK",
      "message": "One or more items are out of stock",
      "details": {
        "items": [
          {
            "productId": "prod_sold_out",
            "requested": 5,
            "available": 0
          }
        ]
      }
    }
  }
}
```

**Example: Payment Declined**

The payment provider declined the transaction. This can happen due to insufficient funds, card expiry, or fraud detection.

```graphql
mutation PlaceOrder($input: PlaceOrderInput!) {
  placeOrder(input: $input) {
    ... on Order {
      id
    }
    ... on CheckoutError {
      code
      message
      details
    }
  }
}
```

```json
{
  "data": {
    "placeOrder": {
      "code": "PAYMENT_DECLINED",
      "message": "Payment was declined by your card issuer",
      "details": {
        "declineCode": "insufficient_funds",
        "suggestion": "Please try a different payment method or contact your bank"
      }
    }
  }
}
```

**Example: Invalid Shipping Address**

The shipping address could not be validated or is not serviceable by any available shipping method.

```graphql
mutation PlaceOrder($input: PlaceOrderInput!) {
  placeOrder(input: $input) {
    ... on Order {
      id
    }
    ... on CheckoutError {
      code
      message
    }
  }
}
```

```json
{
  "data": {
    "placeOrder": {
      "code": "INVALID_SHIPPING_ADDRESS",
      "message": "We cannot ship to the selected address"
    }
  }
}
```

**Example: Apply Discount Code**

Place an order with a promotional discount code applied

```graphql
mutation PlaceOrder($input: PlaceOrderInput!) {
  placeOrder(input: $input) {
    ... on Order {
      id
      orderNumber
      subtotal
      discount {
        code
        amount
      }
      total
    }
    ... on CheckoutError {
      code
      message
    }
  }
}
```

```json
{
  "data": {
    "placeOrder": {
      "id": "ord_790",
      "orderNumber": "ORD-2024-002",
      "subtotal": "199.98",
      "discount": {
        "code": "SAVE20",
        "amount": "39.99"
      },
      "total": "159.99"
    }
  }
}
```

**Example: Expired Discount Code**

The discount code has expired or reached its usage limit. The order still processes but without the discount.

```graphql
mutation PlaceOrder($input: PlaceOrderInput!) {
  placeOrder(input: $input) {
    ... on Order {
      id
      warnings {
        code
        message
      }
      total
    }
    ... on CheckoutError {
      code
      message
    }
  }
}
```

```json
{
  "data": {
    "placeOrder": {
      "id": "ord_791",
      "warnings": [
        {
          "code": "DISCOUNT_EXPIRED",
          "message": "Discount code 'EXPIRED2023' has expired and was not applied"
        }
      ],
      "total": "99.99"
    }
  }
}
```

## Subscriptions

### orderStatusChanged

Subscribe to order status updates

Receives real-time updates when the status of an order changes.
Useful for showing live order tracking to customers.

**Arguments:**

| Argument  | Type    | Required | Description              |
| --------- | ------- | -------- | ------------------------ |
| `orderId` | `UUID!` | Yes      | Order ID to subscribe to |

**Returns:** `Order!`

| Field             | Type             | Description                                        |
| ----------------- | ---------------- | -------------------------------------------------- |
| `id`              | `UUID!`          | Unique identifier                                  |
| `orderNumber`     | `String!`        | Human-readable order number                        |
| `customer`        | `User!`          | Customer who placed the order (circular reference) |
| `status`          | `OrderStatus!`   | Current order status                               |
| `items`           | `[OrderItem!]!`  | Order line items                                   |
| `subtotal`        | `Money!`         | Subtotal before tax and shipping                   |
| `taxAmount`       | `Money!`         | Tax amount                                         |
| `shippingAmount`  | `Money!`         | Shipping cost                                      |
| `discountAmount`  | `Money!`         | Discount amount                                    |
| `total`           | `Money!`         | Total order amount                                 |
| `currency`        | `Currency!`      | Currency used for this order                       |
| `shippingAddress` | `Address!`       | Shipping address                                   |
| `billingAddress`  | `Address!`       | Billing address                                    |
| `payment`         | `PaymentInfo!`   | Payment information                                |
| `shipping`        | `ShippingInfo`   | Shipping information                               |
| `appliedCoupons`  | `[Coupon!]!`     | Applied coupon codes                               |
| `customerNotes`   | `String`         | Order notes from customer                          |
| `internalNotes`   | `String`         | Internal notes (admin only)                        |
| `timeline`        | `[OrderEvent!]!` | Order history/timeline                             |
| `createdAt`       | `DateTime!`      | When created                                       |
| `updatedAt`       | `DateTime!`      | When last updated                                  |

**User fields:**

| Field                                                                                                                                     | Type                | Description                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------- |
| `id`                                                                                                                                      | `UUID!`             | Unique identifier for the user                                               |
| `email`                                                                                                                                   | `String!`           | User's email address (unique)                                                |
| `displayName`                                                                                                                             | `String!`           | User's display name                                                          |
| `avatarUrl`                                                                                                                               | `String`            | URL to user's avatar image                                                   |
| `status`                                                                                                                                  | `UserStatus!`       | User's account status                                                        |
| `role`                                                                                                                                    | `UserRole!`         | User's role and permissions                                                  |
| `profile`                                                                                                                                 | `UserProfile`       | User's profile information                                                   |
| `addresses`                                                                                                                               | `[Address!]!`       | User's shipping addresses                                                    |
| @deprecated Use `addressBook` instead for better address management (deprecated: Use `addressBook` instead for better address management) |
| `addressBook`                                                                                                                             | `AddressBook!`      | User's address book with labeled addresses                                   |
| `orders`                                                                                                                                  | `OrderConnection!`  | Orders placed by this user (creates circular reference with Order.customer)  |
| `reviews`                                                                                                                                 | `ReviewConnection!` | Reviews written by this user (creates circular reference with Review.author) |
| `wishlist`                                                                                                                                | `[Product!]!`       | Products in user's wishlist                                                  |
| `cart`                                                                                                                                    | `Cart`              | User's shopping cart                                                         |
| `totalSpent`                                                                                                                              | `Money!`            | Total amount spent by this user                                              |
| `orderCount`                                                                                                                              | `Int!`              | Number of orders placed                                                      |
| `createdAt`                                                                                                                               | `DateTime!`         | When the user was created                                                    |
| `updatedAt`                                                                                                                               | `DateTime!`         | When the user was last updated                                               |
| `deletedAt`                                                                                                                               | `DateTime`          | When the user was deleted (soft delete)                                      |
| `isDeleted`                                                                                                                               | `Boolean!`          | Whether the user account is deleted                                          |

**UserStatus values:**

| UserStatus Value       | Description                                 |
| ---------------------- | ------------------------------------------- |
| `ACTIVE`               | User account is active and in good standing |
| `SUSPENDED`            | User account is temporarily suspended       |
| `BANNED`               | User account has been permanently banned    |
| `PENDING_VERIFICATION` | User account is pending email verification  |

**UserRole values:**

| UserRole Value | Description                                   |
| -------------- | --------------------------------------------- |
| `CUSTOMER`     | Regular customer with standard permissions    |
| `SELLER`       | Seller with ability to list products          |
| `ADMIN`        | Administrator with full system access         |
| `SUPPORT`      | Support staff with limited admin capabilities |

**UserProfile fields:**

| Field               | Type                             | Description                                  |
| ------------------- | -------------------------------- | -------------------------------------------- |
| `firstName`         | `String`                         | User's first name                            |
| `lastName`          | `String`                         | User's last name                             |
| `phoneNumber`       | `String`                         | User's phone number                          |
| `dateOfBirth`       | `DateTime`                       | User's date of birth                         |
| `bio`               | `String`                         | User's bio or description                    |
| `preferredLanguage` | `String`                         | User's preferred language (ISO 639-1 code)   |
| `preferredCurrency` | `Currency` _(max depth reached)_ | User's preferred currency                    |
| `marketingOptIn`    | `Boolean!`                       | Whether user has opted into marketing emails |

**Address fields:**

| Field         | Type       | Description                              |
| ------------- | ---------- | ---------------------------------------- |
| `id`          | `UUID!`    | Unique identifier                        |
| `street1`     | `String!`  | Street address line 1                    |
| `street2`     | `String`   | Street address line 2 (apt, suite, etc.) |
| `city`        | `String!`  | City name                                |
| `state`       | `String!`  | State or province                        |
| `postalCode`  | `String!`  | Postal/ZIP code                          |
| `countryCode` | `String!`  | Country code (ISO 3166-1 alpha-2)        |
| `isDefault`   | `Boolean!` | Whether this is the default address      |

**AddressBook fields:**

| Field             | Type                                       | Description                       |
| ----------------- | ------------------------------------------ | --------------------------------- |
| `addresses`       | `[LabeledAddress!]!` _(max depth reached)_ | All addresses in the address book |
| `defaultShipping` | `LabeledAddress` _(max depth reached)_     | Default shipping address          |
| `defaultBilling`  | `LabeledAddress` _(max depth reached)_     | Default billing address           |

**OrderConnection fields:**

| Field      | Type                                  | Description     |
| ---------- | ------------------------------------- | --------------- |
| `edges`    | `[OrderEdge!]!` _(max depth reached)_ | The orders      |
| `pageInfo` | `PageInfo!` _(max depth reached)_     | Pagination info |

**ReviewConnection fields:**

| Field      | Type                                   | Description     |
| ---------- | -------------------------------------- | --------------- |
| `edges`    | `[ReviewEdge!]!` _(max depth reached)_ | The reviews     |
| `pageInfo` | `PageInfo!` _(max depth reached)_      | Pagination info |

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
| `seller`                                                                       | `User!`                                          | Seller who listed this product _(see User above)_                  |
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

**Cart fields:**

| Field            | Type                                 | Description                |
| ---------------- | ------------------------------------ | -------------------------- |
| `id`             | `UUID!`                              | Unique identifier          |
| `items`          | `[CartItem!]!` _(max depth reached)_ | Cart items                 |
| `itemCount`      | `Int!`                               | Number of items in cart    |
| `subtotal`       | `Money!`                             | Cart subtotal              |
| `estimatedTax`   | `Money`                              | Estimated tax              |
| `estimatedTotal` | `Money!`                             | Estimated total            |
| `appliedCoupons` | `[Coupon!]!` _(max depth reached)_   | Applied coupon codes       |
| `updatedAt`      | `DateTime!`                          | When cart was last updated |

**OrderStatus values:**

| OrderStatus Value | Description                                 |
| ----------------- | ------------------------------------------- |
| `PENDING`         | Order has been placed but not yet processed |
| `CONFIRMED`       | Payment has been confirmed                  |
| `PROCESSING`      | Order is being prepared for shipment        |
| `SHIPPED`         | Order has been shipped                      |
| `DELIVERED`       | Order has been delivered                    |
| `CANCELLED`       | Order has been cancelled                    |
| `REFUNDED`        | Order has been refunded                     |

**OrderItem fields:**

| Field            | Type                        | Description                        |
| ---------------- | --------------------------- | ---------------------------------- |
| `id`             | `UUID!`                     | Unique identifier                  |
| `product`        | `Product!`                  | The product ordered                |
| `variant`        | `ProductVariant`            | The specific variant ordered       |
| `quantity`       | `Int!`                      | Quantity ordered                   |
| `unitPrice`      | `Money!`                    | Price per unit at time of order    |
| `totalPrice`     | `Money!`                    | Total price for this line item     |
| `customizations` | `[OrderItemCustomization!]` | Any customization options selected |

**ProductVariant fields:**

| Field         | Type                                      | Description                                                       |
| ------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| `id`          | `UUID!`                                   | Unique identifier                                                 |
| `sku`         | `String!`                                 | SKU (Stock Keeping Unit)                                          |
| `name`        | `String!`                                 | Variant name (e.g., "Large / Blue")                               |
| `price`       | `Money`                                   | Variant-specific price (if different from base)                   |
| `options`     | `[VariantOption!]!` _(max depth reached)_ | Variant options (size, color, etc.)                               |
| `inventory`   | `InventoryInfo!` _(max depth reached)_    | Inventory information - contains warehouse details (deep nesting) |
| `weightGrams` | `Int`                                     | Weight in grams (for shipping calculation)                        |
| `isAvailable` | `Boolean!`                                | Whether this variant is available for purchase                    |

**OrderItemCustomization fields:**

| Field            | Type      | Description                            |
| ---------------- | --------- | -------------------------------------- |
| `name`           | `String!` | Customization name                     |
| `value`          | `String!` | Customization value                    |
| `additionalCost` | `Money`   | Additional cost for this customization |

**Currency values:**

| Currency Value | Description            |
| -------------- | ---------------------- |
| `USD`          | United States Dollar   |
| `EUR`          | Euro                   |
| `GBP`          | British Pound Sterling |
| `JPY`          | Japanese Yen           |

**PaymentInfo fields:**

| Field           | Type             | Description                           |
| --------------- | ---------------- | ------------------------------------- |
| `method`        | `PaymentMethod!` | Payment method used                   |
| `status`        | `String!`        | Payment status                        |
| `transactionId` | `String`         | Transaction ID from payment processor |
| `cardLast4`     | `String`         | Last 4 digits of card (if applicable) |
| `cardBrand`     | `String`         | Card brand (if applicable)            |
| `processedAt`   | `DateTime`       | When payment was processed            |

**PaymentMethod values:**

| PaymentMethod Value | Description                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| `CARD`              | Credit or debit card payment                                                                              |
| `PAYPAL`            | PayPal payment                                                                                            |
| `BANK_TRANSFER`     | Bank transfer                                                                                             |
| `CRYPTO`            | Cryptocurrency payment (deprecated: Crypto payments will be removed in v2.0. Use CARD or PAYPAL instead.) |

**ShippingInfo fields:**

| Field               | Type              | Description              |
| ------------------- | ----------------- | ------------------------ |
| `method`            | `ShippingMethod!` | Shipping method selected |
| `carrier`           | `String`          | Carrier name             |
| `trackingNumber`    | `String`          | Tracking number          |
| `trackingUrl`       | `String`          | Tracking URL             |
| `estimatedDelivery` | `DateTime`        | Estimated delivery date  |
| `deliveredAt`       | `DateTime`        | Actual delivery date     |

**ShippingMethod fields:**

| Field              | Type       | Description                             |
| ------------------ | ---------- | --------------------------------------- |
| `id`               | `UUID!`    | Unique identifier                       |
| `name`             | `String!`  | Method name (e.g., "Standard Shipping") |
| `description`      | `String`   | Method description                      |
| `baseCost`         | `Money!`   | Base cost                               |
| `estimatedDaysMin` | `Int!`     | Estimated delivery days (min)           |
| `estimatedDaysMax` | `Int!`     | Estimated delivery days (max)           |
| `isAvailable`      | `Boolean!` | Whether this method is available        |

**Coupon fields:**

| Field           | Type       | Description                           |
| --------------- | ---------- | ------------------------------------- |
| `code`          | `String!`  | Coupon code                           |
| `description`   | `String!`  | Discount description                  |
| `discountValue` | `String!`  | Discount amount or percentage         |
| `isPercentage`  | `Boolean!` | Whether this is a percentage discount |

**OrderEvent fields:**

| Field         | Type        | Description                                  |
| ------------- | ----------- | -------------------------------------------- |
| `type`        | `String!`   | Event type                                   |
| `description` | `String!`   | Event description                            |
| `occurredAt`  | `DateTime!` | When the event occurred                      |
| `actor`       | `User`      | User who triggered the event (if applicable) |

**Example: Order Status Update**

Subscribe to status updates for a specific order. Receives events when order status changes (e.g., pending -> processing -> shipped -> delivered).

```graphql
subscription OnOrderStatusChanged($orderId: UUID!) {
  orderStatusChanged(orderId: $orderId) {
    id
    orderNumber
    status
    previousStatus
    updatedAt
    trackingInfo {
      carrier
      trackingNumber
      trackingUrl
    }
  }
}
```

```json
{
  "data": {
    "orderStatusChanged": {
      "id": "ord_789",
      "orderNumber": "ORD-2024-001",
      "status": "SHIPPED",
      "previousStatus": "PROCESSING",
      "updatedAt": "2024-01-16T14:30:00Z",
      "trackingInfo": {
        "carrier": "FedEx",
        "trackingNumber": "1234567890",
        "trackingUrl": "https://fedex.com/track/1234567890"
      }
    }
  }
}
```

**Example: Order Delivered**

Notification when order has been delivered

```graphql
subscription OnOrderStatusChanged($orderId: UUID!) {
  orderStatusChanged(orderId: $orderId) {
    id
    status
    deliveredAt
    deliveryProof {
      signedBy
      photoUrl
    }
  }
}
```

```json
{
  "data": {
    "orderStatusChanged": {
      "id": "ord_789",
      "status": "DELIVERED",
      "deliveredAt": "2024-01-18T10:15:00Z",
      "deliveryProof": {
        "signedBy": "J. Smith",
        "photoUrl": "https://delivery.example.com/proof/ord_789.jpg"
      }
    }
  }
}
```

**Example: Order Not Found**

Subscription fails if the order doesn't exist or user doesn't have access

```graphql
subscription OnOrderStatusChanged($orderId: UUID!) {
  orderStatusChanged(orderId: $orderId) {
    id
    status
  }
}
```

```json
{
  "data": null,
  "errors": [
    {
      "message": "Order not found or access denied",
      "extensions": {
        "code": "NOT_FOUND"
      },
      "path": ["orderStatusChanged"]
    }
  ]
}
```

## Types Reference

### Cart

| Field            | Type           | Description                |
| ---------------- | -------------- | -------------------------- |
| `id`             | `UUID!`        | Unique identifier          |
| `items`          | `[CartItem!]!` | Cart items                 |
| `itemCount`      | `Int!`         | Number of items in cart    |
| `subtotal`       | `Money!`       | Cart subtotal              |
| `estimatedTax`   | `Money`        | Estimated tax              |
| `estimatedTotal` | `Money!`       | Estimated total            |
| `appliedCoupons` | `[Coupon!]!`   | Applied coupon codes       |
| `updatedAt`      | `DateTime!`    | When cart was last updated |

**CartItem fields:**

| Field        | Type             | Description               |
| ------------ | ---------------- | ------------------------- |
| `id`         | `UUID!`          | Unique identifier         |
| `product`    | `Product!`       | —                         |
| `variant`    | `ProductVariant` | The specific variant      |
| `quantity`   | `Int!`           | Quantity in cart          |
| `unitPrice`  | `Money!`         | Unit price                |
| `totalPrice` | `Money!`         | Total price for this item |

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

**ProductVariant fields:**

| Field         | Type                                      | Description                                                       |
| ------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| `id`          | `UUID!`                                   | Unique identifier                                                 |
| `sku`         | `String!`                                 | SKU (Stock Keeping Unit)                                          |
| `name`        | `String!`                                 | Variant name (e.g., "Large / Blue")                               |
| `price`       | `Money`                                   | Variant-specific price (if different from base)                   |
| `options`     | `[VariantOption!]!` _(max depth reached)_ | Variant options (size, color, etc.)                               |
| `inventory`   | `InventoryInfo!` _(max depth reached)_    | Inventory information - contains warehouse details (deep nesting) |
| `weightGrams` | `Int`                                     | Weight in grams (for shipping calculation)                        |
| `isAvailable` | `Boolean!`                                | Whether this variant is available for purchase                    |

**Coupon fields:**

| Field           | Type       | Description                           |
| --------------- | ---------- | ------------------------------------- |
| `code`          | `String!`  | Coupon code                           |
| `description`   | `String!`  | Discount description                  |
| `discountValue` | `String!`  | Discount amount or percentage         |
| `isPercentage`  | `Boolean!` | Whether this is a percentage discount |

### Order

| Field             | Type             | Description                                        |
| ----------------- | ---------------- | -------------------------------------------------- |
| `id`              | `UUID!`          | Unique identifier                                  |
| `orderNumber`     | `String!`        | Human-readable order number                        |
| `customer`        | `User!`          | Customer who placed the order (circular reference) |
| `status`          | `OrderStatus!`   | Current order status                               |
| `items`           | `[OrderItem!]!`  | Order line items                                   |
| `subtotal`        | `Money!`         | Subtotal before tax and shipping                   |
| `taxAmount`       | `Money!`         | Tax amount                                         |
| `shippingAmount`  | `Money!`         | Shipping cost                                      |
| `discountAmount`  | `Money!`         | Discount amount                                    |
| `total`           | `Money!`         | Total order amount                                 |
| `currency`        | `Currency!`      | Currency used for this order                       |
| `shippingAddress` | `Address!`       | Shipping address                                   |
| `billingAddress`  | `Address!`       | Billing address                                    |
| `payment`         | `PaymentInfo!`   | Payment information                                |
| `shipping`        | `ShippingInfo`   | Shipping information                               |
| `appliedCoupons`  | `[Coupon!]!`     | Applied coupon codes                               |
| `customerNotes`   | `String`         | Order notes from customer                          |
| `internalNotes`   | `String`         | Internal notes (admin only)                        |
| `timeline`        | `[OrderEvent!]!` | Order history/timeline                             |
| `createdAt`       | `DateTime!`      | When created                                       |
| `updatedAt`       | `DateTime!`      | When last updated                                  |

**User fields:**

| Field                                                                                                                                     | Type                | Description                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------- |
| `id`                                                                                                                                      | `UUID!`             | Unique identifier for the user                                               |
| `email`                                                                                                                                   | `String!`           | User's email address (unique)                                                |
| `displayName`                                                                                                                             | `String!`           | User's display name                                                          |
| `avatarUrl`                                                                                                                               | `String`            | URL to user's avatar image                                                   |
| `status`                                                                                                                                  | `UserStatus!`       | User's account status                                                        |
| `role`                                                                                                                                    | `UserRole!`         | User's role and permissions                                                  |
| `profile`                                                                                                                                 | `UserProfile`       | User's profile information                                                   |
| `addresses`                                                                                                                               | `[Address!]!`       | User's shipping addresses                                                    |
| @deprecated Use `addressBook` instead for better address management (deprecated: Use `addressBook` instead for better address management) |
| `addressBook`                                                                                                                             | `AddressBook!`      | User's address book with labeled addresses                                   |
| `orders`                                                                                                                                  | `OrderConnection!`  | Orders placed by this user (creates circular reference with Order.customer)  |
| `reviews`                                                                                                                                 | `ReviewConnection!` | Reviews written by this user (creates circular reference with Review.author) |
| `wishlist`                                                                                                                                | `[Product!]!`       | Products in user's wishlist                                                  |
| `cart`                                                                                                                                    | `Cart`              | User's shopping cart                                                         |
| `totalSpent`                                                                                                                              | `Money!`            | Total amount spent by this user                                              |
| `orderCount`                                                                                                                              | `Int!`              | Number of orders placed                                                      |
| `createdAt`                                                                                                                               | `DateTime!`         | When the user was created                                                    |
| `updatedAt`                                                                                                                               | `DateTime!`         | When the user was last updated                                               |
| `deletedAt`                                                                                                                               | `DateTime`          | When the user was deleted (soft delete)                                      |
| `isDeleted`                                                                                                                               | `Boolean!`          | Whether the user account is deleted                                          |

**UserStatus values:**

| UserStatus Value       | Description                                 |
| ---------------------- | ------------------------------------------- |
| `ACTIVE`               | User account is active and in good standing |
| `SUSPENDED`            | User account is temporarily suspended       |
| `BANNED`               | User account has been permanently banned    |
| `PENDING_VERIFICATION` | User account is pending email verification  |

**UserRole values:**

| UserRole Value | Description                                   |
| -------------- | --------------------------------------------- |
| `CUSTOMER`     | Regular customer with standard permissions    |
| `SELLER`       | Seller with ability to list products          |
| `ADMIN`        | Administrator with full system access         |
| `SUPPORT`      | Support staff with limited admin capabilities |

**UserProfile fields:**

| Field               | Type                             | Description                                  |
| ------------------- | -------------------------------- | -------------------------------------------- |
| `firstName`         | `String`                         | User's first name                            |
| `lastName`          | `String`                         | User's last name                             |
| `phoneNumber`       | `String`                         | User's phone number                          |
| `dateOfBirth`       | `DateTime`                       | User's date of birth                         |
| `bio`               | `String`                         | User's bio or description                    |
| `preferredLanguage` | `String`                         | User's preferred language (ISO 639-1 code)   |
| `preferredCurrency` | `Currency` _(max depth reached)_ | User's preferred currency                    |
| `marketingOptIn`    | `Boolean!`                       | Whether user has opted into marketing emails |

**Address fields:**

| Field         | Type       | Description                              |
| ------------- | ---------- | ---------------------------------------- |
| `id`          | `UUID!`    | Unique identifier                        |
| `street1`     | `String!`  | Street address line 1                    |
| `street2`     | `String`   | Street address line 2 (apt, suite, etc.) |
| `city`        | `String!`  | City name                                |
| `state`       | `String!`  | State or province                        |
| `postalCode`  | `String!`  | Postal/ZIP code                          |
| `countryCode` | `String!`  | Country code (ISO 3166-1 alpha-2)        |
| `isDefault`   | `Boolean!` | Whether this is the default address      |

**AddressBook fields:**

| Field             | Type                                       | Description                       |
| ----------------- | ------------------------------------------ | --------------------------------- |
| `addresses`       | `[LabeledAddress!]!` _(max depth reached)_ | All addresses in the address book |
| `defaultShipping` | `LabeledAddress` _(max depth reached)_     | Default shipping address          |
| `defaultBilling`  | `LabeledAddress` _(max depth reached)_     | Default billing address           |

**OrderConnection fields:**

| Field      | Type                                  | Description     |
| ---------- | ------------------------------------- | --------------- |
| `edges`    | `[OrderEdge!]!` _(max depth reached)_ | The orders      |
| `pageInfo` | `PageInfo!` _(max depth reached)_     | Pagination info |

**ReviewConnection fields:**

| Field      | Type                                   | Description     |
| ---------- | -------------------------------------- | --------------- |
| `edges`    | `[ReviewEdge!]!` _(max depth reached)_ | The reviews     |
| `pageInfo` | `PageInfo!` _(max depth reached)_      | Pagination info |

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
| `seller`                                                                       | `User!`                                          | Seller who listed this product _(see User above)_                  |
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

**Cart fields:**

| Field            | Type                                 | Description                |
| ---------------- | ------------------------------------ | -------------------------- |
| `id`             | `UUID!`                              | Unique identifier          |
| `items`          | `[CartItem!]!` _(max depth reached)_ | Cart items                 |
| `itemCount`      | `Int!`                               | Number of items in cart    |
| `subtotal`       | `Money!`                             | Cart subtotal              |
| `estimatedTax`   | `Money`                              | Estimated tax              |
| `estimatedTotal` | `Money!`                             | Estimated total            |
| `appliedCoupons` | `[Coupon!]!` _(max depth reached)_   | Applied coupon codes       |
| `updatedAt`      | `DateTime!`                          | When cart was last updated |

**OrderStatus values:**

| OrderStatus Value | Description                                 |
| ----------------- | ------------------------------------------- |
| `PENDING`         | Order has been placed but not yet processed |
| `CONFIRMED`       | Payment has been confirmed                  |
| `PROCESSING`      | Order is being prepared for shipment        |
| `SHIPPED`         | Order has been shipped                      |
| `DELIVERED`       | Order has been delivered                    |
| `CANCELLED`       | Order has been cancelled                    |
| `REFUNDED`        | Order has been refunded                     |

**OrderItem fields:**

| Field            | Type                        | Description                        |
| ---------------- | --------------------------- | ---------------------------------- |
| `id`             | `UUID!`                     | Unique identifier                  |
| `product`        | `Product!`                  | The product ordered                |
| `variant`        | `ProductVariant`            | The specific variant ordered       |
| `quantity`       | `Int!`                      | Quantity ordered                   |
| `unitPrice`      | `Money!`                    | Price per unit at time of order    |
| `totalPrice`     | `Money!`                    | Total price for this line item     |
| `customizations` | `[OrderItemCustomization!]` | Any customization options selected |

**ProductVariant fields:**

| Field         | Type                                      | Description                                                       |
| ------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| `id`          | `UUID!`                                   | Unique identifier                                                 |
| `sku`         | `String!`                                 | SKU (Stock Keeping Unit)                                          |
| `name`        | `String!`                                 | Variant name (e.g., "Large / Blue")                               |
| `price`       | `Money`                                   | Variant-specific price (if different from base)                   |
| `options`     | `[VariantOption!]!` _(max depth reached)_ | Variant options (size, color, etc.)                               |
| `inventory`   | `InventoryInfo!` _(max depth reached)_    | Inventory information - contains warehouse details (deep nesting) |
| `weightGrams` | `Int`                                     | Weight in grams (for shipping calculation)                        |
| `isAvailable` | `Boolean!`                                | Whether this variant is available for purchase                    |

**OrderItemCustomization fields:**

| Field            | Type      | Description                            |
| ---------------- | --------- | -------------------------------------- |
| `name`           | `String!` | Customization name                     |
| `value`          | `String!` | Customization value                    |
| `additionalCost` | `Money`   | Additional cost for this customization |

**Currency values:**

| Currency Value | Description            |
| -------------- | ---------------------- |
| `USD`          | United States Dollar   |
| `EUR`          | Euro                   |
| `GBP`          | British Pound Sterling |
| `JPY`          | Japanese Yen           |

**PaymentInfo fields:**

| Field           | Type             | Description                           |
| --------------- | ---------------- | ------------------------------------- |
| `method`        | `PaymentMethod!` | Payment method used                   |
| `status`        | `String!`        | Payment status                        |
| `transactionId` | `String`         | Transaction ID from payment processor |
| `cardLast4`     | `String`         | Last 4 digits of card (if applicable) |
| `cardBrand`     | `String`         | Card brand (if applicable)            |
| `processedAt`   | `DateTime`       | When payment was processed            |

**PaymentMethod values:**

| PaymentMethod Value | Description                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| `CARD`              | Credit or debit card payment                                                                              |
| `PAYPAL`            | PayPal payment                                                                                            |
| `BANK_TRANSFER`     | Bank transfer                                                                                             |
| `CRYPTO`            | Cryptocurrency payment (deprecated: Crypto payments will be removed in v2.0. Use CARD or PAYPAL instead.) |

**ShippingInfo fields:**

| Field               | Type              | Description              |
| ------------------- | ----------------- | ------------------------ |
| `method`            | `ShippingMethod!` | Shipping method selected |
| `carrier`           | `String`          | Carrier name             |
| `trackingNumber`    | `String`          | Tracking number          |
| `trackingUrl`       | `String`          | Tracking URL             |
| `estimatedDelivery` | `DateTime`        | Estimated delivery date  |
| `deliveredAt`       | `DateTime`        | Actual delivery date     |

**ShippingMethod fields:**

| Field              | Type       | Description                             |
| ------------------ | ---------- | --------------------------------------- |
| `id`               | `UUID!`    | Unique identifier                       |
| `name`             | `String!`  | Method name (e.g., "Standard Shipping") |
| `description`      | `String`   | Method description                      |
| `baseCost`         | `Money!`   | Base cost                               |
| `estimatedDaysMin` | `Int!`     | Estimated delivery days (min)           |
| `estimatedDaysMax` | `Int!`     | Estimated delivery days (max)           |
| `isAvailable`      | `Boolean!` | Whether this method is available        |

**Coupon fields:**

| Field           | Type       | Description                           |
| --------------- | ---------- | ------------------------------------- |
| `code`          | `String!`  | Coupon code                           |
| `description`   | `String!`  | Discount description                  |
| `discountValue` | `String!`  | Discount amount or percentage         |
| `isPercentage`  | `Boolean!` | Whether this is a percentage discount |

**OrderEvent fields:**

| Field         | Type        | Description                                  |
| ------------- | ----------- | -------------------------------------------- |
| `type`        | `String!`   | Event type                                   |
| `description` | `String!`   | Event description                            |
| `occurredAt`  | `DateTime!` | When the event occurred                      |
| `actor`       | `User`      | User who triggered the event (if applicable) |
