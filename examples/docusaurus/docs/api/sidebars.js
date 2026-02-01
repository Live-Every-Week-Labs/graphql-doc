module.exports = {
  "apiSidebar": [
    {
      "type": "doc",
      "id": "intro/overview",
      "label": "Overview"
    },
    {
      "type": "doc",
      "id": "intro/errors",
      "label": "Errors"
    },
    {
      "type": "html",
      "value": "<hr class=\"gql-sidebar-divider\" />",
      "defaultStyle": true
    },
    {
      "type": "html",
      "value": "<div class=\"gql-sidebar-section-title\">Operations</div>",
      "defaultStyle": true
    },
    {
      "type": "category",
      "label": "User Management",
      "items": [
        {
          "type": "category",
          "label": "Mutations",
          "items": [
            {
              "type": "doc",
              "id": "user-management/mutations/create-user",
              "label": "createUser"
            },
            {
              "type": "doc",
              "id": "user-management/mutations/update-profile",
              "label": "updateProfile"
            },
            {
              "type": "doc",
              "id": "user-management/mutations/add-address",
              "label": "addAddress"
            }
          ],
          "collapsible": true,
          "collapsed": true
        },
        {
          "type": "category",
          "label": "Queries",
          "items": [
            {
              "type": "doc",
              "id": "user-management/queries/me",
              "label": "me"
            },
            {
              "type": "doc",
              "id": "user-management/queries/user",
              "label": "user"
            },
            {
              "type": "doc",
              "id": "user-management/queries/users",
              "label": "users"
            }
          ],
          "collapsible": true,
          "collapsed": true
        }
      ],
      "collapsible": true,
      "collapsed": true
    },
    {
      "type": "category",
      "label": "Product Catalog",
      "items": [
        {
          "type": "category",
          "label": "Categories",
          "items": [
            {
              "type": "doc",
              "id": "product-catalog/categories/category",
              "label": "category"
            },
            {
              "type": "doc",
              "id": "product-catalog/categories/categories",
              "label": "categories"
            }
          ],
          "collapsible": true,
          "collapsed": true
        },
        {
          "type": "category",
          "label": "Mutations",
          "items": [
            {
              "type": "doc",
              "id": "product-catalog/mutations/create-product",
              "label": "createProduct"
            },
            {
              "type": "doc",
              "id": "product-catalog/mutations/update-product",
              "label": "updateProduct"
            },
            {
              "type": "doc",
              "id": "product-catalog/mutations/delete-product",
              "label": "deleteProduct"
            }
          ],
          "collapsible": true,
          "collapsed": true
        },
        {
          "type": "category",
          "label": "Queries",
          "items": [
            {
              "type": "doc",
              "id": "product-catalog/queries/product",
              "label": "product"
            },
            {
              "type": "doc",
              "id": "product-catalog/queries/products",
              "label": "products"
            }
          ],
          "collapsible": true,
          "collapsed": true
        },
        {
          "type": "category",
          "label": "Search",
          "items": [
            {
              "type": "doc",
              "id": "product-catalog/search/search",
              "label": "search"
            }
          ],
          "collapsible": true,
          "collapsed": true
        }
      ],
      "collapsible": true,
      "collapsed": true
    },
    {
      "type": "category",
      "label": "Orders & Checkout",
      "items": [
        {
          "type": "category",
          "label": "Cart",
          "items": [
            {
              "type": "doc",
              "id": "orders-checkout/cart/cart",
              "label": "cart"
            },
            {
              "type": "doc",
              "id": "orders-checkout/cart/add-to-cart",
              "label": "addToCart"
            },
            {
              "type": "doc",
              "id": "orders-checkout/cart/update-cart-item",
              "label": "updateCartItem"
            },
            {
              "type": "doc",
              "id": "orders-checkout/cart/remove-from-cart",
              "label": "removeFromCart"
            }
          ],
          "collapsible": true,
          "collapsed": true
        },
        {
          "type": "category",
          "label": "Checkout",
          "items": [
            {
              "type": "doc",
              "id": "orders-checkout/checkout/place-order",
              "label": "placeOrder"
            }
          ],
          "collapsible": true,
          "collapsed": true
        },
        {
          "type": "category",
          "label": "Queries",
          "items": [
            {
              "type": "doc",
              "id": "orders-checkout/queries/order",
              "label": "order"
            },
            {
              "type": "doc",
              "id": "orders-checkout/queries/my-orders",
              "label": "myOrders"
            }
          ],
          "collapsible": true,
          "collapsed": true
        },
        {
          "type": "category",
          "label": "Subscriptions",
          "items": [
            {
              "type": "doc",
              "id": "orders-checkout/subscriptions/order-status-changed",
              "label": "orderStatusChanged"
            }
          ],
          "collapsible": true,
          "collapsed": true
        }
      ],
      "collapsible": true,
      "collapsed": true
    },
    {
      "type": "category",
      "label": "Reviews & Ratings",
      "items": [
        {
          "type": "doc",
          "id": "reviews-ratings/review",
          "label": "review"
        },
        {
          "type": "doc",
          "id": "reviews-ratings/create-review",
          "label": "createReview"
        },
        {
          "type": "doc",
          "id": "reviews-ratings/mark-review-helpful",
          "label": "markReviewHelpful"
        }
      ],
      "collapsible": true,
      "collapsed": true
    },
    {
      "type": "category",
      "label": "Notifications",
      "items": [
        {
          "type": "doc",
          "id": "notifications/notification-received",
          "label": "notificationReceived"
        }
      ],
      "collapsible": true,
      "collapsed": true
    },
    {
      "type": "html",
      "value": "<hr class=\"gql-sidebar-divider\" />",
      "defaultStyle": true
    },
    {
      "type": "html",
      "value": "<div class=\"gql-sidebar-section-title\">Types</div>",
      "defaultStyle": true
    },
    {
      "type": "category",
      "label": "Enums",
      "items": [
        {
          "type": "doc",
          "id": "types/enums/currency",
          "label": "Currency"
        },
        {
          "type": "doc",
          "id": "types/enums/notification-type",
          "label": "NotificationType"
        },
        {
          "type": "doc",
          "id": "types/enums/order-status",
          "label": "OrderStatus"
        },
        {
          "type": "doc",
          "id": "types/enums/payment-method",
          "label": "PaymentMethod"
        },
        {
          "type": "doc",
          "id": "types/enums/product-sort-field",
          "label": "ProductSortField"
        },
        {
          "type": "doc",
          "id": "types/enums/product-status",
          "label": "ProductStatus"
        },
        {
          "type": "doc",
          "id": "types/enums/sort-direction",
          "label": "SortDirection"
        },
        {
          "type": "doc",
          "id": "types/enums/user-role",
          "label": "UserRole"
        },
        {
          "type": "doc",
          "id": "types/enums/user-status",
          "label": "UserStatus"
        }
      ],
      "collapsible": true,
      "collapsed": true
    },
    {
      "type": "category",
      "label": "Inputs",
      "items": [
        {
          "type": "doc",
          "id": "types/inputs/address-input",
          "label": "AddressInput"
        },
        {
          "type": "doc",
          "id": "types/inputs/add-to-cart-input",
          "label": "AddToCartInput"
        },
        {
          "type": "doc",
          "id": "types/inputs/create-product-input",
          "label": "CreateProductInput"
        },
        {
          "type": "doc",
          "id": "types/inputs/create-review-input",
          "label": "CreateReviewInput"
        },
        {
          "type": "doc",
          "id": "types/inputs/create-user-input",
          "label": "CreateUserInput"
        },
        {
          "type": "doc",
          "id": "types/inputs/order-filter-input",
          "label": "OrderFilterInput"
        },
        {
          "type": "doc",
          "id": "types/inputs/order-item-customization-input",
          "label": "OrderItemCustomizationInput"
        },
        {
          "type": "doc",
          "id": "types/inputs/place-order-input",
          "label": "PlaceOrderInput"
        },
        {
          "type": "doc",
          "id": "types/inputs/product-filter-input",
          "label": "ProductFilterInput"
        },
        {
          "type": "doc",
          "id": "types/inputs/product-specification-input",
          "label": "ProductSpecificationInput"
        },
        {
          "type": "doc",
          "id": "types/inputs/product-variant-input",
          "label": "ProductVariantInput"
        },
        {
          "type": "doc",
          "id": "types/inputs/seoinput",
          "label": "SEOInput"
        },
        {
          "type": "doc",
          "id": "types/inputs/update-cart-item-input",
          "label": "UpdateCartItemInput"
        },
        {
          "type": "doc",
          "id": "types/inputs/update-product-input",
          "label": "UpdateProductInput"
        },
        {
          "type": "doc",
          "id": "types/inputs/user-profile-input",
          "label": "UserProfileInput"
        },
        {
          "type": "doc",
          "id": "types/inputs/variant-option-input",
          "label": "VariantOptionInput"
        }
      ],
      "collapsible": true,
      "collapsed": true
    },
    {
      "type": "category",
      "label": "Types",
      "items": [
        {
          "type": "doc",
          "id": "types/types/address",
          "label": "Address"
        },
        {
          "type": "doc",
          "id": "types/types/address-book",
          "label": "AddressBook"
        },
        {
          "type": "doc",
          "id": "types/types/boolean",
          "label": "Boolean"
        },
        {
          "type": "doc",
          "id": "types/types/cart",
          "label": "Cart"
        },
        {
          "type": "doc",
          "id": "types/types/cart-item",
          "label": "CartItem"
        },
        {
          "type": "doc",
          "id": "types/types/category",
          "label": "Category"
        },
        {
          "type": "doc",
          "id": "types/types/checkout-error",
          "label": "CheckoutError"
        },
        {
          "type": "doc",
          "id": "types/types/checkout-result",
          "label": "CheckoutResult"
        },
        {
          "type": "doc",
          "id": "types/types/coupon",
          "label": "Coupon"
        },
        {
          "type": "doc",
          "id": "types/types/date-time",
          "label": "DateTime"
        },
        {
          "type": "doc",
          "id": "types/types/float",
          "label": "Float"
        },
        {
          "type": "doc",
          "id": "types/types/int",
          "label": "Int"
        },
        {
          "type": "doc",
          "id": "types/types/inventory-info",
          "label": "InventoryInfo"
        },
        {
          "type": "doc",
          "id": "types/types/labeled-address",
          "label": "LabeledAddress"
        },
        {
          "type": "doc",
          "id": "types/types/moderatable",
          "label": "Moderatable"
        },
        {
          "type": "doc",
          "id": "types/types/money",
          "label": "Money"
        },
        {
          "type": "doc",
          "id": "types/types/notification",
          "label": "Notification"
        },
        {
          "type": "doc",
          "id": "types/types/notification-target",
          "label": "NotificationTarget"
        },
        {
          "type": "doc",
          "id": "types/types/order",
          "label": "Order"
        },
        {
          "type": "doc",
          "id": "types/types/order-connection",
          "label": "OrderConnection"
        },
        {
          "type": "doc",
          "id": "types/types/order-edge",
          "label": "OrderEdge"
        },
        {
          "type": "doc",
          "id": "types/types/order-event",
          "label": "OrderEvent"
        },
        {
          "type": "doc",
          "id": "types/types/order-item",
          "label": "OrderItem"
        },
        {
          "type": "doc",
          "id": "types/types/order-item-customization",
          "label": "OrderItemCustomization"
        },
        {
          "type": "doc",
          "id": "types/types/page-info",
          "label": "PageInfo"
        },
        {
          "type": "doc",
          "id": "types/types/payment-info",
          "label": "PaymentInfo"
        },
        {
          "type": "doc",
          "id": "types/types/payment-pending",
          "label": "PaymentPending"
        },
        {
          "type": "doc",
          "id": "types/types/product",
          "label": "Product"
        },
        {
          "type": "doc",
          "id": "types/types/product-connection",
          "label": "ProductConnection"
        },
        {
          "type": "doc",
          "id": "types/types/product-edge",
          "label": "ProductEdge"
        },
        {
          "type": "doc",
          "id": "types/types/product-image",
          "label": "ProductImage"
        },
        {
          "type": "doc",
          "id": "types/types/product-specification",
          "label": "ProductSpecification"
        },
        {
          "type": "doc",
          "id": "types/types/product-variant",
          "label": "ProductVariant"
        },
        {
          "type": "doc",
          "id": "types/types/region",
          "label": "Region"
        },
        {
          "type": "doc",
          "id": "types/types/review",
          "label": "Review"
        },
        {
          "type": "doc",
          "id": "types/types/review-connection",
          "label": "ReviewConnection"
        },
        {
          "type": "doc",
          "id": "types/types/review-edge",
          "label": "ReviewEdge"
        },
        {
          "type": "doc",
          "id": "types/types/review-image",
          "label": "ReviewImage"
        },
        {
          "type": "doc",
          "id": "types/types/review-reply",
          "label": "ReviewReply"
        },
        {
          "type": "doc",
          "id": "types/types/search-result",
          "label": "SearchResult"
        },
        {
          "type": "doc",
          "id": "types/types/seometadata",
          "label": "SEOMetadata"
        },
        {
          "type": "doc",
          "id": "types/types/shipping-info",
          "label": "ShippingInfo"
        },
        {
          "type": "doc",
          "id": "types/types/shipping-method",
          "label": "ShippingMethod"
        },
        {
          "type": "doc",
          "id": "types/types/soft-deletable",
          "label": "SoftDeletable"
        },
        {
          "type": "doc",
          "id": "types/types/string",
          "label": "String"
        },
        {
          "type": "doc",
          "id": "types/types/timestamped",
          "label": "Timestamped"
        },
        {
          "type": "doc",
          "id": "types/types/user",
          "label": "User"
        },
        {
          "type": "doc",
          "id": "types/types/user-profile",
          "label": "UserProfile"
        },
        {
          "type": "doc",
          "id": "types/types/uuid",
          "label": "UUID"
        },
        {
          "type": "doc",
          "id": "types/types/variant-option",
          "label": "VariantOption"
        },
        {
          "type": "doc",
          "id": "types/types/warehouse",
          "label": "Warehouse"
        },
        {
          "type": "doc",
          "id": "types/types/warehouse-stock",
          "label": "WarehouseStock"
        }
      ],
      "collapsible": true,
      "collapsed": true
    }
  ]
};