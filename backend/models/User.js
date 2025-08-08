// backend/models/User.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

/* ------- Subdocs ------- */

// Payer/Artist profile (optional)
const payerProfileSchema = new Schema({
  displayName: { type: String, trim: true },
  artistName:  { type: String, trim: true },
  genres:      [{ type: String, trim: true }],
  bio:         { type: String, trim: true },
  rating:      { type: Number, min: 0, max: 5, default: 0 },
}, { _id: false });

// Worker/Listener profile (optional)
const workerProfileSchema = new Schema({
  displayName:   { type: String, trim: true },
  preferredTags: [{ type: String, trim: true }],
  minPayout:     { type: Number, default: 0 },
  reviewsCount:  { type: Number, default: 0 },
  rating:        { type: Number, min: 0, max: 5, default: 0 },
}, { _id: false });

// Account / record-keeping
const accountSchema = new Schema({
  accountId:      { type: String, index: true }, // if you have an external ID
  username:       { type: String, trim: true, lowercase: true, unique: true, sparse: true },
  status:         { type: String, enum: ['active','pending','suspended','deleted'], default: 'active'},
  lastActiveAt:   { type: Date },                          // Last Active/Signed In
  verifiedAt:     { type: Date },                          // Date Verified (null if not)
  subscription:   { type: String, enum: ['free','premium','pro'], default: 'free' }, // Subscription type
  isValid:        { type: Boolean, default: false },       // your internal validation flag
  isActive:       { type: Boolean, default: true },        // separate from status for soft-toggle
  region:         { type: String, trim: true },            // e.g. "US"
  language:       { type: String, trim: true },            // e.g. "en"
  affiliateId:    { type: String, trim: true },            // referral/affiliate tracking
  groups:         [{ type: String, trim: true }],          // or ObjectIds to a Groups collection
  campaigns:      [{ type: String, trim: true }],          // or ObjectIds to a Campaigns collection
  isEnrolled:     { type: Boolean, default: false },
  isMarketable:   { type: Boolean, default: false },       // (fixed name)
}, { _id: false });

// Personal info
const personalSchema = new Schema({
  name:    { type: String, trim: true },
  email:   { type: String, required: true, unique: true, lowercase: true, trim: true },
  age:     { type: Number, min: 0, max: 150 },
  bio:     { type: String, trim: true },
}, { _id: false });

// Social / web presence
const socialsSchema = new Schema({
  website:    { type: String, trim: true },
  spotify:    { type: String, trim: true },
  instagram:  { type: String, trim: true },
  twitter:    { type: String, trim: true },
  tiktok:     { type: String, trim: true },
  youtube:    { type: String, trim: true },
}, { _id: false });

// Preferences
const preferencesSchema = new Schema({
  likes:    [{ type: String, trim: true }],
  dislikes: [{ type: String, trim: true }],
}, { _id: false });

// Payment & API placeholders
const paymentSchema = new Schema({
  preferredMethod: { type: String, enum: ['none','paypal','stripe','bank'], default: 'none' },
  paypalEmail:     { type: String, trim: true },
  stripeConnectId: { type: String, trim: true },
}, { _id: false });

const apiSchema = new Schema({
  keyHash:   { type: String }, // store a hash, not the raw key
  enabled:   { type: Boolean, default: false },
}, { _id: false });

/* ------- Usage Limits & Counters ------- */

const limitsSchema = new Schema({
  // payer limits
  maxOpenJobs:        { type: Number, default: 10 },
  maxPostsPerDay:     { type: Number, default: 5 },
  // worker limits
  maxActiveAccepts:   { type: Number, default: 10 },
  maxAcceptsPerDay:   { type: Number, default: 6 },
}, { _id: false });

const countersSchema = new Schema({
  // payer side
  openJobs:        { type: Number, default: 0 },  // number of jobs currently open/full
  postedToday:     { type: Number, default: 0 },
  postedTotal:     { type: Number, default: 0 },
  // worker side
  activeAccepts:   { type: Number, default: 0 },  // currently accepted & not completed
  acceptedToday:   { type: Number, default: 0 },
  completedTotal:  { type: Number, default: 0 },
  // housekeeping
  lastCountersReset: { type: Date, default: () => new Date() },
}, { _id: false });

/* ------- Root User ------- */

const userSchema = new Schema({
  // Auth
  passwordHash: { type: String, required: true },

  // Roles (Type: Payer / Worker)
  roles:  { type: [String], enum: ['payer','worker'], default: [] },
  payer:  payerProfileSchema,
  worker: workerProfileSchema,

  // Aggregated profile blocks
  account:     accountSchema,
  personal:    personalSchema,     // includes email
  socials:     socialsSchema,
  preferences: preferencesSchema,
  payment:     paymentSchema,
  api:         apiSchema,

  // Limits & counters
  limits:      { type: limitsSchema,   default: () => ({}) },
  counters:    { type: countersSchema, default: () => ({}) },

  // Legacy/common fields (optional)
  avatarUrl:   { type: String, trim: true },
  tags:        [{ type: String, trim: true }], // for future AI matching
}, { timestamps: true });

/* ------- Helpers ------- */

// Lazy daily reset (call this in routes before enforcing limits)
userSchema.methods.maybeResetDailyCounters = function () {
  const now = new Date();
  const last = this.counters?.lastCountersReset ? new Date(this.counters.lastCountersReset) : new Date(0);
  if (now.toDateString() !== last.toDateString()) {
    this.counters.postedToday = 0;
    this.counters.acceptedToday = 0;
    this.counters.lastCountersReset = now;
  }
};

/* ------- Indexes ------- */

userSchema.index({ 'worker.reviewsCount': 1 });
userSchema.index({ 'account.subscription': 1 });
userSchema.index({ 'account.status': 1 });
userSchema.index({ roles: 1 });

// IMPORTANT: You already have unique indexes at field level for:
// - personal.email (unique)
// - account.username (unique, sparse)
// Do not add a duplicate root-level `email` index.

/* ------- Export ------- */

export default mongoose.models.User || mongoose.model('User', userSchema);