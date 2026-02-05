# Product Catalog

> Part of [GraphQL API](./index.md) GraphQL API

---

## Queries

### Categories

#### category

Get a category by ID or slug

**Arguments:**

| Argument | Type     | Required | Description   |
| -------- | -------- | -------- | ------------- |
| `id`     | `UUID`   | No       | Category ID   |
| `slug`   | `String` | No       | Category slug |

**Returns:** `Category`

| Field          | Type                 | Description                                                                             |
| -------------- | -------------------- | --------------------------------------------------------------------------------------- |
| `id`           | `UUID!`              | Unique identifier                                                                       |
| `slug`         | `String!`            | URL-friendly slug                                                                       |
| `name`         | `String!`            | Category name                                                                           |
| `description`  | `String`             | Category description                                                                    |
| `imageUrl`     | `String`             | Category image URL                                                                      |
| `parent`       | `Category`           | Parent category (for hierarchy) _(see Category above)_                                  |
| `children`     | `[Category!]!`       | Child categories _(see Category above)_                                                 |
| `breadcrumb`   | `[Category!]!`       | Full path from root (e.g., "Electronics > Phones > Smartphones") _(see Category above)_ |
| `products`     | `ProductConnection!` | Products in this category (circular reference with Product.category)                    |
| `productCount` | `Int!`               | Total number of products in this category (including subcategories)                     |
| `createdAt`    | `DateTime!`          | When created                                                                            |
| `updatedAt`    | `DateTime!`          | When last updated                                                                       |

**ProductConnection fields:**

| Field      | Type              | Description     |
| ---------- | ----------------- | --------------- |
| `edges`    | `[ProductEdge!]!` | The products    |
| `pageInfo` | `PageInfo!`       | Pagination info |

**ProductEdge fields:**

| Field    | Type                             | Description       |
| -------- | -------------------------------- | ----------------- |
| `node`   | `Product!` _(max depth reached)_ | The product       |
| `cursor` | `String!`                        | Pagination cursor |

**PageInfo fields:**

| Field             | Type       | Description                         |
| ----------------- | ---------- | ----------------------------------- |
| `hasNextPage`     | `Boolean!` | Whether there are more items after  |
| `hasPreviousPage` | `Boolean!` | Whether there are more items before |
| `startCursor`     | `String`   | Cursor of the first item            |
| `endCursor`       | `String`   | Cursor of the last item             |
| `totalCount`      | `Int!`     | Total count of items                |

#### categories

List all top-level categories

**Returns:** `[Category!]!`

| Field          | Type                 | Description                                                                             |
| -------------- | -------------------- | --------------------------------------------------------------------------------------- |
| `id`           | `UUID!`              | Unique identifier                                                                       |
| `slug`         | `String!`            | URL-friendly slug                                                                       |
| `name`         | `String!`            | Category name                                                                           |
| `description`  | `String`             | Category description                                                                    |
| `imageUrl`     | `String`             | Category image URL                                                                      |
| `parent`       | `Category`           | Parent category (for hierarchy) _(see Category above)_                                  |
| `children`     | `[Category!]!`       | Child categories _(see Category above)_                                                 |
| `breadcrumb`   | `[Category!]!`       | Full path from root (e.g., "Electronics > Phones > Smartphones") _(see Category above)_ |
| `products`     | `ProductConnection!` | Products in this category (circular reference with Product.category)                    |
| `productCount` | `Int!`               | Total number of products in this category (including subcategories)                     |
| `createdAt`    | `DateTime!`          | When created                                                                            |
| `updatedAt`    | `DateTime!`          | When last updated                                                                       |

**ProductConnection fields:**

| Field      | Type              | Description     |
| ---------- | ----------------- | --------------- |
| `edges`    | `[ProductEdge!]!` | The products    |
| `pageInfo` | `PageInfo!`       | Pagination info |

**ProductEdge fields:**

| Field    | Type                             | Description       |
| -------- | -------------------------------- | ----------------- |
| `node`   | `Product!` _(max depth reached)_ | The product       |
| `cursor` | `String!`                        | Pagination cursor |

**PageInfo fields:**

