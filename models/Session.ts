import mongoose, { Document, Model } from 'mongoose';

export interface ISession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new mongoose.Schema<ISession>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // MongoDB TTL index — auto-deletes expired sessions
    },
  },
  { timestamps: true }
);

const Session: Model<ISession> =
  mongoose.models.Session ?? mongoose.model<ISession>('Session', SessionSchema);

export default Session;