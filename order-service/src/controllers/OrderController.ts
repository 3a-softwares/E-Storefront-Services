import { Request, Response } from 'express';
import Order from '../models/Order';
import { OrderStatus, PaymentStatus } from '@3asoftwares/types';
import { Logger } from '@3asoftwares/utils/server';

export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const customerId = req.query.customerId as string;
    const skip = (page - 1) * limit;

    Logger.debug('Fetching all orders', { page, limit, customerId }, 'OrderController');

    const query: any = {};
    if (customerId) {
      query.customerId = customerId;
    }

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(query),
    ]);

    Logger.info(`Fetched ${orders.length} orders`, { total, page }, 'OrderController');

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    Logger.error('Failed to get orders', error, 'OrderController');
    res.status(500).json({
      success: false,
      message: 'Failed to get orders',
      error: error.message,
    });
  }
};

export const getOrdersByCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    Logger.debug('Fetching customer orders', { customerId, page, limit }, 'OrderController');

    const [orders, total] = await Promise.all([
      Order.find({ customerId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments({ customerId }),
    ]);

    Logger.info(
      `Fetched ${orders.length} orders for customer`,
      { customerId, total },
      'OrderController'
    );

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    Logger.error('Failed to get customer orders', error, 'OrderController');
    res.status(500).json({
      success: false,
      message: 'Failed to get customer orders',
      error: error.message,
    });
  }
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    Logger.debug('Fetching order by ID', { orderId: id }, 'OrderController');

    const order = await Order.findById(id).lean();

    if (!order) {
      Logger.warn('Order not found', { orderId: id }, 'OrderController');
      res.status(404).json({
        success: false,
        message: 'Order not found',
      });
      return;
    }

    Logger.debug(
      'Order fetched successfully',
      { orderId: id, orderNumber: order.orderNumber },
      'OrderController'
    );

    res.status(200).json({
      success: true,
      data: { order },
    });
  } catch (error: any) {
    Logger.error('Failed to get order', error, 'OrderController');
    res.status(500).json({
      success: false,
      message: 'Failed to get order',
      error: error.message,
    });
  }
};

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      customerId,
      customerEmail,
      items,
      subtotal,
      tax,
      shipping,
      discount,
      couponCode,
      total,
      paymentMethod,
      shippingAddress,
      notes,
    } = req.body;

    Logger.info(
      'Creating new order',
      { customerId, customerEmail, itemCount: items?.length, total },
      'OrderController'
    );

    // Group items by sellerId to create separate orders per seller
    const itemsBySeller: Record<string, any[]> = {};
    for (const item of items) {
      const sellerId = item.sellerId || 'default';
      if (!itemsBySeller[sellerId]) {
        itemsBySeller[sellerId] = [];
      }
      itemsBySeller[sellerId].push(item);
    }

    const sellerIds = Object.keys(itemsBySeller);
    const createdOrders = [];

    Logger.debug(
      'Order items grouped by seller',
      { sellerCount: sellerIds.length },
      'OrderController'
    );

    // If only one seller (or no sellerId), create single order
    if (sellerIds.length === 1) {
      const singleSellerId = sellerIds[0];
      const orderCount = await Order.countDocuments();
      const orderNumber = `ORD-${Date.now()}-${orderCount + 1}`;

      Logger.debug(
        'Creating single order',
        { orderNumber, sellerId: singleSellerId },
        'OrderController'
      );

      const order = new Order({
        orderNumber,
        customerId,
        customerEmail,
        sellerId: singleSellerId !== 'default' ? singleSellerId : undefined,
        items,
        subtotal,
        tax: tax || 0,
        shipping: shipping || 0,
        discount: discount || 0,
        couponCode: couponCode || null,
        total,
        orderStatus: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod,
        shippingAddress,
        notes,
      });

      await order.save();
      createdOrders.push(order);

      Logger.info(
        'Order created successfully',
        { orderId: order._id, orderNumber },
        'OrderController'
      );
    } else {
      // Multiple sellers - create separate orders for each seller
      const orderCount = await Order.countDocuments();
      let orderIndex = 0;

      Logger.info(
        'Creating split orders for multiple sellers',
        { sellerCount: sellerIds.length },
        'OrderController'
      );

      for (const sellerId of sellerIds) {
        const sellerItems = itemsBySeller[sellerId];

        const sellerSubtotal = sellerItems.reduce(
          (sum, item) => sum + (item.subtotal || item.price * item.quantity),
          0
        );

        const proportion = sellerSubtotal / subtotal;
        const sellerTax = Math.round((tax || 0) * proportion * 100) / 100;
        const sellerShipping = Math.round((shipping || 0) * proportion * 100) / 100;
        const sellerDiscount = Math.round((discount || 0) * proportion * 100) / 100;
        const sellerTotal =
          Math.round((sellerSubtotal + sellerTax + sellerShipping - sellerDiscount) * 100) / 100;

        const orderNumber = `ORD-${Date.now()}-${orderCount + orderIndex + 1}`;

        Logger.debug(
          'Creating split order',
          { orderNumber, sellerId, sellerTotal },
          'OrderController'
        );

        const order = new Order({
          orderNumber,
          customerId,
          customerEmail,
          sellerId: sellerId !== 'default' ? sellerId : undefined,
          items: sellerItems,
          subtotal: sellerSubtotal,
          tax: sellerTax,
          shipping: sellerShipping,
          discount: sellerDiscount,
          couponCode: couponCode || null,
          total: sellerTotal,
          orderStatus: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod,
          shippingAddress,
          notes: notes
            ? `${notes} (Split order for seller: ${sellerId})`
            : `Split order for seller: ${sellerId}`,
        });

        await order.save();
        createdOrders.push(order);
        orderIndex++;

        Logger.info(
          'Split order created',
          { orderId: order._id, orderNumber, sellerId },
          'OrderController'
        );
      }
    }

    Logger.info(
      'Order creation completed',
      { orderCount: createdOrders.length, customerId },
      'OrderController'
    );

    res.status(201).json({
      success: true,
      data: {
        order: createdOrders[0], // For backward compatibility
        orders: createdOrders,
        orderCount: createdOrders.length,
      },
      message:
        createdOrders.length > 1
          ? `${createdOrders.length} orders created successfully (split by seller)`
          : 'Order created successfully',
    });
  } catch (error: any) {
    Logger.error('Failed to create order', error, 'OrderController');
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message,
    });
  }
};