| Field             | Type       | Description                         |
| ----------------- | ---------- | ----------------------------------- |
| `hasNextPage`     | `Boolean!` | Whether there are more items after  |
| `hasPreviousPage` | `Boolean!` | Whether there are more items before |
| `startCursor`     | `String`   | Cursor of the first item            |
| `endCursor`       | `String`   | Cursor of the last item             |
| `totalCount`      | `Int!`     | Total count of items                |

**Example: List Root Categories**

Get all top-level categories

```graphql
query GetCategories {
  categories(parentId: null) {
    id
    name
    slug
    productCount
    children {
      id
      name
    }
  }
}
```

```json
{
  "data": {
    "categories": [
      {
        "id": "cat_electronics",
        "name": "Electronics",
        "slug": "electronics",
        "productCount": 156,
        "children": [
          {
            "id": "cat_phones",
            "name": "Phones"
          },
          {
            "id": "cat_audio",
            "name": "Audio"
          }
        ]
      },
      {
        "id": "cat_apparel",
        "name": "Apparel",
        "slug": "apparel",
        "productCount": 89,
        "children": [
          {
            "id": "cat_mens",
            "name": "Men's"
          },
          {
            "id": "cat_womens",
            "name": "Women's"
          }
        ]
      }
    ]
  }
}
```

**Example: Get Subcategories**

Get child categories of a specific parent

```graphql
query GetCategories($parentId: UUID!) {
  categories(parentId: $parentId) {
    id
    name
    productCount
  }
}
```

```json
{
  "data": {
    "categories": [
      {
        "id": "cat_phones",
        "name": "Phones",
        "productCount": 45
      },
      {
        "id": "cat_audio",
        "name": "Audio",
        "productCount": 32
      },
      {
        "id": "cat_computers",
        "name": "Computers",
        "productCount": 28
      }
    ]
  }
}
```

### product

Get a product by ID or slug

**Arguments:**

| Argument | Type     | Required | Description  |
| -------- | -------- | -------- | ------------ |
| `id`     | `UUID`   | No       | Product ID   |
| `slug`   | `String` | No       | Product slug |

**Returns:** `Product`

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

| Field          | Type                 | Description                                                                             |
| -------------- | -------------------- | --------------------------------------------------------------------------------------- |
| `id`           | `UUID!`              | Unique identifier                                                                       |
| `slug`         | `String!`            | URL-friendly slug                                                                       |
| `name`         | `String!`            | Category name                                                                           |
| `description`  | `String`             | Category description                                                                    |
| `imageUrl`     | `String`             | Category image URL                                                                      |
| `parent`       | `Category`           | Parent category (for hierarchy) _(see Category above)_                                  |
| `children`     | `[Category!]!`       | Child categories _(see Category above)_                                                 |
| `breadcrumb`   | `[Category!]!`       | Full path from root (e.g., "Electronics > Phones > Smartphones") _(see Category above)_ |
| `products`     | `ProductConnection!` | Products in this category (circular reference with Product.category)                    |
| `productCount` | `Int!`               | Total number of products in this category (including subcategories)                     |
| `createdAt`    | `DateTime!`          | When created                                                                            |
| `updatedAt`    | `DateTime!`          | When last updated                                                                       |

**ProductConnection fields:**

| Field      | Type                                    | Description     |
| ---------- | --------------------------------------- | --------------- |
| `edges`    | `[ProductEdge!]!` _(max depth reached)_ | The products    |
| `pageInfo` | `PageInfo!` _(max depth reached)_       | Pagination info |

**ProductVariant fields:**

| Field         | Type                | Description                                                       |
| ------------- | ------------------- | ----------------------------------------------------------------- |
| `id`          | `UUID!`             | Unique identifier                                                 |
| `sku`         | `String!`           | SKU (Stock Keeping Unit)                                          |
| `name`        | `String!`           | Variant name (e.g., "Large / Blue")                               |
| `price`       | `Money`             | Variant-specific price (if different from base)                   |
| `options`     | `[VariantOption!]!` | Variant options (size, color, etc.)                               |
| `inventory`   | `InventoryInfo!`    | Inventory information - contains warehouse details (deep nesting) |
| `weightGrams` | `Int`               | Weight in grams (for shipping calculation)                        |
| `isAvailable` | `Boolean!`          | Whether this variant is available for purchase                    |

