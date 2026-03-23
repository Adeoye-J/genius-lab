import mongoose, { Document, Model } from 'mongoose';

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  workerId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod?: 'card' | 'bank_transfer' | 'wallet';
  transactionReference?: string;
  paymentGateway: string;
  status: 'pending' | 'successful' | 'failed';
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new mongoose.Schema<IPayment>(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkerProfile',
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'NGN',
      uppercase: true,
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'bank_transfer', 'wallet'],
      default: null,
    },
    transactionReference: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values (before payment is initiated)
      index: true,
    },
    paymentGateway: {
      type: String,
      default: 'interswitch',
    },
    status: {
      type: String,
      enum: ['pending', 'successful', 'failed'],
      default: 'pending',
      index: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Payment: Model<IPayment> =
  mongoose.models.Payment ?? mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;