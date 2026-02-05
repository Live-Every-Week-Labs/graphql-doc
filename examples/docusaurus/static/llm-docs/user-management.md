# User Management

> Part of [GraphQL API](./index.md) GraphQL API

---

## Queries

### me

Get the currently authenticated user

Returns null if not authenticated.

**Returns:** `User`

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

| Field               | Type       | Description                                  |
| ------------------- | ---------- | -------------------------------------------- |
| `firstName`         | `String`   | User's first name                            |
| `lastName`          | `String`   | User's last name                             |
| `phoneNumber`       | `String`   | User's phone number                          |
| `dateOfBirth`       | `DateTime` | User's date of birth                         |
| `bio`               | `String`   | User's bio or description                    |
| `preferredLanguage` | `String`   | User's preferred language (ISO 639-1 code)   |
| `preferredCurrency` | `Currency` | User's preferred currency                    |
| `marketingOptIn`    | `Boolean!` | Whether user has opted into marketing emails |

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

**AddressBook fields:**

| Field             | Type                 | Description                       |
| ----------------- | -------------------- | --------------------------------- |
| `addresses`       | `[LabeledAddress!]!` | All addresses in the address book |
| `defaultShipping` | `LabeledAddress`     | Default shipping address          |
| `defaultBilling`  | `LabeledAddress`     | Default billing address           |

**LabeledAddress fields:**

| Field               | Type                             | Description                                  |
| ------------------- | -------------------------------- | -------------------------------------------- |
| `address`           | `Address!` _(max depth reached)_ | The address details                          |
| `label`             | `String!`                        | User-defined label (e.g., "Home", "Work")    |
| `isDefaultShipping` | `Boolean!`                       | Whether this is the default shipping address |
| `isDefaultBilling`  | `Boolean!`                       | Whether this is the default billing address  |

**OrderConnection fields:**

| Field      | Type            | Description     |
| ---------- | --------------- | --------------- |
| `edges`    | `[OrderEdge!]!` | The orders      |
| `pageInfo` | `PageInfo!`     | Pagination info |

**OrderEdge fields:**

| Field    | Type                           | Description       |
| -------- | ------------------------------ | ----------------- |
| `node`   | `Order!` _(max depth reached)_ | The order         |
| `cursor` | `String!`                      | Pagination cursor |

**PageInfo fields:**

| Field             | Type       | Description                         |
| ----------------- | ---------- | ----------------------------------- |
| `hasNextPage`     | `Boolean!` | Whether there are more items after  |
| `hasPreviousPage` | `Boolean!` | Whether there are more items before |
| `startCursor`     | `String`   | Cursor of the first item            |
| `endCursor`       | `String`   | Cursor of the last item             |
| `totalCount`      | `Int!`     | Total count of items                |

**ReviewConnection fields:**

| Field      | Type             | Description     |
| ---------- | ---------------- | --------------- |
| `edges`    | `[ReviewEdge!]!` | The reviews     |
| `pageInfo` | `PageInfo!`      | Pagination info |

**ReviewEdge fields:**

| Field    | Type                            | Description       |
| -------- | ------------------------------- | ----------------- |
| `node`   | `Review!` _(max depth reached)_ | The review        |
| `cursor` | `String!`                       | Pagination cursor |

**Product fields:**

| Field                                                                          | Type                       | Description                                                        |
| ------------------------------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------ |
| `id`                                                                           | `UUID!`                    | Unique identifier                                                  |
| `slug`                                                                         | `String!`                  | URL-friendly slug                                                  |
| `name`                                                                         | `String!`                  | Product name                                                       |
| `shortDescription`                                                             | `String!`                  | Short description for listings                                     |
| `description`                                                                  | `String!`                  | Full product description (supports markdown)                       |
| `images`                                                                       | `[ProductImage!]!`         | Product images                                                     |
| `primaryImage`                                                                 | `ProductImage`             | Primary/featured image                                             |
| `price`                                                                        | `Money!`                   | Current price                                                      |
| `compareAtPrice`                                                               | `Money`                    | Original price before discount (if on sale)                        |
| `isOnSale`                                                                     | `Boolean!`                 | Whether product is currently on sale                               |
| `status`                                                                       | `ProductStatus!`           | Product status                                                     |
| `category`                                                                     | `Category!`                | Product category (creates circular reference)                      |
| Category contains a list of products, and each product references its category |
| `additionalCategories`                                                         | `[Category!]!`             | Additional categories this product belongs to                      |
| `tags`                                                                         | `[String!]!`               | Product tags for filtering                                         |
| `variants`                                                                     | `[ProductVariant!]!`       | Product variants (size, color combinations)                        |
| `totalInventory`                                                               | `Int!`                     | Total inventory across all variants                                |
| `isInStock`                                                                    | `Boolean!`                 | Whether any variant is in stock                                    |
| `seller`                                                                       | `User!`                    | Seller who listed this product _(see User above)_                  |
| `reviews`                                                                      | `ReviewConnection!`        | Product reviews (circular: Review references Product)              |
| `averageRating`                                                                | `Float`                    | Average rating (1-5)                                               |
| `reviewCount`                                                                  | `Int!`                     | Total number of reviews                                            |
| `relatedProducts`                                                              | `[Product!]!`              | Related products (for "You might also like") _(see Product above)_ |
| `frequentlyBoughtWith`                                                         | `[Product!]!`              | Products frequently bought together _(see Product above)_          |
| `specifications`                                                               | `[ProductSpecification!]!` | Product specifications/attributes                                  |
| `seo`                                                                          | `SEOMetadata`              | SEO metadata                                                       |
| `createdAt`                                                                    | `DateTime!`                | When created                                                       |
| `updatedAt`                                                                    | `DateTime!`                | When last updated                                                  |
| `deletedAt`                                                                    | `DateTime`                 | When deleted (soft delete)                                         |
| `isDeleted`                                                                    | `Boolean!`                 | Whether deleted                                                    |

**ProductImage fields:**

| Field          | Type      | Description                |
| -------------- | --------- | -------------------------- |
| `id`           | `UUID!`   | Unique identifier          |
| `url`          | `String!` | Original image URL         |
| `thumbnailUrl` | `String!` | Thumbnail URL (100x100)    |
| `mediumUrl`    | `String!` | Medium size URL (400x400)  |
| `largeUrl`     | `String!` | Large size URL (800x800)   |
| `altText`      | `String`  | Alt text for accessibility |
| `sortOrder`    | `Int!`    | Display order              |

**ProductStatus values:**

| ProductStatus Value | Description                              |
| ------------------- | ---------------------------------------- |
| `AVAILABLE`         | Product is available for purchase        |
| `OUT_OF_STOCK`      | Product is temporarily out of stock      |
| `HIDDEN`            | Product listing is hidden from customers |
| `DISCONTINUED`      | Product has been discontinued            |

**Category fields:**

| Field          | Type                                       | Description                                                                             |
| -------------- | ------------------------------------------ | --------------------------------------------------------------------------------------- |
| `id`           | `UUID!`                                    | Unique identifier                                                                       |
| `slug`         | `String!`                                  | URL-friendly slug                                                                       |
| `name`         | `String!`                                  | Category name                                                                           |
| `description`  | `String`                                   | Category description                                                                    |
| `imageUrl`     | `String`                                   | Category image URL                                                                      |
| `parent`       | `Category`                                 | Parent category (for hierarchy) _(see Category above)_                                  |
| `children`     | `[Category!]!`                             | Child categories _(see Category above)_                                                 |
| `breadcrumb`   | `[Category!]!`                             | Full path from root (e.g., "Electronics > Phones > Smartphones") _(see Category above)_ |
| `products`     | `ProductConnection!` _(max depth reached)_ | Products in this category (circular reference with Product.category)                    |
| `productCount` | `Int!`                                     | Total number of products in this category (including subcategories)                     |
| `createdAt`    | `DateTime!`                                | When created                                                                            |
| `updatedAt`    | `DateTime!`                                | When last updated                                                                       |

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

**ProductSpecification fields:**

| Field   | Type      | Description                               |
| ------- | --------- | ----------------------------------------- |
| `name`  | `String!` | Specification name (e.g., "Material")     |
| `value` | `String!` | Specification value (e.g., "100% Cotton") |
| `unit`  | `String`  | Optional unit (e.g., "cm", "kg")          |