**VariantOption fields:**

| Field   | Type      | Description                  |
| ------- | --------- | ---------------------------- |
| `name`  | `String!` | Option name (e.g., "Size")   |
| `value` | `String!` | Option value (e.g., "Large") |

**InventoryInfo fields:**

| Field               | Type                                       | Description                                     |
| ------------------- | ------------------------------------------ | ----------------------------------------------- |
| `totalQuantity`     | `Int!`                                     | Total quantity across all warehouses            |
| `availableQuantity` | `Int!`                                     | Quantity available for sale (excludes reserved) |
| `reservedQuantity`  | `Int!`                                     | Quantity reserved in carts                      |
| `warehouseStock`    | `[WarehouseStock!]!` _(max depth reached)_ | Per-warehouse breakdown                         |
| `allowBackorder`    | `Boolean!`                                 | Whether to allow backorders                     |
| `restockThreshold`  | `Int`                                      | Restock threshold for alerts                    |

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
| `wishlist`                                                                                                                                | `[Product!]!`       | Products in user's wishlist _(see Product above)_                            |
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

**Example: Get Product by ID**

Retrieve a single product with all its details

```graphql
query GetProduct($id: UUID!) {
  product(id: $id) {
    id
    name
    description
    price
    compareAtPrice
    status
    inventory {
      quantity
      isAvailable
    }
    images {
      url
      alt
    }
  }
}
```

```json
{
  "data": {
    "product": {
      "id": "prod_123",
      "name": "Wireless Headphones",
      "description": "High quality noise-cancelling headphones with 30-hour battery life",
      "price": "199.99",
      "compareAtPrice": "249.99",
      "status": "ACTIVE",
      "inventory": {
        "quantity": 150,
        "isAvailable": true
      },
      "images": [
        {
          "url": "https://cdn.example.com/products/headphones-1.jpg",
          "alt": "Wireless Headphones - Black"
        }
      ]
    }
  }
}
```

**Example: Product Not Found**

When a product ID doesn't exist or has been deleted

```graphql
query GetProduct($id: UUID!) {
  product(id: $id) {
    id
    name
  }
}
```

```json
{
  "data": {
    "product": null
  },
  "errors": [
    {
      "message": "Product not found",
      "extensions": {
        "code": "NOT_FOUND",
        "resourceType": "Product"
      },
      "path": ["product"]
    }
  ]
}
```

**Example: Get Product by Slug**

Products can also be retrieved by their URL-friendly slug

```graphql
query GetProduct($slug: String!) {
  product(slug: $slug) {
    id
    name
    slug
    price
  }
}
```

```json
{
  "data": {
    "product": {
      "id": "prod_123",
      "name": "Wireless Headphones Pro",
      "slug": "wireless-headphones-pro",
      "price": "199.99"
    }
  }
}
```

### products

List products with filtering and pagination

**Arguments:**

| Argument        | Type                 | Required | Default      | Description       |
| --------------- | -------------------- | -------- | ------------ | ----------------- |
| `filter`        | `ProductFilterInput` | No       | —            | Filter options    |
| `sortBy`        | `ProductSortField`   | No       | `CREATED_AT` | Sort field        |
| `sortDirection` | `SortDirection`      | No       | `DESC`       | Sort direction    |
| `first`         | `Int`                | No       | `20`         | Number of results |
| `after`         | `String`             | No       | —            | Pagination cursor |

**Returns:** `ProductConnection!`

| Field      | Type              | Description     |
| ---------- | ----------------- | --------------- |
| `edges`    | `[ProductEdge!]!` | The products    |
| `pageInfo` | `PageInfo!`       | Pagination info |

**ProductEdge fields:**

| Field    | Type       | Description       |
| -------- | ---------- | ----------------- |
| `node`   | `Product!` | The product       |
| `cursor` | `String!`  | Pagination cursor |

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

**PageInfo fields:**

| Field             | Type       | Description                         |
| ----------------- | ---------- | ----------------------------------- |
| `hasNextPage`     | `Boolean!` | Whether there are more items after  |
| `hasPreviousPage` | `Boolean!` | Whether there are more items before |
| `startCursor`     | `String`   | Cursor of the first item            |
| `endCursor`       | `String`   | Cursor of the last item             |
| `totalCount`      | `Int!`     | Total count of items                |

