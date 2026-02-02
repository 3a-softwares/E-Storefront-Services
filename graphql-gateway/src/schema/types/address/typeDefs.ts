export const addressTypeDefs = `#graphql
  type Address {
    id: ID!
    userId: ID!
    name: String
    mobile: String
    email: String
    street: String
    city: String
    state: String
    zip: String
    country: String
    isDefault: Boolean
    label: String
    createdAt: String
    updatedAt: String
  }

  type AddressConnection {
    addresses: [Address!]!
  }

  type AddressResponse {
    success: Boolean!
    message: String
    address: Address
  }

  type DeleteAddressResponse {
    success: Boolean!
    message: String
  }

  input AddAddressInput {
    name: String!
    mobile: String!
    email: String
    street: String!
    city: String!
    state: String!
    zip: String!
    country: String!
    isDefault: Boolean
    label: String
  }

  input UpdateAddressInput {
    name: String
    mobile: String
    email: String
    street: String
    city: String
    state: String
    zip: String
    country: String
    isDefault: Boolean
    label: String
  }

  extend type Query {
    myAddresses: AddressConnection!
  }

  extend type Mutation {
    addAddress(input: AddAddressInput!): AddressResponse!
    updateAddress(id: ID!, input: UpdateAddressInput!): AddressResponse!
    deleteAddress(id: ID!): DeleteAddressResponse!
    setDefaultAddress(id: ID!): AddressResponse!
  }
`;
