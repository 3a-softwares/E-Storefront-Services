// Mock for @3asoftwares/types

// Enums
export enum UserRole {
  ADMIN = 'admin',
  SELLER = 'seller',
  CUSTOMER = 'customer',
  SUPPORT = 'support',
  SUPER_ADMIN = 'super_admin',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketCategory {
  GENERAL = 'general',
  TECHNICAL = 'technical',
  BILLING = 'billing',
  ORDER = 'order',
  PRODUCT = 'product',
  ACCOUNT = 'account',
  OTHER = 'other',
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL = 'INTERNAL',
}

// Common mock types
export interface User {
  _id: string;
  id: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface ITicket {
  _id: string;
  ticketId: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  customerName: string;
  customerEmail: string;
  customerId?: string;
  assignedTo?: string;
  messages: ITicketMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITicketMessage {
  _id: string;
  content: string;
  sender: string;
  senderType: 'customer' | 'agent';
  createdAt: Date;
}
