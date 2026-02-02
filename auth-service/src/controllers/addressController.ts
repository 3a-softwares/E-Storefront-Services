import { Request, Response } from 'express';
import Address from '../models/Address';
import mongoose from 'mongoose';
import { Logger } from '@3asoftwares/utils/server';

// Get all addresses for the current user
export const getAddresses = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const addresses = await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      data: { addresses },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get addresses',
      error: error.message,
    });
  }
};

// Add a new address
export const addAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { name, mobile, email, street, city, state, zip, country, isDefault, label } = req.body;

    Logger.debug('Add Address Request Body', req.body, 'Address');
    // Validation
    if (!name || !mobile || !street || !city || !state || !zip || !country) {
      res.status(400).json({
        success: false,
        message: 'Name, mobile, and all address fields are required',
      });
      return;
    }

    // If this is the first address, make it default
    const existingCount = await Address.countDocuments({ userId });
    const shouldBeDefault = isDefault || existingCount === 0;

    // If setting as default, unset other defaults
    if (shouldBeDefault) {
      await Address.updateMany({ userId }, { isDefault: false });
    }

    const address = new Address({
      userId: new mongoose.Types.ObjectId(userId),
      name,
      mobile,
      email,
      street,
      city,
      state,
      zip,
      country,
      isDefault: shouldBeDefault,
      label,
    });

    await address.save();

    res.status(201).json({
      success: true,
      data: { address },
      message: 'Address added successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to add address',
      error: error.message,
    });
  }
};

// Update an address
export const updateAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const addressId = req.params.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { name, mobile, email, street, city, state, zip, country, isDefault, label } = req.body;

    // Check if address belongs to user
    const existingAddress = await Address.findOne({ _id: addressId, userId });

    if (!existingAddress) {
      res.status(404).json({
        success: false,
        message: 'Address not found',
      });
      return;
    }

    // If setting as default, unset other defaults
    if (isDefault && !existingAddress.isDefault) {
      await Address.updateMany({ userId, _id: { $ne: addressId } }, { isDefault: false });
    }

    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      {
        name: name || existingAddress.name,
        mobile: mobile || existingAddress.mobile,
        email: email ?? existingAddress.email,
        street: street || existingAddress.street,
        city: city || existingAddress.city,
        state: state || existingAddress.state,
        zip: zip || existingAddress.zip,
        country: country || existingAddress.country,
        isDefault: isDefault ?? existingAddress.isDefault,
        label: label ?? existingAddress.label,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: { address: updatedAddress },
      message: 'Address updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update address',
      error: error.message,
    });
  }
};

// Delete an address
export const deleteAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const addressId = req.params.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const address = await Address.findOneAndDelete({ _id: addressId, userId });

    if (!address) {
      res.status(404).json({
        success: false,
        message: 'Address not found',
      });
      return;
    }

    // If deleted address was default, set another one as default
    if (address.isDefault) {
      const anotherAddress = await Address.findOne({ userId }).sort({ createdAt: -1 });
      if (anotherAddress) {
        anotherAddress.isDefault = true;
        await anotherAddress.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete address',
      error: error.message,
    });
  }
};

// Set an address as default
export const setDefaultAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const addressId = req.params.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Check if address belongs to user
    const address = await Address.findOne({ _id: addressId, userId });

    if (!address) {
      res.status(404).json({
        success: false,
        message: 'Address not found',
      });
      return;
    }

    // Unset all defaults and set this one
    await Address.updateMany({ userId }, { isDefault: false });
    address.isDefault = true;
    await address.save();

    res.status(200).json({
      success: true,
      data: { address },
      message: 'Default address updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to set default address',
      error: error.message,
    });
  }
};
