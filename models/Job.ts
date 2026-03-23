import mongoose, { Document, Model } from 'mongoose';

export type JobStatus =
  | 'requested'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'paid'
  | 'cancelled';

export interface IJob extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  workerId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  location: {
    address?: string;
    city?: string;
    state?: string;
  };
  price: number;
  currency: string;
  status: JobStatus;
  scheduledDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new mongoose.Schema<IJob>(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 2000,
      default: '',
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkerProfile',
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    location: {
      address: { type: String, default: '' },
      city:    { type: String, default: '' },
      state:   { type: String, default: '' },
    },
    price: {
      type: Number,
      required: [true, 'Job price is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'NGN',
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['requested', 'accepted', 'in_progress', 'completed', 'paid', 'cancelled'],
      default: 'requested',
      index: true,
    },
    scheduledDate: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Job: Model<IJob> =
  mongoose.models.Job ?? mongoose.model<IJob>('Job', JobSchema);

export default Job;