**Example: List All Products**

Get a paginated list of all active products

```graphql
query ListProducts($first: Int, $after: String) {
  products(first: $first, after: $after) {
    edges {
      node {
        id
        name
        price
        status
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    totalCount
  }
}
```

```json
{
  "data": {
    "products": {
      "edges": [
        {
          "node": {
            "id": "prod_001",
            "name": "Wireless Headphones",
            "price": "199.99",
            "status": "ACTIVE"
          },
          "cursor": "cursor_001"
        },
        {
          "node": {
            "id": "prod_002",
            "name": "Bluetooth Speaker",
            "price": "79.99",
            "status": "ACTIVE"
          },
          "cursor": "cursor_002"
        }
      ],
      "pageInfo": {
        "hasNextPage": true,
        "endCursor": "cursor_002"
      },
      "totalCount": 156
    }
  }
}
```

**Example: Filter by Category**

Get products in a specific category

```graphql
query ListProducts($first: Int, $categoryId: UUID!) {
  products(first: $first, filter: { categoryId: $categoryId }) {
    edges {
      node {
        id
        name
        price
        category {
          name
        }
      }
    }
    totalCount
  }
}
```

```json
{
  "data": {
    "products": {
      "edges": [
        {
          "node": {
            "id": "prod_001",
            "name": "Wireless Headphones",
            "price": "199.99",
            "category": {
              "name": "Electronics"
            }
          }
        }
      ],
      "totalCount": 45
    }
  }
}
```

### Search

#### search

Search across products, users, and categories

Returns a union type that can be Product, User, or Category.

**Arguments:**

| Argument | Type      | Required | Default | Description     |
| -------- | --------- | -------- | ------- | --------------- |
| `query`  | `String!` | Yes      | —       | Search query    |
| `limit`  | `Int`     | No       | `20`    | Maximum results |

**Returns:** `[SearchResult!]!`

| Type      | Description                      |
| --------- | -------------------------------- |
| `Product` | A product available for purchase |

Products belong to categories and can have multiple variants (size, color, etc.).
Each product tracks inventory and pricing information. |
| `User` | A registered user of the platform

Users can be customers, sellers, or administrators. Each user has a profile,
can place orders, write reviews, and manage their wishlist.

**Circular Reference:** User -> Order -> User (orderBy)
**Circular Reference:** User -> Review -> User (author) |
| `Category` | Product category with hierarchical structure

Categories form a tree structure and contain products.
**Circular Reference:** Category -> Product -> Category |

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

## Mutations

### createProduct

Create a new product listing (seller only)

**Arguments:**

| Argument | Type                  | Required | Description  |
| -------- | --------------------- | -------- | ------------ |
| `input`  | `CreateProductInput!` | Yes      | Product data |

**Returns:** `Product!`

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

| Field          | Type                 | Description                                                                             |
| -------------- | -------------------- | --------------------------------------------------------------------------------------- |
| `id`           | `UUID!`              | Unique identifier                                                                       |
| `slug`         | `String!`            | URL-friendly slug                                                                       |
| `name`         | `String!`            | Category name                                                                           |
| `description`  | `String`             | Category description                                                                    |
| `imageUrl`     | `String`             | Category image URL                                                                      |
| `parent`       | `Category`           | Parent category (for hierarchy) _(see Category above)_                                  |
| `children`     | `[Category!]!`       | Child categories _(see Category above)_                                                 |
| `breadcrumb`   | `[Category!]!`       | Full path from root (e.g., "Electronics > Phones > Smartphones") _(see Category above)_ |
| `products`     | `ProductConnection!` | Products in this category (circular reference with Product.category)                    |
| `productCount` | `Int!`               | Total number of products in this category (including subcategories)                     |
| `createdAt`    | `DateTime!`          | When created                                                                            |
| `updatedAt`    | `DateTime!`          | When last updated                                                                       |

**ProductConnection fields:**

| Field      | Type                                    | Description     |
| ---------- | --------------------------------------- | --------------- |
| `edges`    | `[ProductEdge!]!` _(max depth reached)_ | The products    |
| `pageInfo` | `PageInfo!` _(max depth reached)_       | Pagination info |

