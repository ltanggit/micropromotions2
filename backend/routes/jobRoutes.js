import express from 'express';
import mongoose from 'mongoose';
import Job from '../models/Job.js';
import Review from '../models/Review.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = express.Router();

/** Create job (payer) */
router.post('/', auth(true), requireRole('payer'), async (req, res) => {
  try {
    const {
      title, link, description, tags = [],
      maxListeners, payoutPerReview = 0,
      isBetaFree = false, expireAt
    } = req.body;

    const job = await Job.create({
      payerId: new mongoose.Types.ObjectId(req.user.id),
      title, link, description, tags,
      maxListeners, payoutPerReview,
      isBetaFree, expireAt
    });

    res.status(201).json(job);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/** List jobs (worker dashboard) with filters & pagination */
router.get('/', auth(false), async (req, res) => {
  const {
    status = 'open', tag, q,
    page = 1, limit = 20,
    sort = 'publishedAt', dir = 'desc'
  } = req.query;

  const query = {};
  if (status) query.status = status;
  if (tag) query.tags = tag;
  if (q) { // basic text search over title/description
    query.$or = [
      { title:       { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { tags:        { $regex: q, $options: 'i' } },
    ];
  }

  const skip = (Math.max(+page,1)-1) * Math.min(+limit,100);
  const sortObj = { [sort]: dir === 'asc' ? 1 : -1 };

  const [items, total] = await Promise.all([
    Job.find(query).sort(sortObj).skip(skip).limit(Math.min(+limit,100)),
    Job.countDocuments(query)
  ]);

  res.json({
    items,
    page: +page,
    limit: Math.min(+limit,100),
    total,
    pages: Math.ceil(total / Math.min(+limit,100))
  });
});

/** Get job by id */
router.get('/:jobId', auth(false), async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Not found' });
  res.json(job);
});

/** Worker accepts a job */
router.post('/:jobId/accept', auth(true), requireRole('worker'), async (req, res) => {
  try {
    const { jobId } = req.params;
    const { dueMinutes = 60 } = req.body;
    const workerId = req.user.id;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    if (!['open','full'].includes(job.status)) {
      return res.status(400).json({ error: 'Job not accepting assignments' });
    }

    // already accepted?
    const exists = job.assignments.find(a => a.workerId?.toString() === workerId && a.status === 'accepted');
    if (exists) return res.status(400).json({ error: 'Already accepted' });

    // capacity check
    const active = job.assignments.filter(a => a.status === 'accepted').length;
    if (active >= job.maxListeners) return res.status(400).json({ error: 'Capacity reached' });

    job.assignments.push({
      workerId: new mongoose.Types.ObjectId(workerId),
      dueAt: new Date(Date.now() + Number(dueMinutes) * 60 * 1000),
      status: 'accepted'
    });

    const newActive = active + 1;
    if (newActive >= job.maxListeners) job.status = 'full';

    await job.save();
    res.json(job);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/** Displays jobs a worker has accepted */
router.get('/mine/accepted', auth(true), requireRole('worker'), async (req, res) => {
  const items = await Job.find({
    'assignments.workerId': req.user.id,
    'assignments.status': 'accepted'
  }).sort({ publishedAt: -1 }).limit(50);
  res.json(items);
});

/** Worker releases an accepted job (optional) */
router.post('/:jobId/release', auth(true), requireRole('worker'), async (req, res) => {
  const { jobId } = req.params;
  const workerId = req.user.id;

  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const a = job.assignments.find(x => x.workerId?.toString() === workerId && x.status === 'accepted');
  if (!a) return res.status(400).json({ error: 'No active assignment to release' });

  a.status = 'rejected'; // or 'expired'
  await job.save();

  // If freeing capacity, re-open if previously full
  const active = job.assignments.filter(x => x.status === 'accepted').length;
  if (job.status === 'full' && active < job.maxListeners) {
    job.status = 'open';
    await job.save();
  }

  res.json(job);
});

/** Submit review & complete */
router.post('/:jobId/reviews', auth(true), requireRole('worker'), async (req, res) => {
  try {
    const { jobId } = req.params;
    const workerId = req.user.id;
    const { rating, feedback } = req.body;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // Must have active assignment
    const a = job.assignments.find(
      x => x.workerId?.toString() === workerId && x.status === 'accepted'
    );
    if (!a) return res.status(400).json({ error: 'No active assignment' });

    // Expired?
    if (a.dueAt && Date.now() > new Date(a.dueAt).getTime()) {
      a.status = 'expired';
      await job.save();
      return res.status(400).json({ error: 'Assignment expired' });
    }

    // Create Review
    const review = await Review.create({
      jobId: job._id,
      payerId: job.payerId,
      workerId,
      rating,
      feedback,
      isValid: false, // validate later (>= 5 reviews rule, moderation)
    });

    // mark assignment completed
    a.status = 'completed';
    a.completedAt = new Date();
    a.reviewId = review._id;

    // update aggregates
    const newCount = job.ratingCount + 1;
    const newAvg = (job.ratingAvg * job.ratingCount + Number(rating)) / newCount;
    job.ratingCount = newCount;
    job.ratingAvg = newAvg;

    // optional: auto-close if all done
    const stillActive = job.assignments.some(x => x.status === 'accepted');
    if (!stillActive && job.status === 'full') job.status = 'closed';

    await job.save();
    res.status(201).json({ review, job });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/** Payer closes job manually */
router.patch('/:jobId/close', auth(true), requireRole('payer'), async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Not found' });
  if (job.payerId.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Not your job' });
  }
  job.status = 'closed';
  await job.save();
  res.json(job);
});

export default router;
