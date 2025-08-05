// backend/models/Job.js
import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const assignmentSchema = new mongoose.Schema({
  workerId:    { type: ObjectId, ref: 'User', required: true, index: true },
  status:      { type: String, enum: ['accepted','completed','expired','rejected'], default: 'accepted' },
  acceptedAt:  { type: Date, default: Date.now },
  dueAt:       { type: Date },           // set when assigned (time-sensitive window)
  completedAt: { type: Date },
  reviewId:    { type: ObjectId, ref: 'Review' }  // link to submitted review, if any
}, { _id: false });

const jobSchema = new mongoose.Schema({
  payerId:      { type: ObjectId, ref: 'User', required: true, index: true },

  // Submission
  title:        { type: String, required: true, trim: true },
  link:         { type: String, required: true, trim: true }, // song/audio/video link
  description:  { type: String, trim: true },
  tags:         [{ type: String, trim: true }],  // genre/mood/etc.

  // Capacity & payout
  maxListeners: { type: Number, required: true, min: 1 }, // cap how many can accept
  payoutPerReview: { type: Number, default: 0 }, // free beta? set 0

  // Lifecycle & visibility
  status:       { type: String, enum: ['open','full','closed','expired'], default: 'open', index: true },
  isBetaFree:   { type: Boolean, default: false },
  publishedAt:  { type: Date, default: Date.now },
  expireAt:     { type: Date }, // optional TTL (auto-expire job after X)

  // Assignments (who picked it up)
  assignments:  { type: [assignmentSchema], default: [] },

  // Ratings summary (from reviews)
  ratingCount:  { type: Number, default: 0 },
  ratingAvg:    { type: Number, default: 0, min: 0, max: 5 },

}, { timestamps: true });

// Useful indexes
jobSchema.index({ status: 1, publishedAt: -1 });
jobSchema.index({ tags: 1 });
jobSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 }); // enable TTL when you set expireAt

// Helper method: how many active accepts?
jobSchema.methods.activeAccepts = function () {
  return this.assignments.filter(a => a.status === 'accepted').length;
};

export default mongoose.models.Job || mongoose.model('Job', jobSchema);