**ProductVariant fields:**

| Field         | Type                | Description                                                       |
| ------------- | ------------------- | ----------------------------------------------------------------- |
| `id`          | `UUID!`             | Unique identifier                                                 |
| `sku`         | `String!`           | SKU (Stock Keeping Unit)                                          |
| `name`        | `String!`           | Variant name (e.g., "Large / Blue")                               |
| `price`       | `Money`             | Variant-specific price (if different from base)                   |
| `options`     | `[VariantOption!]!` | Variant options (size, color, etc.)                               |
| `inventory`   | `InventoryInfo!`    | Inventory information - contains warehouse details (deep nesting) |
| `weightGrams` | `Int`               | Weight in grams (for shipping calculation)                        |
| `isAvailable` | `Boolean!`          | Whether this variant is available for purchase                    |

**VariantOption fields:**

| Field   | Type      | Description                  |
| ------- | --------- | ---------------------------- |
| `name`  | `String!` | Option name (e.g., "Size")   |
| `value` | `String!` | Option value (e.g., "Large") |

**InventoryInfo fields:**

| Field               | Type                                       | Description                                     |
| ------------------- | ------------------------------------------ | ----------------------------------------------- |
| `totalQuantity`     | `Int!`                                     | Total quantity across all warehouses            |
| `availableQuantity` | `Int!`                                     | Quantity available for sale (excludes reserved) |
| `reservedQuantity`  | `Int!`                                     | Quantity reserved in carts                      |
| `warehouseStock`    | `[WarehouseStock!]!` _(max depth reached)_ | Per-warehouse breakdown                         |
| `allowBackorder`    | `Boolean!`                                 | Whether to allow backorders                     |
| `restockThreshold`  | `Int`                                      | Restock threshold for alerts                    |

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
| `wishlist`                                                                                                                                | `[Product!]!`       | Products in user's wishlist _(see Product above)_                            |
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

**Example: Create Basic Product**

Create a new product with required fields

```graphql
mutation CreateProduct($input: CreateProductInput!) {
  createProduct(input: $input) {
    id
    name
    slug
    price
    status
  }
}
```

```json
{
  "data": {
    "createProduct": {
      "id": "prod_new_123",
      "name": "Wireless Headphones",
      "slug": "wireless-headphones",
      "price": "199.99",
      "status": "DRAFT"
    }
  }
}
```

**Example: Create with Variants**

Create a product with multiple variants (sizes, colors, etc.)

```graphql
mutation CreateProduct($input: CreateProductInput!) {
  createProduct(input: $input) {
    id
    name
    variants {
      id
      sku
      options {
        name
        value
      }
      price
    }
  }
}
```

```json
{
  "data": {
    "createProduct": {
      "id": "prod_tshirt_001",
      "name": "Classic T-Shirt",
      "variants": [
        {
          "id": "var_001",
          "sku": "TSHIRT-S-BLK",
          "options": [
            {
              "name": "Size",
              "value": "Small"
            },
            {
              "name": "Color",
              "value": "Black"
            }
          ],
          "price": "29.99"
        },
        {
          "id": "var_002",
          "sku": "TSHIRT-M-BLK",
          "options": [
            {
              "name": "Size",
              "value": "Medium"
            },
            {
              "name": "Color",
              "value": "Black"
            }
          ],
          "price": "29.99"
        }
      ]
    }
  }
}
```

**Example: Duplicate SKU**

SKUs must be unique across all products and variants

```graphql
mutation CreateProduct($input: CreateProductInput!) {
  createProduct(input: $input) {
    id
  }
}
```

```json
{
  "data": null,
  "errors": [
    {
      "message": "A product with this SKU already exists",
      "extensions": {
        "code": "DUPLICATE_SKU",
        "field": "sku",
        "existingSku": "EXISTING-SKU-001"
      },
      "path": ["createProduct"]
    }
  ]
}
```

**Example: Invalid Category**

The category ID must reference an existing category

```graphql
mutation CreateProduct($input: CreateProductInput!) {
  createProduct(input: $input) {
    id
  }
}
```

```json
{
  "data": null,
  "errors": [
    {
      "message": "Category not found",
      "extensions": {
        "code": "INVALID_CATEGORY",
        "field": "categoryId"
      },
      "path": ["createProduct"]
    }
  ]
}
```

