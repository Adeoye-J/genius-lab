import mongoose, { Document, Model } from 'mongoose';

export interface IActivityLog extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActivityLogSchema = new mongoose.Schema<IActivityLog>(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action:    { type: String, required: true, trim: true },
    metadata:  { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: '' },
  },
  { timestamps: true }
);

// TTL: auto-delete logs older than 90 days to keep the collection lean
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog ??
  mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);

export default ActivityLog;