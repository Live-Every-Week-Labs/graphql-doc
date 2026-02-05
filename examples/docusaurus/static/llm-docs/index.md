# GraphQL API - GraphQL API Reference

> LLM-optimized documentation. Human-readable docs: http://localhost:3000

**Operations:** 26 (12 queries, 12 mutations, 2 subscriptions)  
**Groups:** User Management, Product Catalog, Orders & Checkout, Reviews & Ratings, Notifications

---

## Quick Reference

### Queries

| Operation                                    | Group             | Description                          |
| -------------------------------------------- | ----------------- | ------------------------------------ |
| `cart: Cart`                                 | Orders & Checkout | Get the current user's cart          |
| `categories: [Category!]!`                   | Product Catalog   | List all top-level categories        |
| `category(id: UUID, slug: String): Category` | Product Catalog   | Get a category by ID or slug         |
| `me: User`                                   | User Management   | Get the currently authenticated user |

Returns null if not authenticated. |
| `myOrders(filter: OrderFilterInput, sortDirection: SortDirection, first: Int, after: String): OrderConnection!` | Orders & Checkout | List orders for the current user |
| `order(id: UUID!): Order` | Orders & Checkout | Get an order by ID |
| `product(id: UUID, slug: String): Product` | Product Catalog | Get a product by ID or slug |
| `products(filter: ProductFilterInput, sortBy: ProductSortField, sortDirection: SortDirection, first: Int, after: String): ProductConnection!` | Product Catalog | List products with filtering and pagination |
| `review(id: UUID!): Review` | Reviews & Ratings | Get a review by ID |
| `search(query: String!, limit: Int): [SearchResult!]!` | Product Catalog | Search across products, users, and categories

Returns a union type that can be Product, User, or Category. |
| `user(id: UUID!): User` | User Management | Get a user by their ID |
| `users(query: String, role: UserRole, status: UserStatus, first: Int, after: String): [User!]!` | User Management | Search for users (admin only) |

### Mutations

| Operation                                                        | Group             | Description                                |
| ---------------------------------------------------------------- | ----------------- | ------------------------------------------ |
| `addAddress(input: AddressInput!): LabeledAddress!`              | User Management   | Add an address to the user's address book  |
| `addToCart(input: AddToCartInput!): Cart!`                       | Orders & Checkout | Add an item to the shopping cart           |
| `createProduct(input: CreateProductInput!): Product!`            | Product Catalog   | Create a new product listing (seller only) |
| `createReview(input: CreateReviewInput!): Review!`               | Reviews & Ratings | Create a review for a product              |
| `createUser(input: CreateUserInput!): User!`                     | User Management   | Register a new user account                |
| `deleteProduct(id: UUID!): Boolean!`                             | Product Catalog   | Delete a product (soft delete)             |
| `markReviewHelpful(reviewId: UUID!, helpful: Boolean!): Review!` | Reviews & Ratings | Mark a review as helpful                   |
| `placeOrder(input: PlaceOrderInput!): CheckoutResult!`           | Orders & Checkout | Place an order from the current cart       |

Returns either an Order on success, CheckoutError on failure,
or PaymentPending if payment is still processing. |
| `removeFromCart(cartItemId: UUID!): Cart!` | Orders & Checkout | Remove an item from the cart |
| `updateCartItem(input: UpdateCartItemInput!): Cart!` | Orders & Checkout | Update quantity of a cart item |
| `updateProduct(id: UUID!, input: UpdateProductInput!): Product!` | Product Catalog | Update an existing product (seller only) |
| `updateProfile(input: UserProfileInput!): User!` | User Management | Update the current user's profile |

### Subscriptions

| Operation                             | Group         | Description                                     |
| ------------------------------------- | ------------- | ----------------------------------------------- |
| `notificationReceived: Notification!` | Notifications | Subscribe to notifications for the current user |

Receives real-time notifications including order updates,
price alerts, stock alerts, and system messages. |
| `orderStatusChanged(orderId: UUID!): Order!` | Orders & Checkout | Subscribe to order status updates

Receives real-time updates when the status of an order changes. |

---

## Documentation Files

For full documentation including type definitions and examples, see:

- [User Management](./user-management.md)
- [Product Catalog](./product-catalog.md)
- [Orders & Checkout](./orders-checkout.md)
- [Reviews & Ratings](./reviews-ratings.md)
- [Notifications](./notifications.md)
