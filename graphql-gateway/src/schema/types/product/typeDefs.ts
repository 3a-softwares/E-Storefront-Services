export const productTypeDefs = `#graphql
  type Seller {
    id: ID!
    name: String!
    email: String
  }

  type Product {
    id: ID!
    name: String!
    description: String!
    price: Float!
    category: String!
    stock: Int!
    imageUrl: String
    sellerId: String!
    seller: Seller
    isActive: Boolean!
    tags: [String!]!
    rating: Float!
    reviewCount: Int!
    createdAt: String!
    updatedAt: String!
  }

  type ProductConnection {
    products: [Product!]!
    pagination: Pagination!
  }

  input CreateProductInput {
    name: String!
    description: String!
    price: Float!
    category: String!
    stock: Int!
    imageUrl: String
    sellerId: String!
    tags: [String!]
  }

  input UpdateProductInput {
    name: String
    description: String
    price: Float
    category: String
    stock: Int
    imageUrl: String
    sellerId: String
    tags: [String!]
    isActive: Boolean
  }

  extend type Query {
    products(
      page: Int
      limit: Int
      search: String
      category: String
      minPrice: Float
      maxPrice: Float
      sortBy: String
      sortOrder: String
      featured: Boolean
      includeInactive: Boolean
    ): ProductConnection!
    
    product(id: ID!): Product
    
    productsBySeller(sellerId: String!): [Product!]!
}

  extend type Mutation {
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
  }
`;
