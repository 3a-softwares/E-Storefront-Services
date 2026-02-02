"use strict";
// Mock for @3asoftwares/types
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorType = exports.LogLevel = exports.ShippingMethod = exports.PaymentMethod = exports.PaymentStatus = exports.ProductStatus = exports.OrderStatus = exports.UserRole = void 0;
// Enums
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["SELLER"] = "seller";
    UserRole["CUSTOMER"] = "customer";
    UserRole["SUPPORT"] = "support";
    UserRole["SUPER_ADMIN"] = "super_admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["CONFIRMED"] = "confirmed";
    OrderStatus["PROCESSING"] = "processing";
    OrderStatus["SHIPPED"] = "shipped";
    OrderStatus["DELIVERED"] = "delivered";
    OrderStatus["CANCELLED"] = "cancelled";
    OrderStatus["REFUNDED"] = "refunded";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["DRAFT"] = "draft";
    ProductStatus["ACTIVE"] = "active";
    ProductStatus["INACTIVE"] = "inactive";
    ProductStatus["OUT_OF_STOCK"] = "out_of_stock";
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["COMPLETED"] = "completed";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CREDIT_CARD"] = "credit_card";
    PaymentMethod["DEBIT_CARD"] = "debit_card";
    PaymentMethod["PAYPAL"] = "paypal";
    PaymentMethod["COD"] = "cod";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var ShippingMethod;
(function (ShippingMethod) {
    ShippingMethod["STANDARD"] = "standard";
    ShippingMethod["EXPRESS"] = "express";
    ShippingMethod["OVERNIGHT"] = "overnight";
})(ShippingMethod || (exports.ShippingMethod = ShippingMethod = {}));
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
var ErrorType;
(function (ErrorType) {
    ErrorType["VALIDATION"] = "VALIDATION";
    ErrorType["AUTHENTICATION"] = "AUTHENTICATION";
    ErrorType["AUTHORIZATION"] = "AUTHORIZATION";
    ErrorType["NOT_FOUND"] = "NOT_FOUND";
    ErrorType["INTERNAL"] = "INTERNAL";
})(ErrorType || (exports.ErrorType = ErrorType = {}));
//# sourceMappingURL=types.js.map