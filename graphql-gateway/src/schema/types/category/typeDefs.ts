export const categoryTypeDefs = `#graphql
  type Category {
    id: ID!
    name: String!
    description: String
    icon: String
    slug: String!
    isActive: Boolean!
    productCount: Int!
    createdAt: String!
    updatedAt: String!
  }

  input CategoryInput {
    name: String!
    description: String
    icon: String
  }

  input CategoryFilterInput {
    isActive: Boolean
    search: String
  }

  type CategoryResponse {
    success: Boolean!
    message: String
    data: Category
  }

  type CategoriesResponse {
    success: Boolean!
    message: String
    data: [Category!]!
    count: Int!
  }

  extend type Query {
    categories(filter: CategoryFilterInput): CategoriesResponse!
    category(id: String!): Category
  }

  extend type Mutation {
    createCategory(input: CategoryInput!): CategoryResponse!
    updateCategory(id: ID!, input: CategoryInput!): CategoryResponse!
    deleteCategory(id: ID!): CategoryResponse!
  }
`;
