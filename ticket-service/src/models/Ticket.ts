import mongoose, { Document, Schema } from 'mongoose';

export enum TicketCategory {
  TECHNICAL = 'technical',
  BILLING = 'billing',
  GENERAL = 'general',
  FEATURE = 'feature',
  ORDER = 'order',
  ACCOUNT = 'account',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in-progress',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export interface IComment {
  userId: string;
  userName: string;
  userRole: string;
  message: string;
  isInternal: boolean;
  createdAt: Date;
}

export interface ITicket extends Document {
  ticketId: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  customerName: string;
  customerEmail: string;
  customerId?: string;
  assignedTo?: string; // User ID from auth-service
  assignedToName?: string; // User name for display
  resolution?: string;
  attachments: string[];
  comments: IComment[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
}

const commentSchema = new Schema<IComment>(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userRole: { type: String, required: true },
    message: { type: String, required: true },
    isInternal: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ticketSchema = new Schema<ITicket>(
  {
    ticketId: {
      type: String,
      unique: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      minlength: [5, 'Subject must be at least 5 characters'],
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
    },
    category: {
      type: String,
      enum: Object.values(TicketCategory),
      required: [true, 'Category is required'],
    },
    priority: {
      type: String,
      enum: Object.values(TicketPriority),
      default: TicketPriority.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(TicketStatus),
      default: TicketStatus.OPEN,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
      lowercase: true,
      trim: true,
    },
    customerId: {
      type: String,
    },
    assignedTo: {
      type: String, // User ID from auth-service
    },
    assignedToName: {
      type: String, // User name for display
    },
    resolution: {
      type: String,
    },
    attachments: [
      {
        type: String,
      },
    ],
    comments: [commentSchema],
    resolvedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate ticketId before saving
ticketSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await Ticket.countDocuments();
    this.ticketId = `TKT-${(1001 + count).toString().padStart(4, '0')}`;
  }
  next();
});

// Index for faster queries
ticketSchema.index({ status: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ customerEmail: 1 });
ticketSchema.index({ assignedTo: 1 });
ticketSchema.index({ createdAt: -1 });

export const Ticket = mongoose.model<ITicket>('Ticket', ticketSchema);
