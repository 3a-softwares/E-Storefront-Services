// Mock for @3asoftwares/types

// Enums
export enum UserRole {
  ADMIN = 'admin',
  SELLER = 'seller',
  CUSTOMER = 'customer',
  SUPPORT = 'support',
  SUPER_ADMIN = 'super_admin',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal',
  COD = 'cod',
}

export enum ShippingMethod {
  STANDARD = 'standard',
  EXPRESS = 'express',
  OVERNIGHT = 'overnight',
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

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: ProductStatus;
}

export interface Order {
  _id: string;
  userId: string;
  items: any[];
  total: number;
  status: OrderStatus;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Coupon {
  _id: string;
  code: string;
  discount: number;
  isActive: boolean;
}

export interface IUser {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface IProduct {
  _id: string;
  name: string;
  price: number;
  sellerId: string;
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
}

export interface ICoupon {
  _id: string;
  code: string;
  discount: number;
}

export interface IOrder {
  _id: string;
  userId: string;
  total: number;
  status: OrderStatus;
}