**Example: Permission Denied**

Only users with MANAGE_PRODUCTS permission can create products

```graphql
mutation CreateProduct($input: CreateProductInput!) {
  createProduct(input: $input) {
    id
  }
}
```

```json
{
  "data": null,
  "errors": [
    {
      "message": "You don't have permission to create products",
      "extensions": {
        "code": "FORBIDDEN",
        "requiredPermission": "MANAGE_PRODUCTS"
      },
      "path": ["createProduct"]
    }
  ]
}
```

### updateProduct

Update an existing product (seller only)

**Arguments:**

| Argument | Type                  | Required | Description            |
| -------- | --------------------- | -------- | ---------------------- |
| `id`     | `UUID!`               | Yes      | Product ID             |
| `input`  | `UpdateProductInput!` | Yes      | Product data to update |

**Returns:** `Product!`

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

| Field          | Type                 | Description                                                                             |
| -------------- | -------------------- | --------------------------------------------------------------------------------------- |
| `id`           | `UUID!`              | Unique identifier                                                                       |
| `slug`         | `String!`            | URL-friendly slug                                                                       |
| `name`         | `String!`            | Category name                                                                           |
| `description`  | `String`             | Category description                                                                    |
| `imageUrl`     | `String`             | Category image URL                                                                      |
| `parent`       | `Category`           | Parent category (for hierarchy) _(see Category above)_                                  |
| `children`     | `[Category!]!`       | Child categories _(see Category above)_                                                 |
| `breadcrumb`   | `[Category!]!`       | Full path from root (e.g., "Electronics > Phones > Smartphones") _(see Category above)_ |
| `products`     | `ProductConnection!` | Products in this category (circular reference with Product.category)                    |
| `productCount` | `Int!`               | Total number of products in this category (including subcategories)                     |
| `createdAt`    | `DateTime!`          | When created                                                                            |
| `updatedAt`    | `DateTime!`          | When last updated                                                                       |

**ProductConnection fields:**

| Field      | Type                                    | Description     |
| ---------- | --------------------------------------- | --------------- |
| `edges`    | `[ProductEdge!]!` _(max depth reached)_ | The products    |
| `pageInfo` | `PageInfo!` _(max depth reached)_       | Pagination info |

**ProductVariant fields:**

| Field         | Type                | Description                                                       |
| ------------- | ------------------- | ----------------------------------------------------------------- |
| `id`          | `UUID!`             | Unique identifier                                                 |
| `sku`         | `String!`           | SKU (Stock Keeping Unit)                                          |
| `name`        | `String!`           | Variant name (e.g., "Large / Blue")                               |
| `price`       | `Money`             | Variant-specific price (if different from base)                   |
| `options`     | `[VariantOption!]!` | Variant options (size, color, etc.)                               |
| `inventory`   | `InventoryInfo!`    | Inventory information - contains warehouse details (deep nesting) |
| `weightGrams` | `Int`               | Weight in grams (for shipping calculation)                        |
| `isAvailable` | `Boolean!`          | Whether this variant is available for purchase                    |

**VariantOption fields:**

| Field   | Type      | Description                  |
| ------- | --------- | ---------------------------- |
| `name`  | `String!` | Option name (e.g., "Size")   |
| `value` | `String!` | Option value (e.g., "Large") |

**InventoryInfo fields:**

| Field               | Type                                       | Description                                     |
| ------------------- | ------------------------------------------ | ----------------------------------------------- |
| `totalQuantity`     | `Int!`                                     | Total quantity across all warehouses            |
| `availableQuantity` | `Int!`                                     | Quantity available for sale (excludes reserved) |
| `reservedQuantity`  | `Int!`                                     | Quantity reserved in carts                      |
| `warehouseStock`    | `[WarehouseStock!]!` _(max depth reached)_ | Per-warehouse breakdown                         |
| `allowBackorder`    | `Boolean!`                                 | Whether to allow backorders                     |
| `restockThreshold`  | `Int`                                      | Restock threshold for alerts                    |

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
| `wishlist`                                                                                                                                | `[Product!]!`       | Products in user's wishlist _(see Product above)_                            |
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

**Example: Update Price**