**SEOMetadata fields:**

| Field          | Type        | Description          |
| -------------- | ----------- | -------------------- |
| `title`        | `String`    | Meta title           |
| `description`  | `String`    | Meta description     |
| `keywords`     | `[String!]` | Meta keywords        |
| `canonicalUrl` | `String`    | Canonical URL        |
| `ogImage`      | `String`    | Open Graph image URL |

**Cart fields:**

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

| Field        | Type                                   | Description               |
| ------------ | -------------------------------------- | ------------------------- |
| `id`         | `UUID!`                                | Unique identifier         |
| `product`    | `Product!` _(max depth reached)_       | —                         |
| `variant`    | `ProductVariant` _(max depth reached)_ | The specific variant      |
| `quantity`   | `Int!`                                 | Quantity in cart          |
| `unitPrice`  | `Money!`                               | Unit price                |
| `totalPrice` | `Money!`                               | Total price for this item |

**Coupon fields:**

| Field           | Type       | Description                           |
| --------------- | ---------- | ------------------------------------- |
| `code`          | `String!`  | Coupon code                           |
| `description`   | `String!`  | Discount description                  |
| `discountValue` | `String!`  | Discount amount or percentage         |
| `isPercentage`  | `Boolean!` | Whether this is a percentage discount |

**Example: Get Current User**

Retrieve the currently authenticated user's profile information

```graphql
query Me {
  me {
    id
    email
    displayName
    role
    profile {
      firstName
      lastName
      avatarUrl
    }
    createdAt
  }
}
```

