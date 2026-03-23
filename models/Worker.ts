import mongoose, { Document, Model } from 'mongoose';

export interface IWorkerProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  profession: string;
  skills: string[];
  bio?: string;
  location: {
    city: string;
    state: string;
    address?: string;
  };
  yearsOfExperience: number;
  trustScore: number;
  totalJobsCompleted: number;
  averageRating: number;
  verifiedWorker: boolean;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WorkerProfileSchema = new mongoose.Schema<IWorkerProfile>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One profile per user
      index: true,
    },
    profession: {
      type: String,
      required: [true, 'Profession is required'],
      trim: true,
      index: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio must be under 500 characters'],
      default: '',
    },
    location: {
      city:    { type: String, required: true },
      state:   { type: String, required: true },
      address: { type: String, default: '' },
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
      min: 0,
      max: 60,
    },
    trustScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    totalJobsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    verifiedWorker: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index for the worker search/directory page
WorkerProfileSchema.index({ profession: 1, 'location.state': 1, trustScore: -1 });

const WorkerProfile: Model<IWorkerProfile> =
  mongoose.models.WorkerProfile ??
  mongoose.model<IWorkerProfile>('WorkerProfile', WorkerProfileSchema);

export default WorkerProfile;