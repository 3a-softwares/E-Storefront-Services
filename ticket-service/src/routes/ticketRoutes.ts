import { Router } from 'express';
import {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicket,
  assignTicket,
  resolveTicket,
  addComment,
  deleteTicket,
  getTicketStats,
} from '../controllers/ticketController';
import { authenticate, authorizeSupport, authorizeAdmin } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Ticket management endpoints
 */

// Public endpoint for customers to create tickets
router.post('/', createTicket);

// Get ticket stats (requires support auth)
router.get('/stats', authenticate, authorizeSupport, getTicketStats);

// Protected routes (require authentication)
router.get('/', authenticate, authorizeSupport, getAllTickets);
router.get('/:id', authenticate, authorizeSupport, getTicketById);
router.put('/:id', authenticate, authorizeSupport, updateTicket);
router.patch('/:id/assign', authenticate, authorizeAdmin, assignTicket);
router.patch('/:id/resolve', authenticate, authorizeSupport, resolveTicket);
router.post('/:id/comment', authenticate, authorizeSupport, addComment);
router.delete('/:id', authenticate, authorizeAdmin, deleteTicket);

export default router;
