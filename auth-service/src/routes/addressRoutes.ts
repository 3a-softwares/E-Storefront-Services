import express from 'express';
import * as addressController from '../controllers/addressController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all addresses for current user
router.get('/', addressController.getAddresses);

// Add a new address
router.post('/', addressController.addAddress);

// Update an address
router.put('/:id', addressController.updateAddress);

// Delete an address
router.delete('/:id', addressController.deleteAddress);

// Set an address as default
router.patch('/:id/default', addressController.setDefaultAddress);

export default router;
