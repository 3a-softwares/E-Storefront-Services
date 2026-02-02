

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { DEFAULT_CORS_ORIGINS } from '@3asoftwares/utils';
import { Logger } from '@3asoftwares/utils/server';

let io: SocketIOServer | null = null;

export const initializeWebSocket = (server: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || DEFAULT_CORS_ORIGINS,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    Logger.debug('WebSocket client connected', { socketId: socket.id }, 'WebSocket');

    socket.on('join', (userId: string) => {
      socket.join(`user:${userId}`);
      Logger.debug('User joined room', { userId, socketId: socket.id }, 'WebSocket');
    });

    socket.on('joinAdmin', () => {
      socket.join('admin');
      Logger.debug('Admin joined room', { socketId: socket.id }, 'WebSocket');
    });

    socket.on('disconnect', () => {
      Logger.debug('WebSocket client disconnected', { socketId: socket.id }, 'WebSocket');
    });
  });

  Logger.info('WebSocket server initialized', undefined, 'WebSocket');
  return io;
};

export const emitOrderUpdate = (customerId: string, order: any) => {
  if (io) {
    io.to(`user:${customerId}`).emit('orderUpdate', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      timestamp: new Date().toISOString(),
    });
    Logger.debug('Order update emitted', { customerId, orderId: order._id, orderStatus: order.orderStatus }, 'WebSocket');
  }
};

export const emitAdminAlert = (order: any) => {
  if (io) {
    io.to('admin').emit('newOrder', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerEmail: order.customerEmail,
      total: order.total,
      timestamp: new Date().toISOString(),
    });
    Logger.info('Admin alert emitted for new order', { orderId: order._id, orderNumber: order.orderNumber }, 'WebSocket');
  }
};

export const getIO = (): SocketIOServer | null => io;
