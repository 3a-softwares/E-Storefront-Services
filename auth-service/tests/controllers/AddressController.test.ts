import { Request, Response } from 'express';
import * as addressController from '../../src/controllers/addressController';
import Address from '../../src/models/Address';
import mongoose from 'mongoose';

// Mock Address model
jest.mock('../../src/models/Address');

// Mock mongoose
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    Types: {
      ObjectId: jest.fn((id: string) => id),
    },
  };
});

describe('AddressController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnValue({ json: responseJson });

    mockRequest = {
      query: {},
      params: {},
      body: {},
      user: { userId: 'user123' },
    } as any;

    mockResponse = {
      json: responseJson,
      status: responseStatus,
    };

    jest.clearAllMocks();
  });

  describe('getAddresses', () => {
    it('should return all addresses for user', async () => {
      const mockAddresses = [
        { _id: 'addr1', street: '123 Main St', city: 'NYC', isDefault: true },
        { _id: 'addr2', street: '456 Oak Ave', city: 'LA', isDefault: false },
      ];

      (Address.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockAddresses),
        }),
      });

      await addressController.getAddresses(mockRequest as Request, mockResponse as Response);

      expect(Address.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: { addresses: mockAddresses },
        })
      );
    });

    it('should return 401 if user not authenticated', async () => {
      (mockRequest as any).user = undefined;

      await addressController.getAddresses(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized',
      });
    });

    it('should handle errors', async () => {
      (Address.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      await addressController.getAddresses(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to get addresses',
        })
      );
    });
  });

  describe('addAddress', () => {
    const validAddressData = {
      name: 'John Doe',
      mobile: '+1234567890',
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'USA',
      label: 'Home',
    };

    it('should add a new address successfully', async () => {
      mockRequest.body = validAddressData;

      (Address.countDocuments as jest.Mock).mockResolvedValue(1);
      (Address.updateMany as jest.Mock).mockResolvedValue({});

      const mockSave = jest.fn().mockResolvedValue(true);
      (Address as unknown as jest.Mock).mockImplementation(() => ({
        ...validAddressData,
        save: mockSave,
      }));

      await addressController.addAddress(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Address added successfully',
        })
      );
    });

    it('should make first address default automatically', async () => {
      mockRequest.body = validAddressData;

      (Address.countDocuments as jest.Mock).mockResolvedValue(0); // No existing addresses

      const mockSave = jest.fn().mockResolvedValue(true);
      const mockAddress = { ...validAddressData, isDefault: true, save: mockSave };
      (Address as unknown as jest.Mock).mockImplementation(() => mockAddress);

      await addressController.addAddress(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(201);
    });

    it('should return 400 if required fields missing', async () => {
      mockRequest.body = { street: '123 Main St' }; // Missing other required fields

      await addressController.addAddress(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Name, mobile, and all address fields are required',
        })
      );
    });

    it('should return 401 if user not authenticated', async () => {
      (mockRequest as any).user = undefined;
      mockRequest.body = validAddressData;

      await addressController.addAddress(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
    });

    it('should handle errors', async () => {
      mockRequest.body = validAddressData;

      (Address.countDocuments as jest.Mock).mockRejectedValue(new Error('Database error'));

      await addressController.addAddress(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
    });
  });

  describe('updateAddress', () => {
    it('should update address successfully', async () => {
      mockRequest.params = { id: 'addr123' };
      mockRequest.body = { street: '456 New St' };

      const existingAddress = {
        _id: 'addr123',
        street: '123 Old St',
        city: 'NYC',
        state: 'NY',
        zip: '10001',
        country: 'USA',
        isDefault: false,
      };

      (Address.findOne as jest.Mock).mockResolvedValue(existingAddress);
      (Address.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...existingAddress,
        street: '456 New St',
      });

      await addressController.updateAddress(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Address updated successfully',
        })
      );
    });

    it('should return 404 if address not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { street: '456 New St' };

      (Address.findOne as jest.Mock).mockResolvedValue(null);

      await addressController.updateAddress(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Address not found',
        })
      );
    });

    it('should unset other defaults when setting new default', async () => {
      mockRequest.params = { id: 'addr123' };
      mockRequest.body = { isDefault: true };

      const existingAddress = {
        _id: 'addr123',
        street: '123 Main St',
        city: 'NYC',
        state: 'NY',
        zip: '10001',
        country: 'USA',
        isDefault: false,
      };

      (Address.findOne as jest.Mock).mockResolvedValue(existingAddress);
      (Address.updateMany as jest.Mock).mockResolvedValue({});
      (Address.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...existingAddress,
        isDefault: true,
      });

      await addressController.updateAddress(mockRequest as Request, mockResponse as Response);

      expect(Address.updateMany).toHaveBeenCalledWith(
        { userId: 'user123', _id: { $ne: 'addr123' } },
        { isDefault: false }
      );
    });

    it('should return 401 if user not authenticated', async () => {
      (mockRequest as any).user = undefined;
      mockRequest.params = { id: 'addr123' };

      await addressController.updateAddress(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
    });
  });

  describe('deleteAddress', () => {
    it('should delete address successfully', async () => {
      mockRequest.params = { id: 'addr123' };

      const deletedAddress = {
        _id: 'addr123',
        isDefault: false,
      };

      (Address.findOneAndDelete as jest.Mock).mockResolvedValue(deletedAddress);

      await addressController.deleteAddress(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Address deleted successfully',
        })
      );
    });

    it('should set another address as default when deleting default', async () => {
      mockRequest.params = { id: 'addr123' };

      const deletedAddress = {
        _id: 'addr123',
        isDefault: true,
      };

      const anotherAddress = {
        _id: 'addr456',
        isDefault: false,
        save: jest.fn().mockResolvedValue(true),
      };

      (Address.findOneAndDelete as jest.Mock).mockResolvedValue(deletedAddress);
      (Address.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(anotherAddress),
      });

      await addressController.deleteAddress(mockRequest as Request, mockResponse as Response);

      expect(anotherAddress.isDefault).toBe(true);
      expect(anotherAddress.save).toHaveBeenCalled();
    });

    it('should return 404 if address not found', async () => {
      mockRequest.params = { id: 'nonexistent' };

      (Address.findOneAndDelete as jest.Mock).mockResolvedValue(null);

      await addressController.deleteAddress(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Address not found',
        })
      );
    });

    it('should return 401 if user not authenticated', async () => {
      (mockRequest as any).user = undefined;
      mockRequest.params = { id: 'addr123' };

      await addressController.deleteAddress(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
    });
  });

  describe('setDefaultAddress', () => {
    it('should set address as default successfully', async () => {
      mockRequest.params = { id: 'addr123' };

      const mockAddress = {
        _id: 'addr123',
        isDefault: false,
        save: jest.fn().mockResolvedValue(true),
      };

      (Address.findOne as jest.Mock).mockResolvedValue(mockAddress);
      (Address.updateMany as jest.Mock).mockResolvedValue({});

      await addressController.setDefaultAddress(mockRequest as Request, mockResponse as Response);

      expect(Address.updateMany).toHaveBeenCalledWith({ userId: 'user123' }, { isDefault: false });
      expect(mockAddress.isDefault).toBe(true);
      expect(mockAddress.save).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 if address not found', async () => {
      mockRequest.params = { id: 'nonexistent' };

      (Address.findOne as jest.Mock).mockResolvedValue(null);

      await addressController.setDefaultAddress(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
    });

    it('should return 401 if user not authenticated', async () => {
      (mockRequest as any).user = undefined;
      mockRequest.params = { id: 'addr123' };

      await addressController.setDefaultAddress(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
    });

    it('should handle errors', async () => {
      mockRequest.params = { id: 'addr123' };

      (Address.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      await addressController.setDefaultAddress(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to set default address',
        })
      );
    });
  });
});