export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    Logger.info('Cancel order request', { orderId: id }, 'OrderController');

    const order = await Order.findById(id);

    if (!order) {
      Logger.warn('Order not found for cancellation', { orderId: id }, 'OrderController');
      res.status(404).json({
        success: false,
        message: 'Order not found',
      });
      return;
    }

    // Case-insensitive check for cancelled status
    const currentStatus = (order.orderStatus || '').toUpperCase();
    if (currentStatus === OrderStatus.CANCELLED) {
      Logger.warn('Order already cancelled', { orderId: id }, 'OrderController');
      res.status(400).json({
        success: false,
        message: 'Order is already cancelled',
      });
      return;
    }

    // Only allow cancellation for pending or confirmed orders
    if (!['PENDING', 'CONFIRMED'].includes(currentStatus)) {
      Logger.warn(
        'Cannot cancel order with current status',
        { orderId: id, status: order.orderStatus },
        'OrderController'
      );
      res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.orderStatus}`,
      });
      return;
    }

    order.orderStatus = OrderStatus.CANCELLED;
    order.updatedAt = new Date();
    await order.save();

    Logger.info(
      'Order cancelled successfully',
      { orderId: id, orderNumber: order.orderNumber },
      'OrderController'
    );

    res.status(200).json({
      success: true,
      data: { order },
      message: 'Order cancelled successfully',
    });
  } catch (error: any) {
    Logger.error('Failed to cancel order', error, 'OrderController');
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message,
    });
  }
};

export const validateCart = (_: Request, res: Response) => {
  Logger.debug('validateCart stub called', undefined, 'OrderController');
  res.status(200).json({ message: 'validateCart stub' });
};

export const getSellerOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sellerId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    Logger.debug('Fetching seller orders', { sellerId, page, limit }, 'OrderController');

    // Find orders that have at least one item from this seller
    const query = { 'items.sellerId': sellerId };

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(query),
    ]);

    // Filter items to only show seller's items and calculate seller-specific totals
    const sellerOrders = orders.map((order) => {
      const sellerItems = order.items.filter((item: any) => item.sellerId === sellerId);
      const sellerSubtotal = sellerItems.reduce((sum: number, item: any) => sum + item.subtotal, 0);

      return {
        ...order,
        items: sellerItems,
        sellerSubtotal,
        sellerItemCount: sellerItems.length,
        totalItemCount: order.items.length,
        isMultiSellerOrder: order.items.some((item: any) => item.sellerId !== sellerId),
      };
    });

    Logger.info(
      `Fetched ${orders.length} orders for seller`,
      { sellerId, total },
      'OrderController'
    );

    res.status(200).json({
      success: true,
      data: {
        orders: sellerOrders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    Logger.error('Failed to get seller orders', error, 'OrderController');
    res.status(500).json({
      success: false,
      message: 'Failed to get seller orders',
      error: error.message,
    });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    Logger.info(
      'Updating order status',
      { orderId: id, newStatus: orderStatus },
      'OrderController'
    );

    const order = await Order.findByIdAndUpdate(
      id,
      { orderStatus, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!order) {
      Logger.warn('Order not found for status update', { orderId: id }, 'OrderController');
      res.status(404).json({
        success: false,
        message: 'Order not found',
      });
      return;
    }

    Logger.info(
      'Order status updated successfully',
      { orderId: id, orderNumber: order.orderNumber, status: orderStatus },
      'OrderController'
    );

    res.status(200).json({
      success: true,
      data: { order },
      message: 'Order status updated successfully',
    });
  } catch (error: any) {
    Logger.error('Failed to update order status', error, 'OrderController');
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message,
    });
  }
};

export const addTracking = (_: Request, res: Response) => {
  Logger.debug('addTracking stub called', undefined, 'OrderController');
  res.status(200).json({ message: 'addTracking stub' });
};

export const markAsShipped = (_: Request, res: Response) => {
  Logger.debug('markAsShipped stub called', undefined, 'OrderController');
  res.status(200).json({ message: 'markAsShipped stub' });
};

export const getAdminOrders = (_: Request, res: Response) => {
  Logger.debug('getAdminOrders stub called', undefined, 'OrderController');
  res.status(200).json({ message: 'getAdminOrders stub' });
};

export const getAdminStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    Logger.debug('Fetching admin dashboard stats', undefined, 'OrderController');

    // Get all orders to calculate stats
    const orders = await Order.find().lean();

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

    // Count pending orders (PENDING or CONFIRMED status)
    const pendingOrders = orders.filter(
      (o) => o.orderStatus === OrderStatus.PENDING || o.orderStatus === OrderStatus.CONFIRMED
    ).length;

    // Count completed orders (DELIVERED status)
    const completedOrders = orders.filter((o) => o.orderStatus === OrderStatus.DELIVERED).length;

    // Count processing orders (PROCESSING or SHIPPED status)
    const processingOrders = orders.filter(
      (o) => o.orderStatus === OrderStatus.PROCESSING || o.orderStatus === OrderStatus.SHIPPED
    ).length;

    // Count cancelled orders
    const cancelledOrders = orders.filter((o) => o.orderStatus === OrderStatus.CANCELLED).length;

    Logger.info(
      'Admin stats calculated',
      { totalOrders, totalRevenue, pendingOrders },
      'OrderController'
    );

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        pendingOrders,
        completedOrders,
        processingOrders,
        cancelledOrders,
      },
    });
  } catch (error: any) {
    Logger.error('Failed to get admin stats', error, 'OrderController');
    res.status(500).json({
      success: false,
      message: 'Failed to get admin stats',
      error: error.message,
    });
  }
};

export const processRefund = (_: Request, res: Response) => {
  Logger.debug('processRefund stub called', undefined, 'OrderController');
  res.status(200).json({ message: 'processRefund stub' });
};

export const updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    Logger.info(
      'Updating payment status',
      { orderId: id, newStatus: paymentStatus },
      'OrderController'
    );

    const order = await Order.findByIdAndUpdate(
      id,
      { paymentStatus, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!order) {
      Logger.warn('Order not found for payment status update', { orderId: id }, 'OrderController');
      res.status(404).json({
        success: false,
        message: 'Order not found',
      });
      return;
    }

    Logger.info(
      'Payment status updated successfully',
      { orderId: id, orderNumber: order.orderNumber, paymentStatus },
      'OrderController'
    );

    res.status(200).json({
      success: true,
      data: { order },
      message: 'Payment status updated successfully',
    });
  } catch (error: any) {
    Logger.error('Failed to update payment status', error, 'OrderController');
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status',
      error: error.message,
    });
  }
};

export const getSellerStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sellerId } = req.params;

    Logger.debug('Fetching seller stats', { sellerId }, 'OrderController');

    // Query for orders that have at least one item from this seller
    const query = { 'items.sellerId': sellerId };

    // Get all orders containing items from this seller
    const orders = await Order.find(query).lean();

    const totalOrders = orders.length;
    Logger.debug('Fetching seller stats', { totalOrders }, 'OrderController');

    // Calculate stats based on seller's items within each order
    let totalRevenue = 0;
    let pendingOrders = 0;
    let completedOrders = 0;
    let processingOrders = 0;

    orders.forEach((order) => {
      // Calculate seller's revenue from their items in this order
      const sellerItems = order.items.filter((item: any) => item.sellerId === sellerId);
      const sellerSubtotal = sellerItems.reduce(
        (sum: number, item: any) => sum + (item.subtotal || 0),
        0
      );
      totalRevenue += sellerSubtotal;

      // Count order statuses
      const status = order.orderStatus;
      if (status === OrderStatus.PENDING || status === OrderStatus.CONFIRMED) {
        pendingOrders++;
      } else if (status === OrderStatus.DELIVERED) {
        completedOrders++;
      } else if (status === OrderStatus.PROCESSING || status === OrderStatus.SHIPPED) {
        processingOrders++;
      }
    });

    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const successRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    Logger.info(
      'Seller stats calculated',
      { sellerId, totalOrders, totalRevenue },
      'OrderController'
    );

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalOrders,
        pendingOrders,
        completedOrders,
        processingOrders,
        completionRate: Number(completionRate.toFixed(1)),
        avgOrderValue: Number(avgOrderValue.toFixed(2)),
        successRate: Number(successRate.toFixed(0)),
      },
    });
  } catch (error: any) {
    Logger.error('Failed to get seller stats', error, 'OrderController');
    res.status(500).json({
      success: false,
      message: 'Failed to get seller stats',
      error: error.message,
    });
  }
};

// Dedicated earnings API for seller earnings page
export const getSellerEarnings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sellerId } = req.params;
    const commissionRate = 0.1; // 10% platform commission

    Logger.debug('Fetching seller earnings', { sellerId }, 'OrderController');

    // Query for orders that have at least one item from this seller
    const query = { 'items.sellerId': sellerId };

    // Get all orders containing items from this seller
    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

    // Calculate revenue based on seller's items only
    let totalRevenue = 0;
    const totalOrders = orders.length;

    // Calculate monthly breakdown based on seller's items
    const monthlyData: Record<
      string,
      { revenue: number; orders: number; commission: number; payout: number }
    > = {};

    orders.forEach((order) => {
      // Get only this seller's items and calculate their revenue
      const sellerItems = order.items.filter((item: any) => item.sellerId === sellerId);
      const sellerSubtotal = sellerItems.reduce(
        (sum: number, item: any) => sum + (item.subtotal || 0),
        0
      );
      totalRevenue += sellerSubtotal;

      const date = new Date(order.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          revenue: 0,
          orders: 0,
          commission: 0,
          payout: 0,
        };
      }

      monthlyData[monthKey].revenue += sellerSubtotal;
      monthlyData[monthKey].orders += 1;
      monthlyData[monthKey].commission = monthlyData[monthKey].revenue * commissionRate;
      monthlyData[monthKey].payout =
        monthlyData[monthKey].revenue - monthlyData[monthKey].commission;
    });

    const totalCommission = totalRevenue * commissionRate;
    const totalPayout = totalRevenue - totalCommission;

    Logger.debug(
      'Processing earnings data',
      { sellerId, totalOrders, totalRevenue },
      'OrderController'
    );

    // Convert to array and sort by date (newest first)
    const monthlyEarnings = Object.entries(monthlyData)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, data]) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return {
          period: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
          monthKey: key,
          revenue: Number(data.revenue.toFixed(2)),
          orders: data.orders,
          commission: Number(data.commission.toFixed(2)),
          payout: Number(data.payout.toFixed(2)),
        };
      });

    Logger.info(
      'Seller earnings fetched',
      { sellerId, totalRevenue, totalPayout },
      'OrderController'
    );

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue: Number(totalRevenue.toFixed(2)),
          totalOrders,
          totalCommission: Number(totalCommission.toFixed(2)),
          totalPayout: Number(totalPayout.toFixed(2)),
          commissionRate,
        },
        monthlyEarnings,
      },
    });
  } catch (error: any) {
    Logger.error('Failed to get seller earnings', error, 'OrderController');
    res.status(500).json({
      success: false,
      message: 'Failed to get seller earnings',
      error: error.message,
    });
  }
};
