import mongoose, { Document, Model } from 'mongoose';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'payment' | 'job' | 'system';
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new mongoose.Schema<INotification>(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:   { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    type:    { type: String, enum: ['payment', 'job', 'system'], required: true },
    read:    { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

const Notification: Model<INotification> =
  mongoose.models.Notification ??
  mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;