import mongoose, { Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  role: 'worker' | 'customer' | 'admin';
  passwordHash: string;
  profileImage?: string;
  isVerified: boolean;
  isOnboarded: boolean;   // Added: gates the onboarding redirect in middleware
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must be under 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^(\+234|0)[789][01]\d{8}$/, 'Please provide a valid Nigerian phone number'],
    },
    role: {
      type: String,
      enum: ['worker', 'customer', 'admin'],
      default: 'customer',
    },
    passwordHash: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isOnboarded: {
      type: Boolean,
      default: false,  // Drives the post-login prompt enforcement
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    // Never return passwordHash unless explicitly selected
    toJSON: {
      transform(_, ret: any) {
        const {passwordHash, ...rest} = ret;
        return rest;
      },
    },
    // toJSON: {
    //   transform(_, ret: Partial<IUser>) {
    //     delete ret.passwordHash;
    //     return ret;
    //   },
    // },
  }
);

// Prevent duplicate model registration in Next.js hot reload
const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);

export default User;