Update product price and status

```graphql
mutation UpdateProduct($id: UUID!, $input: UpdateProductInput!) {
  updateProduct(id: $id, input: $input) {
    id
    price
    compareAtPrice
    status
    updatedAt
  }
}
```

```json
{
  "data": {
    "updateProduct": {
      "id": "prod_123",
      "price": "149.99",
      "compareAtPrice": "199.99",
      "status": "ACTIVE",
      "updatedAt": "2024-01-21T10:30:00Z"
    }
  }
}
```

**Example: Update Inventory**

Update product stock levels

```graphql
mutation UpdateProduct($id: UUID!, $input: UpdateProductInput!) {
  updateProduct(id: $id, input: $input) {
    id
    inventory {
      quantity
      isAvailable
      lowStockThreshold
    }
  }
}
```

```json
{
  "data": {
    "updateProduct": {
      "id": "prod_123",
      "inventory": {
        "quantity": 50,
        "isAvailable": true,
        "lowStockThreshold": 10
      }
    }
  }
}
```

**Example: Product Not Found**

Attempting to update a non-existent product

```graphql
mutation UpdateProduct($id: UUID!, $input: UpdateProductInput!) {
  updateProduct(id: $id, input: $input) {
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
      "path": ["updateProduct"]
    }
  ]
}
```

**Example: Invalid Price**

Price must be a positive number

```graphql
mutation UpdateProduct($id: UUID!, $input: UpdateProductInput!) {
  updateProduct(id: $id, input: $input) {
    id
  }
}
```

```json
{
  "data": null,
  "errors": [
    {
      "message": "Price must be a positive number",
      "extensions": {
        "code": "VALIDATION_ERROR",
        "field": "price",
        "constraint": "positive"
      },
      "path": ["updateProduct"]
    }
  ]
}
```

### deleteProduct

Delete a product (soft delete)

**Arguments:**

| Argument | Type    | Required | Description |
| -------- | ------- | -------- | ----------- |
| `id`     | `UUID!` | Yes      | Product ID  |

**Returns:** `Boolean!`

**Example: Soft Delete**

Soft delete a product (can be restored later)

```graphql
mutation DeleteProduct($id: UUID!) {
  deleteProduct(id: $id)
}
```

```json
{
  "data": {
    "deleteProduct": true
  }
}
```

**Example: Product with Active Orders**

Products with pending orders cannot be deleted

```graphql
mutation DeleteProduct($id: UUID!) {
  deleteProduct(id: $id)
}
```

```json
{
  "data": null,
  "errors": [
    {
      "message": "Cannot delete product with pending orders",
      "extensions": {
        "code": "PRODUCT_HAS_PENDING_ORDERS",
        "pendingOrderCount": 3,
        "suggestion": "Wait for orders to complete or archive the product instead"
      },
      "path": ["deleteProduct"]
    }
  ]
}
```

**Example: Product Not Found**

Attempting to delete a product that doesn't exist

```graphql
mutation DeleteProduct($id: UUID!) {
  deleteProduct(id: $id)
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
      "path": ["deleteProduct"]
    }
  ]
}
```

## Types Reference

### Category

| Field          | Type                 | Description                                                                             |
| -------------- | -------------------- | --------------------------------------------------------------------------------------- |
| `id`           | `UUID!`              | Unique identifier                                                                       |
| `slug`         | `String!`            | URL-friendly slug                                                                       |
| `name`         | `String!`            | Category name                                                                           |
| `description`  | `String`             | Category description                                                                    |
| `imageUrl`     | `String`             | Category image URL                                                                      |
| `parent`       | `Category`           | Parent category (for hierarchy) _(see Category above)_                                  |
| `children`     | `[Category!]!`       | Child categories _(see Category above)_                                                 |
| `breadcrumb`   | `[Category!]!`       | Full path from root (e.g., "Electronics > Phones > Smartphones") _(see Category above)_ |
| `products`     | `ProductConnection!` | Products in this category (circular reference with Product.category)                    |
| `productCount` | `Int!`               | Total number of products in this category (including subcategories)                     |
| `createdAt`    | `DateTime!`          | When created                                                                            |
| `updatedAt`    | `DateTime!`          | When last updated                                                                       |

