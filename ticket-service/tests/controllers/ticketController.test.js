"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const ticketController = __importStar(require("../../src/controllers/ticketController"));
const Ticket_1 = require("../../src/models/Ticket");
// Mock dependencies
jest.mock('../../src/models/Ticket');
jest.mock('../../src/utils/logger', () => ({
    Logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));
describe('TicketController', () => {
    let mockRequest;
    let mockResponse;
    let responseJson;
    let responseStatus;
    beforeEach(() => {
        responseJson = jest.fn();
        responseStatus = jest.fn().mockReturnValue({ json: responseJson });
        mockRequest = {
            body: {},
            params: {},
            query: {},
        };
        mockResponse = {
            status: responseStatus,
            json: responseJson,
        };
        jest.clearAllMocks();
    });
    describe('getAllTickets', () => {
        it('should return all tickets with pagination', async () => {
            const mockTickets = [
                {
                    _id: 'ticket1',
                    ticketId: 'TKT-001',
                    subject: 'Test Ticket 1',
                    status: 'open',
                    priority: 'medium',
                    category: 'general',
                },
                {
                    _id: 'ticket2',
                    ticketId: 'TKT-002',
                    subject: 'Test Ticket 2',
                    status: 'in-progress',
                    priority: 'high',
                    category: 'technical',
                },
            ];
            mockRequest.query = { page: '1', limit: '20' };
            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue(mockTickets),
            };
            Ticket_1.Ticket.find.mockReturnValue(mockQuery);
            Ticket_1.Ticket.countDocuments.mockResolvedValue(2);
            await ticketController.getAllTickets(mockRequest, mockResponse);
            expect(responseStatus).toHaveBeenCalledWith(200);
            expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: mockTickets,
                pagination: expect.objectContaining({
                    page: 1,
                    limit: 20,
                    total: 2,
                }),
            }));
        });
        it('should filter tickets by status', async () => {
            mockRequest.query = { status: 'open', page: '1', limit: '20' };
            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue([]),
            };
            Ticket_1.Ticket.find.mockReturnValue(mockQuery);
            Ticket_1.Ticket.countDocuments.mockResolvedValue(0);
            await ticketController.getAllTickets(mockRequest, mockResponse);
            expect(Ticket_1.Ticket.find.mock.calls[0][0]).toEqual(expect.objectContaining({ status: 'open' }));
            expect(responseStatus).toHaveBeenCalledWith(200);
        });
        it('should handle errors gracefully', async () => {
            mockRequest.query = { page: '1', limit: '20' };
            Ticket_1.Ticket.find.mockImplementation(() => {
                throw new Error('Database error');
            });
            await ticketController.getAllTickets(mockRequest, mockResponse);
            expect(responseStatus).toHaveBeenCalledWith(500);
            expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Failed to fetch tickets',
            }));
        });
    });
    describe('getTicketById', () => {
        it('should return a ticket by ID', async () => {
            const mockTicket = {
                _id: 'ticket1',
                ticketId: 'TKT-001',
                subject: 'Test Ticket',
                description: 'Test description',
                status: 'open',
                priority: 'medium',
                category: 'general',
                customerName: 'John Doe',
                customerEmail: 'john@example.com',
            };
            mockRequest.params = { id: 'ticket1' };
            Ticket_1.Ticket.findById.mockResolvedValue(mockTicket);
            await ticketController.getTicketById(mockRequest, mockResponse);
            expect(Ticket_1.Ticket.findById.mock.calls[0][0]).toBe('ticket1');
            expect(responseStatus).toHaveBeenCalledWith(200);
            expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: mockTicket,
            }));
        });
        it('should return 404 if ticket not found', async () => {
            mockRequest.params = { id: 'nonexistent' };
            Ticket_1.Ticket.findById.mockResolvedValue(null);
            await ticketController.getTicketById(mockRequest, mockResponse);
            expect(responseStatus).toHaveBeenCalledWith(404);
            expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Ticket not found',
            }));
        });
        it('should handle errors gracefully', async () => {
            mockRequest.params = { id: 'ticket1' };
            Ticket_1.Ticket.findById.mockRejectedValue(new Error('Database error'));
            await ticketController.getTicketById(mockRequest, mockResponse);
            expect(responseStatus).toHaveBeenCalledWith(500);
            expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Failed to fetch ticket',
            }));
        });
    });
    describe('createTicket', () => {
        const validTicketData = {
            subject: 'Test Ticket Subject',
            description: 'This is a test ticket description',
            category: 'general',
            priority: 'medium',
            customerName: 'John Doe',
            customerEmail: 'john@example.com',
        };
        it('should create a new ticket successfully', async () => {
            mockRequest.body = validTicketData;
            const mockSavedTicket = {
                _id: 'ticket123',
                ticketId: 'TKT-001',
                ...validTicketData,
                status: 'open',
                save: jest.fn().mockResolvedValue(true),
            };
            Ticket_1.Ticket.mockImplementation(() => mockSavedTicket);
            await ticketController.createTicket(mockRequest, mockResponse);
            expect(responseStatus).toHaveBeenCalledWith(201);
            expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Ticket created successfully',
            }));
        });
        it('should handle creation errors', async () => {
            mockRequest.body = validTicketData;
            const mockTicketWithError = {
                save: jest.fn().mockRejectedValue(new Error('Validation error')),
            };
            Ticket_1.Ticket.mockImplementation(() => mockTicketWithError);
            await ticketController.createTicket(mockRequest, mockResponse);
            expect(responseStatus).toHaveBeenCalledWith(500);
            expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Failed to create ticket',
            }));
        });
    });
    describe('updateTicket', () => {
        it('should update a ticket successfully', async () => {
            const mockUpdatedTicket = {
                _id: 'ticket1',
                ticketId: 'TKT-001',
                subject: 'Updated Subject',
                status: 'in-progress',
            };
            mockRequest.params = { id: 'ticket1' };
            mockRequest.body = { subject: 'Updated Subject', status: 'in-progress' };
            Ticket_1.Ticket.findByIdAndUpdate.mockResolvedValue(mockUpdatedTicket);
            await ticketController.updateTicket(mockRequest, mockResponse);
            expect(Ticket_1.Ticket.findByIdAndUpdate.mock.calls[0][0]).toBe('ticket1');
            expect(Ticket_1.Ticket.findByIdAndUpdate.mock.calls[0][1]).toEqual(expect.objectContaining({ subject: 'Updated Subject', status: 'in-progress' }));
            expect(Ticket_1.Ticket.findByIdAndUpdate.mock.calls[0][2]).toEqual({
                new: true,
                runValidators: true,
            });
            expect(responseStatus).toHaveBeenCalledWith(200);
            expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Ticket updated successfully',
                data: mockUpdatedTicket,
            }));
        });
        it('should return 404 if ticket not found', async () => {
            mockRequest.params = { id: 'nonexistent' };
            mockRequest.body = { subject: 'Updated Subject' };
            Ticket_1.Ticket.findByIdAndUpdate.mockResolvedValue(null);
            await ticketController.updateTicket(mockRequest, mockResponse);
            expect(responseStatus).toHaveBeenCalledWith(404);
            expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Ticket not found',
            }));
        });
        it('should handle update errors', async () => {
            mockRequest.params = { id: 'ticket1' };
            mockRequest.body = { subject: 'Updated Subject' };
            Ticket_1.Ticket.findByIdAndUpdate.mockRejectedValue(new Error('Update failed'));
            await ticketController.updateTicket(mockRequest, mockResponse);
            expect(responseStatus).toHaveBeenCalledWith(500);
            expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Failed to update ticket',
            }));
        });
    });
});
//# sourceMappingURL=ticketController.test.js.map