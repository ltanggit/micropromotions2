// backend/models/Review.js
import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const reviewSchema = new mongoose.Schema({
  jobId:     { type: ObjectId, ref: 'Job', required: true, index: true },
  payerId:   { type: ObjectId, ref: 'User', required: true },  // owner of the job
  workerId:  { type: ObjectId, ref: 'User', required: true, index: true },

  // Content
  rating:    { type: Number, min: 1, max: 5, required: true },
  feedback:  { type: String, trim: true, default: '' },

  // Moderation / validation
  isValid:   { type: Boolean, default: false }, // mark after checks (>=5 rule, anti-spam, etc.)
  flagged:   { type: Boolean, default: false },
  flaggedReason: { type: String, trim: true },

}, { timestamps: true });

reviewSchema.index({ workerId: 1, jobId: 1 }, { unique: true }); // one review per worker per job
reviewSchema.index({ rating: 1 });

export default mongoose.models.Review || mongoose.model('Review', reviewSchema);
