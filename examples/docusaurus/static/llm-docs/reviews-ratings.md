# Reviews & Ratings

> Part of [GraphQL API](./index.md) GraphQL API

---

## Queries

### review

Get a review by ID

**Arguments:**

| Argument | Type    | Required | Description |
| -------- | ------- | -------- | ----------- |
| `id`     | `UUID!` | Yes      | Review ID   |

**Returns:** `Review`

| Field                | Type              | Description                                        |
| -------------------- | ----------------- | -------------------------------------------------- |
| `id`                 | `UUID!`           | Unique identifier                                  |
| `product`            | `Product!`        | The product being reviewed                         |
| `author`             | `User!`           | The user who wrote the review (circular reference) |
| `rating`             | `Int!`            | Rating from 1 to 5                                 |
| `title`              | `String`          | Review title                                       |
| `body`               | `String!`         | Review body text                                   |
| `pros`               | `[String!]`       | Pros mentioned by reviewer                         |
| `cons`               | `[String!]`       | Cons mentioned by reviewer                         |
| `images`             | `[ReviewImage!]`  | Attached images                                    |
| `isVerifiedPurchase` | `Boolean!`        | Whether reviewer is a verified purchaser           |
| `helpfulCount`       | `Int!`            | Number of users who found this helpful             |
| `unhelpfulCount`     | `Int!`            | Number of users who found this unhelpful           |
| `replies`            | `[ReviewReply!]!` | Replies to this review                             |
| `isApproved`         | `Boolean!`        | Whether approved by moderators                     |
| `moderatedAt`        | `DateTime`        | When moderated                                     |
| `moderatedBy`        | `User`            | Who moderated                                      |
| `createdAt`          | `DateTime!`       | When created                                       |
| `updatedAt`          | `DateTime!`       | When last updated                                  |

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
| `seller`                                                                       | `User!`                    | Seller who listed this product                                     |
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
| `wishlist`                                                                                                                                | `[Product!]!`                             | Products in user's wishlist _(see Product above)_                            |
| `cart`                                                                                                                                    | `Cart` _(max depth reached)_              | User's shopping cart                                                         |
| `totalSpent`                                                                                                                              | `Money!`                                  | Total amount spent by this user                                              |
| `orderCount`                                                                                                                              | `Int!`                                    | Number of orders placed                                                      |
| `createdAt`                                                                                                                               | `DateTime!`                               | When the user was created                                                    |
| `updatedAt`                                                                                                                               | `DateTime!`                               | When the user was last updated                                               |
| `deletedAt`                                                                                                                               | `DateTime`                                | When the user was deleted (soft delete)                                      |
| `isDeleted`                                                                                                                               | `Boolean!`                                | Whether the user account is deleted                                          |

**ReviewConnection fields:**

| Field      | Type                                   | Description     |
| ---------- | -------------------------------------- | --------------- |
| `edges`    | `[ReviewEdge!]!` _(max depth reached)_ | The reviews     |
| `pageInfo` | `PageInfo!` _(max depth reached)_      | Pagination info |

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

**ReviewImage fields:**

| Field     | Type      | Description   |
| --------- | --------- | ------------- |
| `url`     | `String!` | Image URL     |
| `caption` | `String`  | Image caption |

**ReviewReply fields:**

| Field              | Type        | Description                                 |
| ------------------ | ----------- | ------------------------------------------- |
| `id`               | `UUID!`     | Unique identifier                           |
| `author`           | `User!`     | Reply author                                |
| `body`             | `String!`   | Reply text                                  |
| `isSellerResponse` | `Boolean!`  | Whether this is an official seller response |
| `createdAt`        | `DateTime!` | When created                                |

**Example: Get Review**

Get details of a specific review

```graphql
query GetReview($id: UUID!) {
  review(id: $id) {
    id
    rating
    title
    comment
    author {
      displayName
      avatarUrl
    }
    isVerifiedPurchase
    helpfulCount
    createdAt
  }
}
```

