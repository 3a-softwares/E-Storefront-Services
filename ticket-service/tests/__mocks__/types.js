"use strict";
// Mock for @3asoftwares/types
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorType = exports.LogLevel = exports.TicketCategory = exports.TicketPriority = exports.TicketStatus = exports.UserRole = void 0;
// Enums
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["SELLER"] = "seller";
    UserRole["CUSTOMER"] = "customer";
    UserRole["SUPPORT"] = "support";
    UserRole["SUPER_ADMIN"] = "super_admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var TicketStatus;
(function (TicketStatus) {
    TicketStatus["OPEN"] = "open";
    TicketStatus["IN_PROGRESS"] = "in_progress";
    TicketStatus["PENDING"] = "pending";
    TicketStatus["RESOLVED"] = "resolved";
    TicketStatus["CLOSED"] = "closed";
})(TicketStatus || (exports.TicketStatus = TicketStatus = {}));
var TicketPriority;
(function (TicketPriority) {
    TicketPriority["LOW"] = "low";
    TicketPriority["MEDIUM"] = "medium";
    TicketPriority["HIGH"] = "high";
    TicketPriority["URGENT"] = "urgent";
})(TicketPriority || (exports.TicketPriority = TicketPriority = {}));
var TicketCategory;
(function (TicketCategory) {
    TicketCategory["GENERAL"] = "general";
    TicketCategory["TECHNICAL"] = "technical";
    TicketCategory["BILLING"] = "billing";
    TicketCategory["ORDER"] = "order";
    TicketCategory["PRODUCT"] = "product";
    TicketCategory["ACCOUNT"] = "account";
    TicketCategory["OTHER"] = "other";
})(TicketCategory || (exports.TicketCategory = TicketCategory = {}));
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