**ProductConnection fields:**

| Field      | Type              | Description     |
| ---------- | ----------------- | --------------- |
| `edges`    | `[ProductEdge!]!` | The products    |
| `pageInfo` | `PageInfo!`       | Pagination info |

**ProductEdge fields:**

| Field    | Type                             | Description       |
| -------- | -------------------------------- | ----------------- |
| `node`   | `Product!` _(max depth reached)_ | The product       |
| `cursor` | `String!`                        | Pagination cursor |

**PageInfo fields:**

| Field             | Type       | Description                         |
| ----------------- | ---------- | ----------------------------------- |
| `hasNextPage`     | `Boolean!` | Whether there are more items after  |
| `hasPreviousPage` | `Boolean!` | Whether there are more items before |
| `startCursor`     | `String`   | Cursor of the first item            |
| `endCursor`       | `String`   | Cursor of the last item             |
| `totalCount`      | `Int!`     | Total count of items                |

### Product

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

| Field          | Type                 | Description                                                                             |
| -------------- | -------------------- | --------------------------------------------------------------------------------------- |
| `id`           | `UUID!`              | Unique identifier                                                                       |
| `slug`         | `String!`            | URL-friendly slug                                                                       |
| `name`         | `String!`            | Category name                                                                           |
| `description`  | `String`             | Category description                                                                    |
| `imageUrl`     | `String`             | Category image URL                                                                      |
| `parent`       | `Category`           | Parent category (for hierarchy) _(see Category above)_                                  |
| `children`     | `[Category!]!`       | Child categories _(see Category above)_                                                 |
| `breadcrumb`   | `[Category!]!`       | Full path from root (e.g., "Electronics > Phones > Smartphones") _(see Category above)_ |
| `products`     | `ProductConnection!` | Products in this category (circular reference with Product.category)                    |
| `productCount` | `Int!`               | Total number of products in this category (including subcategories)                     |
| `createdAt`    | `DateTime!`          | When created                                                                            |
| `updatedAt`    | `DateTime!`          | When last updated                                                                       |

**ProductConnection fields:**

| Field      | Type                                    | Description     |
| ---------- | --------------------------------------- | --------------- |
| `edges`    | `[ProductEdge!]!` _(max depth reached)_ | The products    |
| `pageInfo` | `PageInfo!` _(max depth reached)_       | Pagination info |

**ProductVariant fields:**

| Field         | Type                | Description                                                       |
| ------------- | ------------------- | ----------------------------------------------------------------- |
| `id`          | `UUID!`             | Unique identifier                                                 |
| `sku`         | `String!`           | SKU (Stock Keeping Unit)                                          |
| `name`        | `String!`           | Variant name (e.g., "Large / Blue")                               |
| `price`       | `Money`             | Variant-specific price (if different from base)                   |
| `options`     | `[VariantOption!]!` | Variant options (size, color, etc.)                               |
| `inventory`   | `InventoryInfo!`    | Inventory information - contains warehouse details (deep nesting) |
| `weightGrams` | `Int`               | Weight in grams (for shipping calculation)                        |
| `isAvailable` | `Boolean!`          | Whether this variant is available for purchase                    |

**VariantOption fields:**

| Field   | Type      | Description                  |
| ------- | --------- | ---------------------------- |
| `name`  | `String!` | Option name (e.g., "Size")   |
| `value` | `String!` | Option value (e.g., "Large") |

**InventoryInfo fields:**

| Field               | Type                                       | Description                                     |
| ------------------- | ------------------------------------------ | ----------------------------------------------- |
| `totalQuantity`     | `Int!`                                     | Total quantity across all warehouses            |
| `availableQuantity` | `Int!`                                     | Quantity available for sale (excludes reserved) |
| `reservedQuantity`  | `Int!`                                     | Quantity reserved in carts                      |
| `warehouseStock`    | `[WarehouseStock!]!` _(max depth reached)_ | Per-warehouse breakdown                         |
| `allowBackorder`    | `Boolean!`                                 | Whether to allow backorders                     |
| `restockThreshold`  | `Int`                                      | Restock threshold for alerts                    |

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
| `wishlist`                                                                                                                                | `[Product!]!`       | Products in user's wishlist _(see Product above)_                            |
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