```json
{
  "data": {
    "me": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "jane.doe@example.com",
      "displayName": "Jane Doe",
      "role": "CUSTOMER",
      "profile": {
        "firstName": "Jane",
        "lastName": "Doe",
        "avatarUrl": "https://cdn.example.com/avatars/550e8400.jpg"
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Example: Unauthenticated Request**

The `me` query requires authentication. Requests without a valid Bearer token will receive an error.

```graphql
query Me {
  me {
    id
    email
  }
}
```

```json
{
  "data": {
    "me": null
  },
  "errors": [
    {
      "message": "Authentication required",
      "extensions": {
        "code": "UNAUTHENTICATED"
      },
      "path": ["me"]
    }
  ]
}
```

### user

Get a user by their ID

**Arguments:**

| Argument | Type    | Required | Description                  |
| -------- | ------- | -------- | ---------------------------- |
| `id`     | `UUID!` | Yes      | The user's unique identifier |

**Returns:** `User`

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

| Field               | Type       | Description                                  |
| ------------------- | ---------- | -------------------------------------------- |
| `firstName`         | `String`   | User's first name                            |
| `lastName`          | `String`   | User's last name                             |
| `phoneNumber`       | `String`   | User's phone number                          |
| `dateOfBirth`       | `DateTime` | User's date of birth                         |
| `bio`               | `String`   | User's bio or description                    |
| `preferredLanguage` | `String`   | User's preferred language (ISO 639-1 code)   |
| `preferredCurrency` | `Currency` | User's preferred currency                    |
| `marketingOptIn`    | `Boolean!` | Whether user has opted into marketing emails |

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

**AddressBook fields:**

| Field             | Type                 | Description                       |
| ----------------- | -------------------- | --------------------------------- |
| `addresses`       | `[LabeledAddress!]!` | All addresses in the address book |
| `defaultShipping` | `LabeledAddress`     | Default shipping address          |
| `defaultBilling`  | `LabeledAddress`     | Default billing address           |

**LabeledAddress fields:**

| Field               | Type                             | Description                                  |
| ------------------- | -------------------------------- | -------------------------------------------- |
| `address`           | `Address!` _(max depth reached)_ | The address details                          |
| `label`             | `String!`                        | User-defined label (e.g., "Home", "Work")    |
| `isDefaultShipping` | `Boolean!`                       | Whether this is the default shipping address |
| `isDefaultBilling`  | `Boolean!`                       | Whether this is the default billing address  |

**OrderConnection fields:**

| Field      | Type            | Description     |
| ---------- | --------------- | --------------- |
| `edges`    | `[OrderEdge!]!` | The orders      |
| `pageInfo` | `PageInfo!`     | Pagination info |

**OrderEdge fields:**

| Field    | Type                           | Description       |
| -------- | ------------------------------ | ----------------- |
| `node`   | `Order!` _(max depth reached)_ | The order         |
| `cursor` | `String!`                      | Pagination cursor |

**PageInfo fields:**

| Field             | Type       | Description                         |
| ----------------- | ---------- | ----------------------------------- |
| `hasNextPage`     | `Boolean!` | Whether there are more items after  |
| `hasPreviousPage` | `Boolean!` | Whether there are more items before |
| `startCursor`     | `String`   | Cursor of the first item            |
| `endCursor`       | `String`   | Cursor of the last item             |
| `totalCount`      | `Int!`     | Total count of items                |

**ReviewConnection fields:**

| Field      | Type             | Description     |
| ---------- | ---------------- | --------------- |
| `edges`    | `[ReviewEdge!]!` | The reviews     |
| `pageInfo` | `PageInfo!`      | Pagination info |

**ReviewEdge fields:**

| Field    | Type                            | Description       |
| -------- | ------------------------------- | ----------------- |
| `node`   | `Review!` _(max depth reached)_ | The review        |
| `cursor` | `String!`                       | Pagination cursor |

**Product fields:**

| Field                                                                          | Type                       | Description                                                        |
| ------------------------------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------ |
| `id`                                                                           | `UUID!`                    | Unique identifier                                                  |
| `slug`                                                                         | `String!`                  | URL-friendly slug                                                  |
| `name`                                                                         | `String!`                  | Product name                                                       |
| `shortDescription`                                                             | `String!`                  | Short description for listings                                     |
| `description`                                                                  | `String!`                  | Full product description (supports markdown)                       |
| `images`                                                                       | `[ProductImage!]!`         | Product images                                                     |
| `primaryImage`                                                                 | `ProductImage`             | Primary/featured image                                             |
| `price`                                                                        | `Money!`                   | Current price                                                      |
| `compareAtPrice`                                                               | `Money`                    | Original price before discount (if on sale)                        |
| `isOnSale`                                                                     | `Boolean!`                 | Whether product is currently on sale                               |
| `status`                                                                       | `ProductStatus!`           | Product status                                                     |
| `category`                                                                     | `Category!`                | Product category (creates circular reference)                      |
| Category contains a list of products, and each product references its category |
| `additionalCategories`                                                         | `[Category!]!`             | Additional categories this product belongs to                      |
| `tags`                                                                         | `[String!]!`               | Product tags for filtering                                         |
| `variants`                                                                     | `[ProductVariant!]!`       | Product variants (size, color combinations)                        |
| `totalInventory`                                                               | `Int!`                     | Total inventory across all variants                                |
| `isInStock`                                                                    | `Boolean!`                 | Whether any variant is in stock                                    |
| `seller`                                                                       | `User!`                    | Seller who listed this product _(see User above)_                  |
| `reviews`                                                                      | `ReviewConnection!`        | Product reviews (circular: Review references Product)              |
| `averageRating`                                                                | `Float`                    | Average rating (1-5)                                               |
| `reviewCount`                                                                  | `Int!`                     | Total number of reviews                                            |
| `relatedProducts`                                                              | `[Product!]!`              | Related products (for "You might also like") _(see Product above)_ |
| `frequentlyBoughtWith`                                                         | `[Product!]!`              | Products frequently bought together _(see Product above)_          |
| `specifications`                                                               | `[ProductSpecification!]!` | Product specifications/attributes                                  |
| `seo`                                                                          | `SEOMetadata`              | SEO metadata                                                       |
| `createdAt`                                                                    | `DateTime!`                | When created                                                       |
| `updatedAt`                                                                    | `DateTime!`                | When last updated                                                  |
| `deletedAt`                                                                    | `DateTime`                 | When deleted (soft delete)                                         |
| `isDeleted`                                                                    | `Boolean!`                 | Whether deleted                                                    |

**ProductImage fields:**

| Field          | Type      | Description                |
| -------------- | --------- | -------------------------- |
| `id`           | `UUID!`   | Unique identifier          |
| `url`          | `String!` | Original image URL         |
| `thumbnailUrl` | `String!` | Thumbnail URL (100x100)    |
| `mediumUrl`    | `String!` | Medium size URL (400x400)  |
| `largeUrl`     | `String!` | Large size URL (800x800)   |
| `altText`      | `String`  | Alt text for accessibility |
| `sortOrder`    | `Int!`    | Display order              |

**ProductStatus values:**

| ProductStatus Value | Description                              |
| ------------------- | ---------------------------------------- |
| `AVAILABLE`         | Product is available for purchase        |
| `OUT_OF_STOCK`      | Product is temporarily out of stock      |
| `HIDDEN`            | Product listing is hidden from customers |
| `DISCONTINUED`      | Product has been discontinued            |

**Category fields:**

| Field          | Type                                       | Description                                                                             |
| -------------- | ------------------------------------------ | --------------------------------------------------------------------------------------- |
| `id`           | `UUID!`                                    | Unique identifier                                                                       |
| `slug`         | `String!`                                  | URL-friendly slug                                                                       |
| `name`         | `String!`                                  | Category name                                                                           |
| `description`  | `String`                                   | Category description                                                                    |
| `imageUrl`     | `String`                                   | Category image URL                                                                      |
| `parent`       | `Category`                                 | Parent category (for hierarchy) _(see Category above)_                                  |
| `children`     | `[Category!]!`                             | Child categories _(see Category above)_                                                 |
| `breadcrumb`   | `[Category!]!`                             | Full path from root (e.g., "Electronics > Phones > Smartphones") _(see Category above)_ |
| `products`     | `ProductConnection!` _(max depth reached)_ | Products in this category (circular reference with Product.category)                    |
| `productCount` | `Int!`                                     | Total number of products in this category (including subcategories)                     |
| `createdAt`    | `DateTime!`                                | When created                                                                            |
| `updatedAt`    | `DateTime!`                                | When last updated                                                                       |

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

**ProductSpecification fields:**

| Field   | Type      | Description                               |
| ------- | --------- | ----------------------------------------- |
| `name`  | `String!` | Specification name (e.g., "Material")     |
| `value` | `String!` | Specification value (e.g., "100% Cotton") |
| `unit`  | `String`  | Optional unit (e.g., "cm", "kg")          |

**SEOMetadata fields:**

| Field          | Type        | Description          |
| -------------- | ----------- | -------------------- |
| `title`        | `String`    | Meta title           |
| `description`  | `String`    | Meta description     |
| `keywords`     | `[String!]` | Meta keywords        |
| `canonicalUrl` | `String`    | Canonical URL        |
| `ogImage`      | `String`    | Open Graph image URL |

**Cart fields:**

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

| Field        | Type                                   | Description               |
| ------------ | -------------------------------------- | ------------------------- |
| `id`         | `UUID!`                                | Unique identifier         |
| `product`    | `Product!` _(max depth reached)_       | —                         |
| `variant`    | `ProductVariant` _(max depth reached)_ | The specific variant      |
| `quantity`   | `Int!`                                 | Quantity in cart          |
| `unitPrice`  | `Money!`                               | Unit price                |
| `totalPrice` | `Money!`                               | Total price for this item |

**Coupon fields:**

| Field           | Type       | Description                           |
| --------------- | ---------- | ------------------------------------- |
| `code`          | `String!`  | Coupon code                           |
| `description`   | `String!`  | Discount description                  |
| `discountValue` | `String!`  | Discount amount or percentage         |
| `isPercentage`  | `Boolean!` | Whether this is a percentage discount |

**Example: Get User by ID**

Retrieve a specific user's public profile by their ID

```graphql
query GetUser($id: UUID!) {
  user(id: $id) {
    id
    displayName
    profile {
      avatarUrl
      bio
    }
    createdAt
  }
}
```

```json
{
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "displayName": "Jane Doe",
      "profile": {
        "avatarUrl": "https://cdn.example.com/avatars/550e8400.jpg",
        "bio": "Avid reader and tech enthusiast"
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Example: User Not Found**

When a user ID doesn't exist or the account has been deleted, the query returns null with an error.

```graphql
query GetUser($id: UUID!) {
  user(id: $id) {
    id
    displayName
  }
}
```

```json
{
  "data": {
    "user": null
  },
  "errors": [
    {
      "message": "User not found",
      "extensions": {
        "code": "NOT_FOUND",
        "resourceType": "User",
        "resourceId": "00000000-0000-0000-0000-000000000000"
      },
      "path": ["user"]
    }
  ]
}
```

### users

> Deprecated: Use `usersSearch` instead for better filtering options

Search for users (admin only)

**Arguments:**

| Argument | Type         | Required | Default | Description       |
| -------- | ------------ | -------- | ------- | ----------------- |
| `query`  | `String`     | No       | —       | Search query      |
| `role`   | `UserRole`   | No       | —       | Filter by role    |
| `status` | `UserStatus` | No       | —       | Filter by status  |
| `first`  | `Int`        | No       | `20`    | Number of results |
| `after`  | `String`     | No       | —       | Pagination cursor |

**Returns:** `[User!]!`

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

| Field               | Type       | Description                                  |
| ------------------- | ---------- | -------------------------------------------- |
| `firstName`         | `String`   | User's first name                            |
| `lastName`          | `String`   | User's last name                             |
| `phoneNumber`       | `String`   | User's phone number                          |
| `dateOfBirth`       | `DateTime` | User's date of birth                         |
| `bio`               | `String`   | User's bio or description                    |
| `preferredLanguage` | `String`   | User's preferred language (ISO 639-1 code)   |
| `preferredCurrency` | `Currency` | User's preferred currency                    |
| `marketingOptIn`    | `Boolean!` | Whether user has opted into marketing emails |

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

**AddressBook fields:**

| Field             | Type                 | Description                       |
| ----------------- | -------------------- | --------------------------------- |
| `addresses`       | `[LabeledAddress!]!` | All addresses in the address book |
| `defaultShipping` | `LabeledAddress`     | Default shipping address          |
| `defaultBilling`  | `LabeledAddress`     | Default billing address           |

**LabeledAddress fields:**

| Field               | Type                             | Description                                  |
| ------------------- | -------------------------------- | -------------------------------------------- |
| `address`           | `Address!` _(max depth reached)_ | The address details                          |
| `label`             | `String!`                        | User-defined label (e.g., "Home", "Work")    |
| `isDefaultShipping` | `Boolean!`                       | Whether this is the default shipping address |
| `isDefaultBilling`  | `Boolean!`                       | Whether this is the default billing address  |

**OrderConnection fields:**

| Field      | Type            | Description     |
| ---------- | --------------- | --------------- |
| `edges`    | `[OrderEdge!]!` | The orders      |
| `pageInfo` | `PageInfo!`     | Pagination info |

**OrderEdge fields:**

| Field    | Type                           | Description       |
| -------- | ------------------------------ | ----------------- |
| `node`   | `Order!` _(max depth reached)_ | The order         |
| `cursor` | `String!`                      | Pagination cursor |

**PageInfo fields:**

| Field             | Type       | Description                         |
| ----------------- | ---------- | ----------------------------------- |
| `hasNextPage`     | `Boolean!` | Whether there are more items after  |
| `hasPreviousPage` | `Boolean!` | Whether there are more items before |
| `startCursor`     | `String`   | Cursor of the first item            |
| `endCursor`       | `String`   | Cursor of the last item             |
| `totalCount`      | `Int!`     | Total count of items                |

**ReviewConnection fields:**

| Field      | Type             | Description     |
| ---------- | ---------------- | --------------- |
| `edges`    | `[ReviewEdge!]!` | The reviews     |
| `pageInfo` | `PageInfo!`      | Pagination info |

**ReviewEdge fields:**

| Field    | Type                            | Description       |
| -------- | ------------------------------- | ----------------- |
| `node`   | `Review!` _(max depth reached)_ | The review        |
| `cursor` | `String!`                       | Pagination cursor |

**Product fields:**

| Field                                                                          | Type                       | Description                                                        |
| ------------------------------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------ |
| `id`                                                                           | `UUID!`                    | Unique identifier                                                  |
| `slug`                                                                         | `String!`                  | URL-friendly slug                                                  |
| `name`                                                                         | `String!`                  | Product name                                                       |
| `shortDescription`                                                             | `String!`                  | Short description for listings                                     |
| `description`                                                                  | `String!`                  | Full product description (supports markdown)                       |
| `images`                                                                       | `[ProductImage!]!`         | Product images                                                     |
| `primaryImage`                                                                 | `ProductImage`             | Primary/featured image                                             |
| `price`                                                                        | `Money!`                   | Current price                                                      |
| `compareAtPrice`                                                               | `Money`                    | Original price before discount (if on sale)                        |
| `isOnSale`                                                                     | `Boolean!`                 | Whether product is currently on sale                               |
| `status`                                                                       | `ProductStatus!`           | Product status                                                     |
| `category`                                                                     | `Category!`                | Product category (creates circular reference)                      |
| Category contains a list of products, and each product references its category |
| `additionalCategories`                                                         | `[Category!]!`             | Additional categories this product belongs to                      |
| `tags`                                                                         | `[String!]!`               | Product tags for filtering                                         |
| `variants`                                                                     | `[ProductVariant!]!`       | Product variants (size, color combinations)                        |
| `totalInventory`                                                               | `Int!`                     | Total inventory across all variants                                |
| `isInStock`                                                                    | `Boolean!`                 | Whether any variant is in stock                                    |
| `seller`                                                                       | `User!`                    | Seller who listed this product _(see User above)_                  |
| `reviews`                                                                      | `ReviewConnection!`        | Product reviews (circular: Review references Product)              |
| `averageRating`                                                                | `Float`                    | Average rating (1-5)                                               |
| `reviewCount`                                                                  | `Int!`                     | Total number of reviews                                            |
| `relatedProducts`                                                              | `[Product!]!`              | Related products (for "You might also like") _(see Product above)_ |
| `frequentlyBoughtWith`                                                         | `[Product!]!`              | Products frequently bought together _(see Product above)_          |
| `specifications`                                                               | `[ProductSpecification!]!` | Product specifications/attributes                                  |
| `seo`                                                                          | `SEOMetadata`              | SEO metadata                                                       |
| `createdAt`                                                                    | `DateTime!`                | When created                                                       |
| `updatedAt`                                                                    | `DateTime!`                | When last updated                                                  |
| `deletedAt`                                                                    | `DateTime`                 | When deleted (soft delete)                                         |
| `isDeleted`                                                                    | `Boolean!`                 | Whether deleted                                                    |

**ProductImage fields:**

| Field          | Type      | Description                |
| -------------- | --------- | -------------------------- |
| `id`           | `UUID!`   | Unique identifier          |
| `url`          | `String!` | Original image URL         |
| `thumbnailUrl` | `String!` | Thumbnail URL (100x100)    |
| `mediumUrl`    | `String!` | Medium size URL (400x400)  |
| `largeUrl`     | `String!` | Large size URL (800x800)   |
| `altText`      | `String`  | Alt text for accessibility |
| `sortOrder`    | `Int!`    | Display order              |

**ProductStatus values:**

| ProductStatus Value | Description                              |
| ------------------- | ---------------------------------------- |
| `AVAILABLE`         | Product is available for purchase        |
| `OUT_OF_STOCK`      | Product is temporarily out of stock      |
| `HIDDEN`            | Product listing is hidden from customers |
| `DISCONTINUED`      | Product has been discontinued            |

**Category fields:**

| Field          | Type                                       | Description                                                                             |
| -------------- | ------------------------------------------ | --------------------------------------------------------------------------------------- |
| `id`           | `UUID!`                                    | Unique identifier                                                                       |
| `slug`         | `String!`                                  | URL-friendly slug                                                                       |
| `name`         | `String!`                                  | Category name                                                                           |
| `description`  | `String`                                   | Category description                                                                    |
| `imageUrl`     | `String`                                   | Category image URL                                                                      |
| `parent`       | `Category`                                 | Parent category (for hierarchy) _(see Category above)_                                  |
| `children`     | `[Category!]!`                             | Child categories _(see Category above)_                                                 |
| `breadcrumb`   | `[Category!]!`                             | Full path from root (e.g., "Electronics > Phones > Smartphones") _(see Category above)_ |
| `products`     | `ProductConnection!` _(max depth reached)_ | Products in this category (circular reference with Product.category)                    |
| `productCount` | `Int!`                                     | Total number of products in this category (including subcategories)                     |
| `createdAt`    | `DateTime!`                                | When created                                                                            |
| `updatedAt`    | `DateTime!`                                | When last updated                                                                       |

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

**ProductSpecification fields:**

| Field   | Type      | Description                               |
| ------- | --------- | ----------------------------------------- |
| `name`  | `String!` | Specification name (e.g., "Material")     |
| `value` | `String!` | Specification value (e.g., "100% Cotton") |
| `unit`  | `String`  | Optional unit (e.g., "cm", "kg")          |

**SEOMetadata fields:**

| Field          | Type        | Description          |
| -------------- | ----------- | -------------------- |
| `title`        | `String`    | Meta title           |
| `description`  | `String`    | Meta description     |
| `keywords`     | `[String!]` | Meta keywords        |
| `canonicalUrl` | `String`    | Canonical URL        |
| `ogImage`      | `String`    | Open Graph image URL |

**Cart fields:**

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

| Field        | Type                                   | Description               |
| ------------ | -------------------------------------- | ------------------------- |
| `id`         | `UUID!`                                | Unique identifier         |
| `product`    | `Product!` _(max depth reached)_       | —                         |
| `variant`    | `ProductVariant` _(max depth reached)_ | The specific variant      |
| `quantity`   | `Int!`                                 | Quantity in cart          |
| `unitPrice`  | `Money!`                               | Unit price                |
| `totalPrice` | `Money!`                               | Total price for this item |

**Coupon fields:**

| Field           | Type       | Description                           |
| --------------- | ---------- | ------------------------------------- |
| `code`          | `String!`  | Coupon code                           |
| `description`   | `String!`  | Discount description                  |
| `discountValue` | `String!`  | Discount amount or percentage         |
| `isPercentage`  | `Boolean!` | Whether this is a percentage discount |

## Mutations

### createUser

Register a new user account

**Arguments:**

| Argument | Type               | Required | Description            |
| -------- | ------------------ | -------- | ---------------------- |
| `input`  | `CreateUserInput!` | Yes      | User registration data |

**Returns:** `User!`

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

| Field               | Type       | Description                                  |
| ------------------- | ---------- | -------------------------------------------- |
| `firstName`         | `String`   | User's first name                            |
| `lastName`          | `String`   | User's last name                             |
| `phoneNumber`       | `String`   | User's phone number                          |
| `dateOfBirth`       | `DateTime` | User's date of birth                         |
| `bio`               | `String`   | User's bio or description                    |
| `preferredLanguage` | `String`   | User's preferred language (ISO 639-1 code)   |
| `preferredCurrency` | `Currency` | User's preferred currency                    |
| `marketingOptIn`    | `Boolean!` | Whether user has opted into marketing emails |

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

**AddressBook fields:**

| Field             | Type                 | Description                       |
| ----------------- | -------------------- | --------------------------------- |
| `addresses`       | `[LabeledAddress!]!` | All addresses in the address book |
| `defaultShipping` | `LabeledAddress`     | Default shipping address          |
| `defaultBilling`  | `LabeledAddress`     | Default billing address           |

**LabeledAddress fields:**

| Field               | Type                             | Description                                  |
| ------------------- | -------------------------------- | -------------------------------------------- |
| `address`           | `Address!` _(max depth reached)_ | The address details                          |
| `label`             | `String!`                        | User-defined label (e.g., "Home", "Work")    |
| `isDefaultShipping` | `Boolean!`                       | Whether this is the default shipping address |
| `isDefaultBilling`  | `Boolean!`                       | Whether this is the default billing address  |

**OrderConnection fields:**

| Field      | Type            | Description     |
| ---------- | --------------- | --------------- |
| `edges`    | `[OrderEdge!]!` | The orders      |
| `pageInfo` | `PageInfo!`     | Pagination info |

**OrderEdge fields:**

| Field    | Type                           | Description       |
| -------- | ------------------------------ | ----------------- |
| `node`   | `Order!` _(max depth reached)_ | The order         |
| `cursor` | `String!`                      | Pagination cursor |

**PageInfo fields:**

| Field             | Type       | Description                         |
| ----------------- | ---------- | ----------------------------------- |
| `hasNextPage`     | `Boolean!` | Whether there are more items after  |
| `hasPreviousPage` | `Boolean!` | Whether there are more items before |
| `startCursor`     | `String`   | Cursor of the first item            |
| `endCursor`       | `String`   | Cursor of the last item             |
| `totalCount`      | `Int!`     | Total count of items                |

**ReviewConnection fields:**

| Field      | Type             | Description     |
| ---------- | ---------------- | --------------- |
| `edges`    | `[ReviewEdge!]!` | The reviews     |
| `pageInfo` | `PageInfo!`      | Pagination info |

**ReviewEdge fields:**

| Field    | Type                            | Description       |
| -------- | ------------------------------- | ----------------- |
| `node`   | `Review!` _(max depth reached)_ | The review        |
| `cursor` | `String!`                       | Pagination cursor |

**Product fields:**

| Field                                                                          | Type                       | Description                                                        |
| ------------------------------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------ |
| `id`                                                                           | `UUID!`                    | Unique identifier                                                  |
| `slug`                                                                         | `String!`                  | URL-friendly slug                                                  |
| `name`                                                                         | `String!`                  | Product name                                                       |
| `shortDescription`                                                             | `String!`                  | Short description for listings                                     |
| `description`                                                                  | `String!`                  | Full product description (supports markdown)                       |
| `images`                                                                       | `[ProductImage!]!`         | Product images                                                     |
| `primaryImage`                                                                 | `ProductImage`             | Primary/featured image                                             |
| `price`                                                                        | `Money!`                   | Current price                                                      |
| `compareAtPrice`                                                               | `Money`                    | Original price before discount (if on sale)                        |
| `isOnSale`                                                                     | `Boolean!`                 | Whether product is currently on sale                               |
| `status`                                                                       | `ProductStatus!`           | Product status                                                     |
| `category`                                                                     | `Category!`                | Product category (creates circular reference)                      |
| Category contains a list of products, and each product references its category |
| `additionalCategories`                                                         | `[Category!]!`             | Additional categories this product belongs to                      |
| `tags`                                                                         | `[String!]!`               | Product tags for filtering                                         |
| `variants`                                                                     | `[ProductVariant!]!`       | Product variants (size, color combinations)                        |
| `totalInventory`                                                               | `Int!`                     | Total inventory across all variants                                |
| `isInStock`                                                                    | `Boolean!`                 | Whether any variant is in stock                                    |
| `seller`                                                                       | `User!`                    | Seller who listed this product _(see User above)_                  |
| `reviews`                                                                      | `ReviewConnection!`        | Product reviews (circular: Review references Product)              |
| `averageRating`                                                                | `Float`                    | Average rating (1-5)                                               |
| `reviewCount`                                                                  | `Int!`                     | Total number of reviews                                            |
| `relatedProducts`                                                              | `[Product!]!`              | Related products (for "You might also like") _(see Product above)_ |
| `frequentlyBoughtWith`                                                         | `[Product!]!`              | Products frequently bought together _(see Product above)_          |
| `specifications`                                                               | `[ProductSpecification!]!` | Product specifications/attributes                                  |
| `seo`                                                                          | `SEOMetadata`              | SEO metadata                                                       |
| `createdAt`                                                                    | `DateTime!`                | When created                                                       |
| `updatedAt`                                                                    | `DateTime!`                | When last updated                                                  |
| `deletedAt`                                                                    | `DateTime`                 | When deleted (soft delete)                                         |
| `isDeleted`                                                                    | `Boolean!`                 | Whether deleted                                                    |

**ProductImage fields:**

| Field          | Type      | Description                |
| -------------- | --------- | -------------------------- |
| `id`           | `UUID!`   | Unique identifier          |
| `url`          | `String!` | Original image URL         |
| `thumbnailUrl` | `String!` | Thumbnail URL (100x100)    |
| `mediumUrl`    | `String!` | Medium size URL (400x400)  |
| `largeUrl`     | `String!` | Large size URL (800x800)   |
| `altText`      | `String`  | Alt text for accessibility |
| `sortOrder`    | `Int!`    | Display order              |

**ProductStatus values:**

| ProductStatus Value | Description                              |
| ------------------- | ---------------------------------------- |
| `AVAILABLE`         | Product is available for purchase        |
| `OUT_OF_STOCK`      | Product is temporarily out of stock      |
| `HIDDEN`            | Product listing is hidden from customers |
| `DISCONTINUED`      | Product has been discontinued            |

**Category fields:**

| Field          | Type                                       | Description                                                                             |
| -------------- | ------------------------------------------ | --------------------------------------------------------------------------------------- |
| `id`           | `UUID!`                                    | Unique identifier                                                                       |
| `slug`         | `String!`                                  | URL-friendly slug                                                                       |
| `name`         | `String!`                                  | Category name                                                                           |
| `description`  | `String`                                   | Category description                                                                    |
| `imageUrl`     | `String`                                   | Category image URL                                                                      |
| `parent`       | `Category`                                 | Parent category (for hierarchy) _(see Category above)_                                  |
| `children`     | `[Category!]!`                             | Child categories _(see Category above)_                                                 |
| `breadcrumb`   | `[Category!]!`                             | Full path from root (e.g., "Electronics > Phones > Smartphones") _(see Category above)_ |
| `products`     | `ProductConnection!` _(max depth reached)_ | Products in this category (circular reference with Product.category)                    |
| `productCount` | `Int!`                                     | Total number of products in this category (including subcategories)                     |
| `createdAt`    | `DateTime!`                                | When created                                                                            |
| `updatedAt`    | `DateTime!`                                | When last updated                                                                       |

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

**ProductSpecification fields:**

| Field   | Type      | Description                               |
| ------- | --------- | ----------------------------------------- |
| `name`  | `String!` | Specification name (e.g., "Material")     |
| `value` | `String!` | Specification value (e.g., "100% Cotton") |
| `unit`  | `String`  | Optional unit (e.g., "cm", "kg")          |

**SEOMetadata fields:**

| Field          | Type        | Description          |
| -------------- | ----------- | -------------------- |
| `title`        | `String`    | Meta title           |
| `description`  | `String`    | Meta description     |
| `keywords`     | `[String!]` | Meta keywords        |
| `canonicalUrl` | `String`    | Canonical URL        |
| `ogImage`      | `String`    | Open Graph image URL |

**Cart fields:**

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

| Field        | Type                                   | Description               |
| ------------ | -------------------------------------- | ------------------------- |
| `id`         | `UUID!`                                | Unique identifier         |
| `product`    | `Product!` _(max depth reached)_       | —                         |
| `variant`    | `ProductVariant` _(max depth reached)_ | The specific variant      |
| `quantity`   | `Int!`                                 | Quantity in cart          |
| `unitPrice`  | `Money!`                               | Unit price                |
| `totalPrice` | `Money!`                               | Total price for this item |

**Coupon fields:**

| Field           | Type       | Description                           |
| --------------- | ---------- | ------------------------------------- |
| `code`          | `String!`  | Coupon code                           |
| `description`   | `String!`  | Discount description                  |
| `discountValue` | `String!`  | Discount amount or percentage         |
| `isPercentage`  | `Boolean!` | Whether this is a percentage discount |

**Example: Create Customer**

Register a new customer account with full profile information

```graphql
mutation CreateCustomer($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    email
    displayName
    role
    profile {
      firstName
      lastName
    }
  }
}
```

```json
{
  "data": {
    "createUser": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "jane.doe@example.com",
      "displayName": "Jane Doe",
      "role": "CUSTOMER",
      "profile": {
        "firstName": "Jane",
        "lastName": "Doe"
      }
    }
  }
}
```

**Example: Duplicate Email**

Attempting to create an account with an email that already exists returns a validation error. The API checks for email uniqueness before account creation.

```graphql
mutation CreateCustomer($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    email
  }
}
```

```json
{
  "data": null,
  "errors": [
    {
      "message": "An account with this email already exists",
      "extensions": {
        "code": "EMAIL_ALREADY_EXISTS",
        "field": "email"
      },
      "path": ["createUser"]
    }
  ]
}
```

**Example: Weak Password**

Passwords must meet minimum security requirements: at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.

```graphql
mutation CreateCustomer($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    email
  }
}
```

```json
{
  "data": null,
  "errors": [
    {
      "message": "Password does not meet security requirements",
      "extensions": {
        "code": "INVALID_PASSWORD",
        "field": "password",
        "requirements": {
          "minLength": 8,
          "requireUppercase": true,
          "requireLowercase": true,
          "requireNumber": true,
          "requireSpecialChar": true
        }
      },
      "path": ["createUser"]
    }
  ]
}
```

**Example: Invalid Email Format**

The email field must contain a valid email address format. The API validates email format before processing the request.

```graphql
mutation CreateCustomer($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    email
  }
}
```

```json
{
  "data": null,
  "errors": [
    {
      "message": "Invalid email format",
      "extensions": {
        "code": "INVALID_EMAIL_FORMAT",
        "field": "email"
      },
      "path": ["createUser"]
    }
  ]
}
```

**Example: Create Admin User**

Creating an admin user requires elevated permissions. This example shows how to create an admin account (requires SUPER_ADMIN role).

```graphql
mutation CreateAdminUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    email
    displayName
    role
    permissions
  }
}
```

```json
{
  "data": {
    "createUser": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "email": "admin@company.com",
      "displayName": "Admin User",
      "role": "ADMIN",
      "permissions": ["MANAGE_PRODUCTS", "MANAGE_ORDERS", "VIEW_ANALYTICS"]
    }
  }
}
```

### updateProfile

Update the current user's profile

**Arguments:**

| Argument | Type                | Required | Description            |
| -------- | ------------------- | -------- | ---------------------- |
| `input`  | `UserProfileInput!` | Yes      | Profile data to update |

**Returns:** `User!`

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

| Field               | Type       | Description                                  |
| ------------------- | ---------- | -------------------------------------------- |
| `firstName`         | `String`   | User's first name                            |
| `lastName`          | `String`   | User's last name                             |
| `phoneNumber`       | `String`   | User's phone number                          |
| `dateOfBirth`       | `DateTime` | User's date of birth                         |
| `bio`               | `String`   | User's bio or description                    |
| `preferredLanguage` | `String`   | User's preferred language (ISO 639-1 code)   |
| `preferredCurrency` | `Currency` | User's preferred currency                    |
| `marketingOptIn`    | `Boolean!` | Whether user has opted into marketing emails |

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

**AddressBook fields:**

| Field             | Type                 | Description                       |
| ----------------- | -------------------- | --------------------------------- |
| `addresses`       | `[LabeledAddress!]!` | All addresses in the address book |
| `defaultShipping` | `LabeledAddress`     | Default shipping address          |
| `defaultBilling`  | `LabeledAddress`     | Default billing address           |

**LabeledAddress fields:**

| Field               | Type                             | Description                                  |
| ------------------- | -------------------------------- | -------------------------------------------- |
| `address`           | `Address!` _(max depth reached)_ | The address details                          |
| `label`             | `String!`                        | User-defined label (e.g., "Home", "Work")    |
| `isDefaultShipping` | `Boolean!`                       | Whether this is the default shipping address |
| `isDefaultBilling`  | `Boolean!`                       | Whether this is the default billing address  |

**OrderConnection fields:**

| Field      | Type            | Description     |
| ---------- | --------------- | --------------- |
| `edges`    | `[OrderEdge!]!` | The orders      |
| `pageInfo` | `PageInfo!`     | Pagination info |

**OrderEdge fields:**

| Field    | Type                           | Description       |
| -------- | ------------------------------ | ----------------- |
| `node`   | `Order!` _(max depth reached)_ | The order         |
| `cursor` | `String!`                      | Pagination cursor |

**PageInfo fields:**

| Field             | Type       | Description                         |
| ----------------- | ---------- | ----------------------------------- |
| `hasNextPage`     | `Boolean!` | Whether there are more items after  |
| `hasPreviousPage` | `Boolean!` | Whether there are more items before |
| `startCursor`     | `String`   | Cursor of the first item            |
| `endCursor`       | `String`   | Cursor of the last item             |
| `totalCount`      | `Int!`     | Total count of items                |

**ReviewConnection fields:**

| Field      | Type             | Description     |
| ---------- | ---------------- | --------------- |
| `edges`    | `[ReviewEdge!]!` | The reviews     |
| `pageInfo` | `PageInfo!`      | Pagination info |

**ReviewEdge fields:**

| Field    | Type                            | Description       |
| -------- | ------------------------------- | ----------------- |
| `node`   | `Review!` _(max depth reached)_ | The review        |
| `cursor` | `String!`                       | Pagination cursor |

**Product fields:**

| Field                                                                          | Type                       | Description                                                        |
| ------------------------------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------ |
| `id`                                                                           | `UUID!`                    | Unique identifier                                                  |
| `slug`                                                                         | `String!`                  | URL-friendly slug                                                  |
| `name`                                                                         | `String!`                  | Product name                                                       |
| `shortDescription`                                                             | `String!`                  | Short description for listings                                     |
| `description`                                                                  | `String!`                  | Full product description (supports markdown)                       |
| `images`                                                                       | `[ProductImage!]!`         | Product images                                                     |
| `primaryImage`                                                                 | `ProductImage`             | Primary/featured image                                             |
| `price`                                                                        | `Money!`                   | Current price                                                      |
| `compareAtPrice`                                                               | `Money`                    | Original price before discount (if on sale)                        |
| `isOnSale`                                                                     | `Boolean!`                 | Whether product is currently on sale                               |
| `status`                                                                       | `ProductStatus!`           | Product status                                                     |
| `category`                                                                     | `Category!`                | Product category (creates circular reference)                      |
| Category contains a list of products, and each product references its category |
| `additionalCategories`                                                         | `[Category!]!`             | Additional categories this product belongs to                      |
| `tags`                                                                         | `[String!]!`               | Product tags for filtering                                         |
| `variants`                                                                     | `[ProductVariant!]!`       | Product variants (size, color combinations)                        |
| `totalInventory`                                                               | `Int!`                     | Total inventory across all variants                                |
| `isInStock`                                                                    | `Boolean!`                 | Whether any variant is in stock                                    |
| `seller`                                                                       | `User!`                    | Seller who listed this product _(see User above)_                  |
| `reviews`                                                                      | `ReviewConnection!`        | Product reviews (circular: Review references Product)              |
| `averageRating`                                                                | `Float`                    | Average rating (1-5)                                               |
| `reviewCount`                                                                  | `Int!`                     | Total number of reviews                                            |
| `relatedProducts`                                                              | `[Product!]!`              | Related products (for "You might also like") _(see Product above)_ |
| `frequentlyBoughtWith`                                                         | `[Product!]!`              | Products frequently bought together _(see Product above)_          |
| `specifications`                                                               | `[ProductSpecification!]!` | Product specifications/attributes                                  |
| `seo`                                                                          | `SEOMetadata`              | SEO metadata                                                       |
| `createdAt`                                                                    | `DateTime!`                | When created                                                       |
| `updatedAt`                                                                    | `DateTime!`                | When last updated                                                  |
| `deletedAt`                                                                    | `DateTime`                 | When deleted (soft delete)                                         |
| `isDeleted`                                                                    | `Boolean!`                 | Whether deleted                                                    |

**ProductImage fields:**

| Field          | Type      | Description                |
| -------------- | --------- | -------------------------- |
| `id`           | `UUID!`   | Unique identifier          |
| `url`          | `String!` | Original image URL         |
| `thumbnailUrl` | `String!` | Thumbnail URL (100x100)    |
| `mediumUrl`    | `String!` | Medium size URL (400x400)  |
| `largeUrl`     | `String!` | Large size URL (800x800)   |
| `altText`      | `String`  | Alt text for accessibility |
| `sortOrder`    | `Int!`    | Display order              |

**ProductStatus values:**

| ProductStatus Value | Description                              |
| ------------------- | ---------------------------------------- |
| `AVAILABLE`         | Product is available for purchase        |
| `OUT_OF_STOCK`      | Product is temporarily out of stock      |
| `HIDDEN`            | Product listing is hidden from customers |
| `DISCONTINUED`      | Product has been discontinued            |

**Category fields:**

| Field          | Type                                       | Description                                                                             |
| -------------- | ------------------------------------------ | --------------------------------------------------------------------------------------- |
| `id`           | `UUID!`                                    | Unique identifier                                                                       |
| `slug`         | `String!`                                  | URL-friendly slug                                                                       |
| `name`         | `String!`                                  | Category name                                                                           |
| `description`  | `String`                                   | Category description                                                                    |
| `imageUrl`     | `String`                                   | Category image URL                                                                      |
| `parent`       | `Category`                                 | Parent category (for hierarchy) _(see Category above)_                                  |
| `children`     | `[Category!]!`                             | Child categories _(see Category above)_                                                 |
| `breadcrumb`   | `[Category!]!`                             | Full path from root (e.g., "Electronics > Phones > Smartphones") _(see Category above)_ |
| `products`     | `ProductConnection!` _(max depth reached)_ | Products in this category (circular reference with Product.category)                    |
| `productCount` | `Int!`                                     | Total number of products in this category (including subcategories)                     |
| `createdAt`    | `DateTime!`                                | When created                                                                            |
| `updatedAt`    | `DateTime!`                                | When last updated                                                                       |

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

**ProductSpecification fields:**

| Field   | Type      | Description                               |
| ------- | --------- | ----------------------------------------- |
| `name`  | `String!` | Specification name (e.g., "Material")     |
| `value` | `String!` | Specification value (e.g., "100% Cotton") |
| `unit`  | `String`  | Optional unit (e.g., "cm", "kg")          |

**SEOMetadata fields:**

| Field          | Type        | Description          |
| -------------- | ----------- | -------------------- |
| `title`        | `String`    | Meta title           |
| `description`  | `String`    | Meta description     |
| `keywords`     | `[String!]` | Meta keywords        |
| `canonicalUrl` | `String`    | Canonical URL        |
| `ogImage`      | `String`    | Open Graph image URL |

**Cart fields:**

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

| Field        | Type                                   | Description               |
| ------------ | -------------------------------------- | ------------------------- |
| `id`         | `UUID!`                                | Unique identifier         |
| `product`    | `Product!` _(max depth reached)_       | —                         |
| `variant`    | `ProductVariant` _(max depth reached)_ | The specific variant      |
| `quantity`   | `Int!`                                 | Quantity in cart          |
| `unitPrice`  | `Money!`                               | Unit price                |
| `totalPrice` | `Money!`                               | Total price for this item |

**Coupon fields:**

| Field           | Type       | Description                           |
| --------------- | ---------- | ------------------------------------- |
| `code`          | `String!`  | Coupon code                           |
| `description`   | `String!`  | Discount description                  |
| `discountValue` | `String!`  | Discount amount or percentage         |
| `isPercentage`  | `Boolean!` | Whether this is a percentage discount |

**Example: Update Bio**

Update user biography and preferences

```graphql
mutation UpdateProfile($input: UserProfileInput!) {
  updateProfile(input: $input) {
    id
    profile {
      bio
      preferredLanguage
    }
  }
}
```

```json
{
  "data": {
    "updateProfile": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "profile": {
        "bio": "Avid reader and tech enthusiast",
        "preferredLanguage": "en"
      }
    }
  }
}
```

**Example: Update Phone Number**

Adding or updating a phone number triggers SMS verification. The phone number must be in E.164 format.

```graphql
mutation UpdateProfile($input: UserProfileInput!) {
  updateProfile(input: $input) {
    id
    profile {
      phoneNumber
      phoneVerified
    }
  }
}
```

```json
{
  "data": {
    "updateProfile": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "profile": {
        "phoneNumber": "+14155551234",
        "phoneVerified": false
      }
    }
  }
}
```

**Example: Invalid Phone Format**

Phone numbers must be in E.164 format (e.g., +14155551234). Local formats are not accepted.

```graphql
mutation UpdateProfile($input: UserProfileInput!) {
  updateProfile(input: $input) {
    id
    profile {
      phoneNumber
    }
  }
}
```

```json
{
  "data": null,
  "errors": [
    {
      "message": "Phone number must be in E.164 format (e.g., +14155551234)",
      "extensions": {
        "code": "INVALID_PHONE_FORMAT",
        "field": "phoneNumber"
      },
      "path": ["updateProfile"]
    }
  ]
}
```

**Example: Bio Too Long**

Bio text is limited to 500 characters to ensure consistent display across the platform.

```graphql
mutation UpdateProfile($input: UserProfileInput!) {
  updateProfile(input: $input) {
    id
    profile {
      bio
    }
  }
}
```

```json
{
  "data": null,
  "errors": [
    {
      "message": "Bio cannot exceed 500 characters",
      "extensions": {
        "code": "VALIDATION_ERROR",
        "field": "bio",
        "maxLength": 500,
        "actualLength": 623
      },
      "path": ["updateProfile"]
    }
  ]
}
```

### addAddress

Add an address to the user's address book

**Arguments:**

| Argument | Type            | Required | Description  |
| -------- | --------------- | -------- | ------------ |
| `input`  | `AddressInput!` | Yes      | Address data |

**Returns:** `LabeledAddress!`

| Field               | Type       | Description                                  |
| ------------------- | ---------- | -------------------------------------------- |
| `address`           | `Address!` | The address details                          |
| `label`             | `String!`  | User-defined label (e.g., "Home", "Work")    |
| `isDefaultShipping` | `Boolean!` | Whether this is the default shipping address |
| `isDefaultBilling`  | `Boolean!` | Whether this is the default billing address  |

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

**Example: Add Home Address**

Add a new shipping address to the user's address book

```graphql
mutation AddAddress($input: AddressInput!) {
  addAddress(input: $input) {
    label
    address {
      street1
      city
      postalCode
    }
  }
}
```

```json
{
  "data": {
    "addAddress": {
      "label": "Home",
      "address": {
        "street1": "123 Main St",
        "city": "New York",
        "postalCode": "10001"
      }
    }
  }
}
```

**Example: Add International Address**

Adding an address outside the US. Note that some shipping methods may not be available for international addresses.

```graphql
mutation AddAddress($input: AddressInput!) {
  addAddress(input: $input) {
    label
    address {
      street1
      street2
      city
      postalCode
      countryCode
    }
    shippingMethods
  }
}
```

```json
{
  "data": {
    "addAddress": {
      "label": "UK Office",
      "address": {
        "street1": "10 Downing Street",
        "street2": null,
        "city": "London",
        "postalCode": "SW1A 2AA",
        "countryCode": "GB"
      },
      "shippingMethods": ["INTERNATIONAL_STANDARD", "INTERNATIONAL_EXPRESS"]
    }
  }
}
```

**Example: Invalid Postal Code**

Postal codes are validated against the country's expected format. US postal codes must be 5 digits or 5+4 format.

```graphql
mutation AddAddress($input: AddressInput!) {
  addAddress(input: $input) {
    label
  }
}
```

```json
{
  "data": null,
  "errors": [
    {
      "message": "Invalid postal code format for country US",
      "extensions": {
        "code": "INVALID_POSTAL_CODE",
        "field": "postalCode",
        "expectedFormat": "XXXXX or XXXXX-XXXX"
      },
      "path": ["addAddress"]
    }
  ]
}
```

**Example: Address Limit Exceeded**

Users can store a maximum of 10 addresses. Remove an existing address before adding a new one.

```graphql
mutation AddAddress($input: AddressInput!) {
  addAddress(input: $input) {
    label
  }
}
```

```json
{
  "data": null,
  "errors": [
    {
      "message": "Maximum number of addresses reached",
      "extensions": {
        "code": "ADDRESS_LIMIT_EXCEEDED",
        "maxAddresses": 10,
        "currentCount": 10
      },
      "path": ["addAddress"]
    }
  ]
}
```

## Types Reference

### User

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

| Field               | Type       | Description                                  |
| ------------------- | ---------- | -------------------------------------------- |
| `firstName`         | `String`   | User's first name                            |
| `lastName`          | `String`   | User's last name                             |
| `phoneNumber`       | `String`   | User's phone number                          |
| `dateOfBirth`       | `DateTime` | User's date of birth                         |
| `bio`               | `String`   | User's bio or description                    |
| `preferredLanguage` | `String`   | User's preferred language (ISO 639-1 code)   |
| `preferredCurrency` | `Currency` | User's preferred currency                    |
| `marketingOptIn`    | `Boolean!` | Whether user has opted into marketing emails |

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

**AddressBook fields:**

| Field             | Type                 | Description                       |
| ----------------- | -------------------- | --------------------------------- |
| `addresses`       | `[LabeledAddress!]!` | All addresses in the address book |
| `defaultShipping` | `LabeledAddress`     | Default shipping address          |
| `defaultBilling`  | `LabeledAddress`     | Default billing address           |

**LabeledAddress fields:**

| Field               | Type                             | Description                                  |
| ------------------- | -------------------------------- | -------------------------------------------- |
| `address`           | `Address!` _(max depth reached)_ | The address details                          |
| `label`             | `String!`                        | User-defined label (e.g., "Home", "Work")    |
| `isDefaultShipping` | `Boolean!`                       | Whether this is the default shipping address |
| `isDefaultBilling`  | `Boolean!`                       | Whether this is the default billing address  |

**OrderConnection fields:**

| Field      | Type            | Description     |
| ---------- | --------------- | --------------- |
| `edges`    | `[OrderEdge!]!` | The orders      |
| `pageInfo` | `PageInfo!`     | Pagination info |

**OrderEdge fields:**

| Field    | Type                           | Description       |
| -------- | ------------------------------ | ----------------- |
| `node`   | `Order!` _(max depth reached)_ | The order         |
| `cursor` | `String!`                      | Pagination cursor |

**PageInfo fields:**

| Field             | Type       | Description                         |
| ----------------- | ---------- | ----------------------------------- |
| `hasNextPage`     | `Boolean!` | Whether there are more items after  |
| `hasPreviousPage` | `Boolean!` | Whether there are more items before |
| `startCursor`     | `String`   | Cursor of the first item            |
| `endCursor`       | `String`   | Cursor of the last item             |
| `totalCount`      | `Int!`     | Total count of items                |

**ReviewConnection fields:**

| Field      | Type             | Description     |
| ---------- | ---------------- | --------------- |
| `edges`    | `[ReviewEdge!]!` | The reviews     |
| `pageInfo` | `PageInfo!`      | Pagination info |

**ReviewEdge fields:**

| Field    | Type                            | Description       |
| -------- | ------------------------------- | ----------------- |
| `node`   | `Review!` _(max depth reached)_ | The review        |
| `cursor` | `String!`                       | Pagination cursor |

**Product fields:**

| Field                                                                          | Type                       | Description                                                        |
| ------------------------------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------ |
| `id`                                                                           | `UUID!`                    | Unique identifier                                                  |
| `slug`                                                                         | `String!`                  | URL-friendly slug                                                  |
| `name`                                                                         | `String!`                  | Product name                                                       |
| `shortDescription`                                                             | `String!`                  | Short description for listings                                     |
| `description`                                                                  | `String!`                  | Full product description (supports markdown)                       |
| `images`                                                                       | `[ProductImage!]!`         | Product images                                                     |
| `primaryImage`                                                                 | `ProductImage`             | Primary/featured image                                             |
| `price`                                                                        | `Money!`                   | Current price                                                      |
| `compareAtPrice`                                                               | `Money`                    | Original price before discount (if on sale)                        |
| `isOnSale`                                                                     | `Boolean!`                 | Whether product is currently on sale                               |
| `status`                                                                       | `ProductStatus!`           | Product status                                                     |
| `category`                                                                     | `Category!`                | Product category (creates circular reference)                      |
| Category contains a list of products, and each product references its category |
| `additionalCategories`                                                         | `[Category!]!`             | Additional categories this product belongs to                      |
| `tags`                                                                         | `[String!]!`               | Product tags for filtering                                         |
| `variants`                                                                     | `[ProductVariant!]!`       | Product variants (size, color combinations)                        |
| `totalInventory`                                                               | `Int!`                     | Total inventory across all variants                                |
| `isInStock`                                                                    | `Boolean!`                 | Whether any variant is in stock                                    |
| `seller`                                                                       | `User!`                    | Seller who listed this product _(see User above)_                  |
| `reviews`                                                                      | `ReviewConnection!`        | Product reviews (circular: Review references Product)              |
| `averageRating`                                                                | `Float`                    | Average rating (1-5)                                               |
| `reviewCount`                                                                  | `Int!`                     | Total number of reviews                                            |
| `relatedProducts`                                                              | `[Product!]!`              | Related products (for "You might also like") _(see Product above)_ |
| `frequentlyBoughtWith`                                                         | `[Product!]!`              | Products frequently bought together _(see Product above)_          |
| `specifications`                                                               | `[ProductSpecification!]!` | Product specifications/attributes                                  |
| `seo`                                                                          | `SEOMetadata`              | SEO metadata                                                       |
| `createdAt`                                                                    | `DateTime!`                | When created                                                       |
| `updatedAt`                                                                    | `DateTime!`                | When last updated                                                  |
| `deletedAt`                                                                    | `DateTime`                 | When deleted (soft delete)                                         |
| `isDeleted`                                                                    | `Boolean!`                 | Whether deleted                                                    |

**ProductImage fields:**

| Field          | Type      | Description                |
| -------------- | --------- | -------------------------- |
| `id`           | `UUID!`   | Unique identifier          |
| `url`          | `String!` | Original image URL         |
| `thumbnailUrl` | `String!` | Thumbnail URL (100x100)    |
| `mediumUrl`    | `String!` | Medium size URL (400x400)  |
| `largeUrl`     | `String!` | Large size URL (800x800)   |
| `altText`      | `String`  | Alt text for accessibility |
| `sortOrder`    | `Int!`    | Display order              |

**ProductStatus values:**

| ProductStatus Value | Description                              |
| ------------------- | ---------------------------------------- |
| `AVAILABLE`         | Product is available for purchase        |
| `OUT_OF_STOCK`      | Product is temporarily out of stock      |
| `HIDDEN`            | Product listing is hidden from customers |
| `DISCONTINUED`      | Product has been discontinued            |

**Category fields:**

| Field          | Type                                       | Description                                                                             |
| -------------- | ------------------------------------------ | --------------------------------------------------------------------------------------- |
| `id`           | `UUID!`                                    | Unique identifier                                                                       |
| `slug`         | `String!`                                  | URL-friendly slug                                                                       |
| `name`         | `String!`                                  | Category name                                                                           |
| `description`  | `String`                                   | Category description                                                                    |
| `imageUrl`     | `String`                                   | Category image URL                                                                      |
| `parent`       | `Category`                                 | Parent category (for hierarchy) _(see Category above)_                                  |
| `children`     | `[Category!]!`                             | Child categories _(see Category above)_                                                 |
| `breadcrumb`   | `[Category!]!`                             | Full path from root (e.g., "Electronics > Phones > Smartphones") _(see Category above)_ |
| `products`     | `ProductConnection!` _(max depth reached)_ | Products in this category (circular reference with Product.category)                    |
| `productCount` | `Int!`                                     | Total number of products in this category (including subcategories)                     |
| `createdAt`    | `DateTime!`                                | When created                                                                            |
| `updatedAt`    | `DateTime!`                                | When last updated                                                                       |

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

**ProductSpecification fields:**

| Field   | Type      | Description                               |
| ------- | --------- | ----------------------------------------- |
| `name`  | `String!` | Specification name (e.g., "Material")     |
| `value` | `String!` | Specification value (e.g., "100% Cotton") |
| `unit`  | `String`  | Optional unit (e.g., "cm", "kg")          |

**SEOMetadata fields:**

| Field          | Type        | Description          |
| -------------- | ----------- | -------------------- |
| `title`        | `String`    | Meta title           |
| `description`  | `String`    | Meta description     |
| `keywords`     | `[String!]` | Meta keywords        |
| `canonicalUrl` | `String`    | Canonical URL        |
| `ogImage`      | `String`    | Open Graph image URL |

**Cart fields:**

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

| Field        | Type                                   | Description               |
| ------------ | -------------------------------------- | ------------------------- |
| `id`         | `UUID!`                                | Unique identifier         |
| `product`    | `Product!` _(max depth reached)_       | —                         |
| `variant`    | `ProductVariant` _(max depth reached)_ | The specific variant      |
| `quantity`   | `Int!`                                 | Quantity in cart          |
| `unitPrice`  | `Money!`                               | Unit price                |
| `totalPrice` | `Money!`                               | Total price for this item |

**Coupon fields:**

| Field           | Type       | Description                           |
| --------------- | ---------- | ------------------------------------- |
| `code`          | `String!`  | Coupon code                           |
| `description`   | `String!`  | Discount description                  |
| `discountValue` | `String!`  | Discount amount or percentage         |
| `isPercentage`  | `Boolean!` | Whether this is a percentage discount |
