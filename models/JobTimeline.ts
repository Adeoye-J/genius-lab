import mongoose, { Document, Model } from 'mongoose';

export interface IJobTimeline extends Document {
  _id: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  status: string;
  updatedBy: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const JobTimelineSchema = new mongoose.Schema<IJobTimeline>(
  {
    jobId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Job',  required: true, index: true },
    status:    { type: String, required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes:     { type: String, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

const JobTimeline: Model<IJobTimeline> =
  mongoose.models.JobTimeline ?? mongoose.model<IJobTimeline>('JobTimeline', JobTimelineSchema);

export default JobTimeline;