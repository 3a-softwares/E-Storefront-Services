export const userTypeDefs = `#graphql
  type User {
    id: ID!
    email: String!
    name: String!
    phone: String
    role: String!
    isActive: Boolean!
    emailVerified: Boolean!
    createdAt: String
    lastLogin: String
    profilePicture: String
  }

  type AuthPayload {
    user: User!
    accessToken: String!
    refreshToken: String!
  }

  type UserAuthPayload {
    user: User!
    accessToken: String!
    refreshToken: String!
    tokenExpiry: Float!
  }

  type UserConnection {
    users: [User!]!
    pagination: UserPagination!
  }

  type UserPagination {
    page: Int!
    limit: Int!
    total: Int!
    pages: Int!
    sellerCount: Int
    adminCount: Int
    customerCount: Int
  }

  type VerificationResponse {
    success: Boolean!
    message: String!
  }

  type VerifyEmailResponse {
    success: Boolean!
    message: String!
    user: User
  }

  type ForgotPasswordResponse {
    success: Boolean!
    message: String!
    resetToken: String
    resetUrl: String
  }

  type ResetPasswordResponse {
    success: Boolean!
    message: String!
  }

  type ValidateTokenResponse {
    success: Boolean!
    message: String!
    email: String
  }

  type ValidateEmailTokenResponse {
    success: Boolean!
    message: String!
    email: String
  }

  type VerifyEmailByTokenResponse {
    success: Boolean!
    message: String!
    user: User
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input RegisterInput {
    email: String!
    password: String!
    name: String!
    role: String
  }

  input UpdateProfileInput {
    name: String
    phone: String
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
  }

  type ChangePasswordResponse {
    success: Boolean!
    message: String
  }

  input GoogleAuthInput {
    idToken: String!
  }

  type UpdateProfileResponse {
    success: Boolean!
    message: String
    user: User
  }

  extend type Query {
    me: User
    users(page: Int, limit: Int, search: String, role: String): UserConnection!
    getUserById(id: ID!): UserAuthPayload
    validateResetToken(token: String!): ValidateTokenResponse!
    validateEmailToken(token: String!): ValidateEmailTokenResponse!
  }

  extend type Mutation {
    login(input: LoginInput!): AuthPayload!
    register(input: RegisterInput!): AuthPayload!
    googleAuth(input: GoogleAuthInput!): AuthPayload!
    logout: Boolean!
    updateProfile(input: UpdateProfileInput!): UpdateProfileResponse!
    changePassword(input: ChangePasswordInput!): ChangePasswordResponse!
    updateUserRole(id: ID!, role: String!): User!
    deleteUser(id: ID!): Boolean!
    sendVerificationEmail(source: String): VerificationResponse!
    verifyEmail: VerifyEmailResponse!
    verifyEmailByToken(token: String!): VerifyEmailByTokenResponse!
    forgotPassword(email: String!, domain: String!): ForgotPasswordResponse!
    resetPassword(token: String!, password: String!, confirmPassword: String!): ResetPasswordResponse!
  }
`;
