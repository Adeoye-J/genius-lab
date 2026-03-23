import mongoose, { Document, Model } from 'mongoose';

export interface IWorkerEarnings extends Document {
  _id: mongoose.Types.ObjectId;
  workerId: mongoose.Types.ObjectId;
  totalEarnings: number;
  monthlyEarnings: number;
  lastPaymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WorkerEarningsSchema = new mongoose.Schema<IWorkerEarnings>(
  {
    workerId:        { type: mongoose.Schema.Types.ObjectId, ref: 'WorkerProfile', unique: true, required: true },
    totalEarnings:   { type: Number, default: 0, min: 0 },
    monthlyEarnings: { type: Number, default: 0, min: 0 },
    lastPaymentDate: { type: Date, default: null },
  },
  { timestamps: true }
);

const WorkerEarnings: Model<IWorkerEarnings> =
  mongoose.models.WorkerEarnings ??
  mongoose.model<IWorkerEarnings>('WorkerEarnings', WorkerEarningsSchema);

export default WorkerEarnings;