```json
{
  "data": {
    "review": {
      "id": "rev_123",
      "rating": 5,
      "title": "Excellent product!",
      "comment": "Great sound quality and comfortable to wear for long periods. Battery life exceeded expectations.",
      "author": {
        "displayName": "John Doe",
        "avatarUrl": "https://cdn.example.com/avatars/john.jpg"
      },
      "isVerifiedPurchase": true,
      "helpfulCount": 42,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Example: Review Not Found**

When a review ID doesn't exist or has been removed

```graphql
query GetReview($id: UUID!) {
  review(id: $id) {
    id
    rating
  }
}
```

```json
{
  "data": {
    "review": null
  },
  "errors": [
    {
      "message": "Review not found",
      "extensions": {
        "code": "NOT_FOUND",
        "resourceType": "Review"
      },
      "path": ["review"]
    }
  ]
}
```

## Mutations

### createReview

Create a review for a product

**Arguments:**

| Argument | Type                 | Required | Description |
| -------- | -------------------- | -------- | ----------- |
| `input`  | `CreateReviewInput!` | Yes      | Review data |

**Returns:** `Review!`

| Field                | Type              | Description                                        |
| -------------------- | ----------------- | -------------------------------------------------- |
| `id`                 | `UUID!`           | Unique identifier                                  |
| `product`            | `Product!`        | The product being reviewed                         |
| `author`             | `User!`           | The user who wrote the review (circular reference) |
| `rating`             | `Int!`            | Rating from 1 to 5                                 |
| `title`              | `String`          | Review title                                       |
| `body`               | `String!`         | Review body text                                   |
| `pros`               | `[String!]`       | Pros mentioned by reviewer                         |
| `cons`               | `[String!]`       | Cons mentioned by reviewer                         |
| `images`             | `[ReviewImage!]`  | Attached images                                    |
| `isVerifiedPurchase` | `Boolean!`        | Whether reviewer is a verified purchaser           |
| `helpfulCount`       | `Int!`            | Number of users who found this helpful             |
| `unhelpfulCount`     | `Int!`            | Number of users who found this unhelpful           |
| `replies`            | `[ReviewReply!]!` | Replies to this review                             |
| `isApproved`         | `Boolean!`        | Whether approved by moderators                     |
| `moderatedAt`        | `DateTime`        | When moderated                                     |
| `moderatedBy`        | `User`            | Who moderated                                      |
| `createdAt`          | `DateTime!`       | When created                                       |
| `updatedAt`          | `DateTime!`       | When last updated                                  |

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
| `seller`                                                                       | `User!`                    | Seller who listed this product                                     |
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
| `wishlist`                                                                                                                                | `[Product!]!`                             | Products in user's wishlist _(see Product above)_                            |
| `cart`                                                                                                                                    | `Cart` _(max depth reached)_              | User's shopping cart                                                         |
| `totalSpent`                                                                                                                              | `Money!`                                  | Total amount spent by this user                                              |
| `orderCount`                                                                                                                              | `Int!`                                    | Number of orders placed                                                      |
| `createdAt`                                                                                                                               | `DateTime!`                               | When the user was created                                                    |
| `updatedAt`                                                                                                                               | `DateTime!`                               | When the user was last updated                                               |
| `deletedAt`                                                                                                                               | `DateTime`                                | When the user was deleted (soft delete)                                      |
| `isDeleted`                                                                                                                               | `Boolean!`                                | Whether the user account is deleted                                          |

**ReviewConnection fields:**

| Field      | Type                                   | Description     |
| ---------- | -------------------------------------- | --------------- |
| `edges`    | `[ReviewEdge!]!` _(max depth reached)_ | The reviews     |
| `pageInfo` | `PageInfo!` _(max depth reached)_      | Pagination info |

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

**ReviewImage fields:**

| Field     | Type      | Description   |
| --------- | --------- | ------------- |
| `url`     | `String!` | Image URL     |
| `caption` | `String`  | Image caption |

**ReviewReply fields:**

| Field              | Type        | Description                                 |
| ------------------ | ----------- | ------------------------------------------- |
| `id`               | `UUID!`     | Unique identifier                           |
| `author`           | `User!`     | Reply author                                |
| `body`             | `String!`   | Reply text                                  |
| `isSellerResponse` | `Boolean!`  | Whether this is an official seller response |
| `createdAt`        | `DateTime!` | When created                                |

**Example: Submit Review**

Submit a new product review. Reviews require moderation before appearing publicly.

```graphql
mutation CreateReview($input: CreateReviewInput!) {
  createReview(input: $input) {
    id
    rating
    title
    comment
    isApproved
    status
  }
}
```

```json
{
  "data": {
    "createReview": {
      "id": "rev_new_123",
      "rating": 5,
      "title": "Amazing product!",
      "comment": "Exceeded all my expectations. The build quality is superb and it works flawlessly.",
      "isApproved": false,
      "status": "PENDING_MODERATION"
    }
  }
}
```

**Example: Already Reviewed**

Users can only submit one review per product

```graphql
mutation CreateReview($input: CreateReviewInput!) {
  createReview(input: $input) {
    id
  }
}
```

```json
{
  "data": null,
  "errors": [
    {
      "message": "You have already reviewed this product",
      "extensions": {
        "code": "DUPLICATE_REVIEW",
        "existingReviewId": "rev_existing_456",
        "suggestion": "You can edit your existing review instead"
      },
      "path": ["createReview"]
    }
  ]
}
```

**Example: Not Purchased**

Some products require a verified purchase before reviewing

```graphql
mutation CreateReview($input: CreateReviewInput!) {
  createReview(input: $input) {
    id
  }
}
```

```json
{
  "data": null,
  "errors": [
    {
      "message": "This product requires a verified purchase to review",
      "extensions": {
        "code": "PURCHASE_REQUIRED",
        "productId": "prod_not_purchased"
      },
      "path": ["createReview"]
    }
  ]
}
```

**Example: Invalid Rating**

Rating must be between 1 and 5 stars

```graphql
mutation CreateReview($input: CreateReviewInput!) {
  createReview(input: $input) {
    id
  }
}
```

```json
{
  "data": null,
  "errors": [
    {
      "message": "Rating must be between 1 and 5",
      "extensions": {
        "code": "VALIDATION_ERROR",
        "field": "rating",
        "min": 1,
        "max": 5
      },
      "path": ["createReview"]
    }
  ]
}
```

**Example: Comment Too Short**

Reviews require a minimum comment length to be helpful

```graphql
mutation CreateReview($input: CreateReviewInput!) {
  createReview(input: $input) {
    id
  }
}
```

```json
{
  "data": null,
  "errors": [
    {
      "message": "Review comment must be at least 20 characters",
      "extensions": {
        "code": "VALIDATION_ERROR",
        "field": "comment",
        "minLength": 20,
        "actualLength": 4
      },
      "path": ["createReview"]
    }
  ]
}
```

**Example: Product Not Found**

Cannot review a product that doesn't exist

```graphql
mutation CreateReview($input: CreateReviewInput!) {
  createReview(input: $input) {
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
      "path": ["createReview"]
    }
  ]
}
```

### markReviewHelpful

Mark a review as helpful

**Arguments:**

| Argument   | Type       | Required | Description                                   |
| ---------- | ---------- | -------- | --------------------------------------------- |
| `reviewId` | `UUID!`    | Yes      | Review ID                                     |
| `helpful`  | `Boolean!` | Yes      | Whether helpful (true) or not helpful (false) |

**Returns:** `Review!`

| Field                | Type              | Description                                        |
| -------------------- | ----------------- | -------------------------------------------------- |
| `id`                 | `UUID!`           | Unique identifier                                  |
| `product`            | `Product!`        | The product being reviewed                         |
| `author`             | `User!`           | The user who wrote the review (circular reference) |
| `rating`             | `Int!`            | Rating from 1 to 5                                 |
| `title`              | `String`          | Review title                                       |
| `body`               | `String!`         | Review body text                                   |
| `pros`               | `[String!]`       | Pros mentioned by reviewer                         |
| `cons`               | `[String!]`       | Cons mentioned by reviewer                         |
| `images`             | `[ReviewImage!]`  | Attached images                                    |
| `isVerifiedPurchase` | `Boolean!`        | Whether reviewer is a verified purchaser           |
| `helpfulCount`       | `Int!`            | Number of users who found this helpful             |
| `unhelpfulCount`     | `Int!`            | Number of users who found this unhelpful           |
| `replies`            | `[ReviewReply!]!` | Replies to this review                             |
| `isApproved`         | `Boolean!`        | Whether approved by moderators                     |
| `moderatedAt`        | `DateTime`        | When moderated                                     |
| `moderatedBy`        | `User`            | Who moderated                                      |
| `createdAt`          | `DateTime!`       | When created                                       |
| `updatedAt`          | `DateTime!`       | When last updated                                  |

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
| `seller`                                                                       | `User!`                    | Seller who listed this product                                     |
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
| `wishlist`                                                                                                                                | `[Product!]!`                             | Products in user's wishlist _(see Product above)_                            |
| `cart`                                                                                                                                    | `Cart` _(max depth reached)_              | User's shopping cart                                                         |
| `totalSpent`                                                                                                                              | `Money!`                                  | Total amount spent by this user                                              |
| `orderCount`                                                                                                                              | `Int!`                                    | Number of orders placed                                                      |
| `createdAt`                                                                                                                               | `DateTime!`                               | When the user was created                                                    |
| `updatedAt`                                                                                                                               | `DateTime!`                               | When the user was last updated                                               |
| `deletedAt`                                                                                                                               | `DateTime`                                | When the user was deleted (soft delete)                                      |
| `isDeleted`                                                                                                                               | `Boolean!`                                | Whether the user account is deleted                                          |

**ReviewConnection fields:**

| Field      | Type                                   | Description     |
| ---------- | -------------------------------------- | --------------- |
| `edges`    | `[ReviewEdge!]!` _(max depth reached)_ | The reviews     |
| `pageInfo` | `PageInfo!` _(max depth reached)_      | Pagination info |

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

**ReviewImage fields:**

| Field     | Type      | Description   |
| --------- | --------- | ------------- |
| `url`     | `String!` | Image URL     |
| `caption` | `String`  | Image caption |

**ReviewReply fields:**

| Field              | Type        | Description                                 |
| ------------------ | ----------- | ------------------------------------------- |
| `id`               | `UUID!`     | Unique identifier                           |
| `author`           | `User!`     | Reply author                                |
| `body`             | `String!`   | Reply text                                  |
| `isSellerResponse` | `Boolean!`  | Whether this is an official seller response |
| `createdAt`        | `DateTime!` | When created                                |

**Example: Mark Helpful**

Mark a review as helpful to surface quality reviews

```graphql
mutation MarkHelpful($id: UUID!, $helpful: Boolean!) {
  markReviewHelpful(reviewId: $id, helpful: $helpful) {
    id
    helpfulCount
    notHelpfulCount
    userVote
  }
}
```

```json
{
  "data": {
    "markReviewHelpful": {
      "id": "rev_123",
      "helpfulCount": 43,
      "notHelpfulCount": 2,
      "userVote": "HELPFUL"
    }
  }
}
```

**Example: Mark Not Helpful**

Mark a review as not helpful

```graphql
mutation MarkHelpful($id: UUID!, $helpful: Boolean!) {
  markReviewHelpful(reviewId: $id, helpful: $helpful) {
    id
    helpfulCount
    notHelpfulCount
    userVote
  }
}
```

```json
{
  "data": {
    "markReviewHelpful": {
      "id": "rev_spam",
      "helpfulCount": 1,
      "notHelpfulCount": 15,
      "userVote": "NOT_HELPFUL"
    }
  }
}
```

**Example: Cannot Vote Own Review**

Users cannot vote on their own reviews

```graphql
mutation MarkHelpful($id: UUID!, $helpful: Boolean!) {
  markReviewHelpful(reviewId: $id, helpful: $helpful) {
    id
  }
}
```

```json
{
  "data": null,
  "errors": [
    {
      "message": "You cannot vote on your own review",
      "extensions": {
        "code": "CANNOT_VOTE_OWN_REVIEW"
      },
      "path": ["markReviewHelpful"]
    }
  ]
}
```

**Example: Change Vote**

Users can change their vote from helpful to not helpful or vice versa

```graphql
mutation MarkHelpful($id: UUID!, $helpful: Boolean!) {
  markReviewHelpful(reviewId: $id, helpful: $helpful) {
    id
    helpfulCount
    notHelpfulCount
    userVote
  }
}
```

```json
{
  "data": {
    "markReviewHelpful": {
      "id": "rev_voted",
      "helpfulCount": 41,
      "notHelpfulCount": 3,
      "userVote": "NOT_HELPFUL"
    }
  }
}
```

## Types Reference

### Review

| Field                | Type              | Description                                        |
| -------------------- | ----------------- | -------------------------------------------------- |
| `id`                 | `UUID!`           | Unique identifier                                  |
| `product`            | `Product!`        | The product being reviewed                         |
| `author`             | `User!`           | The user who wrote the review (circular reference) |
| `rating`             | `Int!`            | Rating from 1 to 5                                 |
| `title`              | `String`          | Review title                                       |
| `body`               | `String!`         | Review body text                                   |
| `pros`               | `[String!]`       | Pros mentioned by reviewer                         |
| `cons`               | `[String!]`       | Cons mentioned by reviewer                         |
| `images`             | `[ReviewImage!]`  | Attached images                                    |
| `isVerifiedPurchase` | `Boolean!`        | Whether reviewer is a verified purchaser           |
| `helpfulCount`       | `Int!`            | Number of users who found this helpful             |
| `unhelpfulCount`     | `Int!`            | Number of users who found this unhelpful           |
| `replies`            | `[ReviewReply!]!` | Replies to this review                             |
| `isApproved`         | `Boolean!`        | Whether approved by moderators                     |
| `moderatedAt`        | `DateTime`        | When moderated                                     |
| `moderatedBy`        | `User`            | Who moderated                                      |
| `createdAt`          | `DateTime!`       | When created                                       |
| `updatedAt`          | `DateTime!`       | When last updated                                  |

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
| `seller`                                                                       | `User!`                    | Seller who listed this product                                     |
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
| `wishlist`                                                                                                                                | `[Product!]!`                             | Products in user's wishlist _(see Product above)_                            |
| `cart`                                                                                                                                    | `Cart` _(max depth reached)_              | User's shopping cart                                                         |
| `totalSpent`                                                                                                                              | `Money!`                                  | Total amount spent by this user                                              |
| `orderCount`                                                                                                                              | `Int!`                                    | Number of orders placed                                                      |
| `createdAt`                                                                                                                               | `DateTime!`                               | When the user was created                                                    |
| `updatedAt`                                                                                                                               | `DateTime!`                               | When the user was last updated                                               |
| `deletedAt`                                                                                                                               | `DateTime`                                | When the user was deleted (soft delete)                                      |
| `isDeleted`                                                                                                                               | `Boolean!`                                | Whether the user account is deleted                                          |

**ReviewConnection fields:**

| Field      | Type                                   | Description     |
| ---------- | -------------------------------------- | --------------- |
| `edges`    | `[ReviewEdge!]!` _(max depth reached)_ | The reviews     |
| `pageInfo` | `PageInfo!` _(max depth reached)_      | Pagination info |

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

**ReviewImage fields:**

| Field     | Type      | Description   |
| --------- | --------- | ------------- |
| `url`     | `String!` | Image URL     |
| `caption` | `String`  | Image caption |

**ReviewReply fields:**

| Field              | Type        | Description                                 |
| ------------------ | ----------- | ------------------------------------------- |
| `id`               | `UUID!`     | Unique identifier                           |
| `author`           | `User!`     | Reply author                                |
| `body`             | `String!`   | Reply text                                  |
| `isSellerResponse` | `Boolean!`  | Whether this is an official seller response |
| `createdAt`        | `DateTime!` | When created                                |
