export const orderTypeDefs = `#graphql
  type Order {
    id: ID!
    orderNumber: String
    customerId: String!
    customerEmail: String
    sellerId: String
    items: [OrderItem!]!
    subtotal: Float
    tax: Float
    shipping: Float
    discount: Float
    couponCode: String
    total: Float
    orderStatus: String!
    paymentStatus: String
    paymentMethod: String
    shippingAddress: Address
    notes: String
    createdAt: String
    updatedAt: String
  }

  type OrderItem {
    productId: String!
    productName: String
    quantity: Int
    price: Float
    sellerId: String
    subtotal: Float
  }

  type Address {
    name: String
    mobile: String
    email: String
    street: String
    city: String
    state: String
    zip: String
    country: String
  }

  enum OrderStatus {
    PENDING
    CONFIRMED
    PROCESSING
    SHIPPED
    DELIVERED
    CANCELLED
  }

  enum PaymentStatus {
    PENDING
    PROCESSING
    PAID
    COMPLETED
    FAILED
    REFUNDED
    PARTIALLY_REFUNDED
  }

  type OrderConnection {
    orders: [Order!]!
    pagination: Pagination!
  }

  input CreateOrderInput {
    customerId: String!
    customerEmail: String!
    items: [OrderItemInput!]!
    subtotal: Float!
    tax: Float
    shipping: Float
    discount: Float
    couponCode: String
    total: Float!
    paymentMethod: String!
    shippingAddress: AddressInput!
    notes: String
  }

  input OrderItemInput {
    productId: String!
    productName: String
    quantity: Int!
    price: Float!
    sellerId: String
    subtotal: Float!
  }

  input AddressInput {
    name: String
    mobile: String
    email: String
    street: String!
    city: String!
    state: String!
    zip: String!
    country: String!
  }

  type SellerStats {
    totalRevenue: Float!
    totalOrders: Int!
    pendingOrders: Int!
    completedOrders: Int!
    processingOrders: Int!
    completionRate: Float!
    avgOrderValue: Float!
    successRate: Float!
  }

  extend type Query {
    orders(page: Int, limit: Int, customerId: String): OrderConnection!
    order(id: ID!): Order
    ordersByCustomer(customerId: String!): [Order!]!
    sellerStats(sellerId: String!): SellerStats!
  }

  type CreateOrderResult {
    order: Order
    orders: [Order!]!
    orderCount: Int!
  }

  extend type Mutation {
    createOrder(input: CreateOrderInput!): CreateOrderResult!
    updateOrderStatus(id: ID!, status: OrderStatus!): Order!
    updatePaymentStatus(id: ID!, status: PaymentStatus!): Order!
    cancelOrder(id: ID!): Order!
  }
`;
