import mongoose, { Document, Model } from 'mongoose';

export interface IBankAccount extends Document {
  _id: mongoose.Types.ObjectId;
  workerId: mongoose.Types.ObjectId;
  bankName: string;
  accountName: string;
  accountNumber: string;
  bankCode: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BankAccountSchema = new mongoose.Schema<IBankAccount>(
  {
    workerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'WorkerProfile', required: true, index: true },
    bankName:      { type: String, required: true, trim: true },
    accountName:   { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true, minlength: 10, maxlength: 10 },
    bankCode:      { type: String, required: true, trim: true },
    verified:      { type: Boolean, default: false },
  },
  { timestamps: true }
);

const BankAccount: Model<IBankAccount> =
  mongoose.models.BankAccount ??
  mongoose.model<IBankAccount>('BankAccount', BankAccountSchema);

export default BankAccount;