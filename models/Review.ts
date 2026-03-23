import mongoose, { Document, Model } from 'mongoose';

export interface IReview extends Document {
  _id: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  workerId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new mongoose.Schema<IReview>(
  {
    jobId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Job',           required: true, unique: true }, // one review per job
    workerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'WorkerProfile', required: true, index: true  },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User',          required: true               },
    rating:     { type: Number, required: true, min: 1, max: 5 },
    comment:    { type: String, maxlength: 1000, default: '' },
  },
  { timestamps: true }
);

export const Review: Model<IReview> =
  mongoose.models.Review ?? mongoose.model<IReview>('Review', ReviewSchema);