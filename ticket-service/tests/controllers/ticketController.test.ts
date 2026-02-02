import { Request, Response } from 'express';
import * as ticketController from '../../src/controllers/ticketController';
import { Ticket } from '../../src/models/Ticket';

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
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

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

      (Ticket.find as jest.Mock).mockReturnValue(mockQuery);
      (Ticket.countDocuments as jest.Mock).mockResolvedValue(2);

      await ticketController.getAllTickets(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockTickets,
          pagination: expect.objectContaining({
            page: 1,
            limit: 20,
            total: 2,
          }),
        })
      );
    });

    it('should filter tickets by status', async () => {
      mockRequest.query = { status: 'open', page: '1', limit: '20' };

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };

      (Ticket.find as jest.Mock).mockReturnValue(mockQuery);
      (Ticket.countDocuments as jest.Mock).mockResolvedValue(0);

      await ticketController.getAllTickets(mockRequest as Request, mockResponse as Response);

      expect(Ticket.find).toHaveBeenCalledWith(expect.objectContaining({ status: 'open' }));
      expect(responseStatus).toHaveBeenCalledWith(200);
    });

    it('should handle errors gracefully', async () => {
      mockRequest.query = { page: '1', limit: '20' };

      (Ticket.find as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      await ticketController.getAllTickets(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to fetch tickets',
        })
      );
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

      (Ticket.findById as jest.Mock).mockResolvedValue(mockTicket);

      await ticketController.getTicketById(mockRequest as Request, mockResponse as Response);

      expect(Ticket.findById).toHaveBeenCalledWith('ticket1');
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockTicket,
        })
      );
    });

    it('should return 404 if ticket not found', async () => {
      mockRequest.params = { id: 'nonexistent' };

      (Ticket.findById as jest.Mock).mockResolvedValue(null);

      await ticketController.getTicketById(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Ticket not found',
        })
      );
    });

    it('should handle errors gracefully', async () => {
      mockRequest.params = { id: 'ticket1' };

      (Ticket.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await ticketController.getTicketById(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to fetch ticket',
        })
      );
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

      (Ticket as unknown as jest.Mock).mockImplementation(() => mockSavedTicket);

      await ticketController.createTicket(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Ticket created successfully',
        })
      );
    });

    it('should handle creation errors', async () => {
      mockRequest.body = validTicketData;

      const mockTicketWithError = {
        save: jest.fn().mockRejectedValue(new Error('Validation error')),
      };

      (Ticket as unknown as jest.Mock).mockImplementation(() => mockTicketWithError);

      await ticketController.createTicket(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to create ticket',
        })
      );
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

      (Ticket.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUpdatedTicket);

      await ticketController.updateTicket(mockRequest as Request, mockResponse as Response);

      expect(Ticket.findByIdAndUpdate).toHaveBeenCalledWith(
        'ticket1',
        expect.objectContaining({ subject: 'Updated Subject', status: 'in-progress' }),
        { new: true, runValidators: true }
      );
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Ticket updated successfully',
          data: mockUpdatedTicket,
        })
      );
    });

    it('should return 404 if ticket not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { subject: 'Updated Subject' };

      (Ticket.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await ticketController.updateTicket(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Ticket not found',
        })
      );
    });

    it('should handle update errors', async () => {
      mockRequest.params = { id: 'ticket1' };
      mockRequest.body = { subject: 'Updated Subject' };

      (Ticket.findByIdAndUpdate as jest.Mock).mockRejectedValue(new Error('Update failed'));

      await ticketController.updateTicket(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to update ticket',
        })
      );
    });
  });
});
