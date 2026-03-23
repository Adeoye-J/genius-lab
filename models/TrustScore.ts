import mongoose, { Document, Model } from 'mongoose';

export interface ITrustScore extends Document {
  _id: mongoose.Types.ObjectId;
  workerId: mongoose.Types.ObjectId;
  completedJobs: number;
  verifiedPayments: number;
  averageRating: number;
  disputeCount: number;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

const TrustScoreSchema = new mongoose.Schema<ITrustScore>(
  {
    workerId:         { type: mongoose.Schema.Types.ObjectId, ref: 'WorkerProfile', unique: true, required: true },
    completedJobs:    { type: Number, default: 0, min: 0 },
    verifiedPayments: { type: Number, default: 0, min: 0 },
    averageRating:    { type: Number, default: 0, min: 0, max: 5 },
    disputeCount:     { type: Number, default: 0, min: 0 },
    score:            { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

const TrustScore: Model<ITrustScore> =
  mongoose.models.TrustScore ?? mongoose.model<ITrustScore>('TrustScore', TrustScoreSchema);

export default TrustScore;