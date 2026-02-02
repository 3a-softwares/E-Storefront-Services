export const couponTypeDefs = `#graphql
  type Coupon {
    id: ID!
    code: String!
    description: String
    discountType: String!
    discount: Float!
    minPurchase: Float
    maxDiscount: Float
    validFrom: String!
    validTo: String!
    usageLimit: Int
    usageCount: Int
    isActive: Boolean!
    createdAt: String
    updatedAt: String
  }

  type CouponConnection {
    coupons: [Coupon!]!
    pagination: Pagination!
  }

  type CouponValidation {
    valid: Boolean!
    discount: Float
    discountValue: Float
    finalTotal: Float
    discountType: String
    message: String
    code: String
  }

  input CreateCouponInput {
    code: String!
    description: String!
    discountType: String!
    discount: Float!
    minPurchase: Float
    maxDiscount: Float
    validFrom: String!
    validTo: String!
    usageLimit: Int
  }

  input UpdateCouponInput {
    code: String
    description: String
    discountType: String
    discount: Float
    minPurchase: Float
    maxDiscount: Float
    validFrom: String
    validTo: String
    usageLimit: Int
    isActive: Boolean
  }

  extend type Query {
    coupons(page: Int, limit: Int, search: String, isActive: Boolean): CouponConnection!
    coupon(id: ID!): Coupon
    validateCoupon(code: String!, orderTotal: Float!): CouponValidation!
  }

  extend type Mutation {
    createCoupon(input: CreateCouponInput!): Coupon!
    updateCoupon(id: ID!, input: UpdateCouponInput!): Coupon!
    deleteCoupon(id: ID!): Boolean!
  }
`;
