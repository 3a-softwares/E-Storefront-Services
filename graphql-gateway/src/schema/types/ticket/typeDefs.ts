export const ticketTypeDefs = `#graphql
  enum TicketCategory {
    technical
    billing
    general
    feature
    order
    account
  }

  enum TicketPriority {
    low
    medium
    high
    urgent
  }

  enum TicketStatus {
    open
    in_progress
    pending
    resolved
    closed
  }

  type TicketComment {
    userId: String!
    userName: String!
    userRole: String!
    message: String!
    isInternal: Boolean!
    createdAt: String!
  }

  type Ticket {
    id: ID!
    ticketId: String!
    subject: String!
    description: String!
    category: String!
    priority: String!
    status: String!
    customerName: String!
    customerEmail: String!
    customerId: String
    assignedTo: String
    assignedToName: String
    resolution: String
    attachments: [String!]
    comments: [TicketComment!]
    createdAt: String!
    updatedAt: String!
    resolvedAt: String
    closedAt: String
  }

  type TicketConnection {
    tickets: [Ticket!]!
    pagination: Pagination!
  }

  input CreateTicketInput {
    subject: String!
    description: String!
    category: String!
    priority: String
    customerName: String!
    customerEmail: String!
    customerId: String
    attachments: [String!]
  }

  input AddTicketCommentInput {
    ticketId: ID!
    message: String!
    isInternal: Boolean
  }

  extend type Query {
    tickets(
      page: Int
      limit: Int
      status: String
      priority: String
      category: String
      customerId: String
      search: String
    ): TicketConnection!
    ticket(id: ID!): Ticket
    myTickets(page: Int, limit: Int): TicketConnection!
  }

  extend type Mutation {
    createTicket(input: CreateTicketInput!): Ticket!
    addTicketComment(input: AddTicketCommentInput!): Ticket!
  }
`;
