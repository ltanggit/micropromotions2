// backend/models/User.js
import mongoose from 'mongoose';

const payerProfileSchema = new mongoose.Schema({
  displayName: { type: String, trim: true },
  artistName:  { type: String, trim: true },
  website:     { type: String, trim: true },
  genres:      [{ type: String, trim: true }],
  bio:         { type: String, trim: true },
}, { _id: false });

const workerProfileSchema = new mongoose.Schema({
  displayName:   { type: String, trim: true },
  preferredTags: [{ type: String, trim: true }],
  minPayout:     { type: Number, default: 0 },
  reviewsCount:  { type: Number, default: 0 },
  rating:        { type: Number, min: 0, max: 5, default: 0 },
}, { _id: false });

const userSchema = new mongoose.Schema({
  // Auth
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },

  // Roles
  roles:  { type: [String], enum: ['payer','worker'], index: true, default: [] },
  payer:  payerProfileSchema,
  worker: workerProfileSchema,

  // Common profile
  avatarUrl: { type: String, trim: true },
  tags:      [{ type: String, trim: true }],
  isActive:  { type: Boolean, default: true },
}, { timestamps: true });

// Keep only the nested index via schema.index():
userSchema.index({ 'worker.reviewsCount': 1 });

export default mongoose.models.User || mongoose.model('User', userSchema);
