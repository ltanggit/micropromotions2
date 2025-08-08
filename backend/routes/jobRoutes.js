// backend/routes/jobRoutes.js
import express from 'express';
import mongoose from 'mongoose';
import Job from '../models/Job.js';
import Review from '../models/Review.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = express.Router();

/* -----------------------------------------------------------
   Create job (payer only) — Enforce payer quotas
----------------------------------------------------------- */
router.post('/', auth(true), requireRole('payer'), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const payerId = req.user.id;

    const {
      title, link, description, tags = [],
      maxListeners, payoutPerReview = 0,
      isBetaFree = false, expireAt
    } = req.body;

    if (!title || !link || !maxListeners) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ error: 'title, link, and maxListeners are required' });
    }

    const payer = await User.findById(payerId).session(session);
    if (!payer) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ error: 'Payer not found' });
    }

    payer.maybeResetDailyCounters?.();

    const { maxOpenJobs = 5, maxPostsPerDay = 10 } = payer.limits || {};
    if ((payer.counters?.openJobs || 0) >= maxOpenJobs) {
      await session.abortTransaction(); session.endSession();
      return res.status(403).json({ error: 'Open job limit reached' });
    }
    if ((payer.counters?.postedToday || 0) >= maxPostsPerDay) {
      await session.abortTransaction(); session.endSession();
      return res.status(403).json({ error: 'Daily post limit reached' });
    }

    const [job] = await Job.create([{
      payerId: new mongoose.Types.ObjectId(payerId),
      title, link, description, tags,
      maxListeners, payoutPerReview,
      isBetaFree, expireAt
    }], { session });

    // increment payer counters
    payer.counters.openJobs = (payer.counters.openJobs || 0) + 1;
    payer.counters.postedToday = (payer.counters.postedToday || 0) + 1;
    payer.counters.postedTotal = (payer.counters.postedTotal || 0) + 1;
    await payer.save({ session });

    await session.commitTransaction();
    session.endSession();
    return res.status(201).json(job);
  } catch (e) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    return res.status(400).json({ error: e.message });
  }
});

/* -----------------------------------------------------------
   List jobs (public/worker) with filters & pagination
----------------------------------------------------------- */
router.get('/', auth(false), async (req, res) => {
  try {
    const {
      status = 'open', tag, q,
      page = 1, limit = 20,
      sort = 'publishedAt', dir = 'desc'
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (tag) query.tags = tag;
    if (q) {
      query.$or = [
        { title:       { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags:        { $regex: q, $options: 'i' } },
      ];
    }

    const lim = Math.min(Number(limit) || 20, 100);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * lim;
    const sortObj = { [sort]: dir === 'asc' ? 1 : -1 };

    const [items, total] = await Promise.all([
      Job.find(query).sort(sortObj).skip(skip).limit(lim),
      Job.countDocuments(query),
    ]);

    return res.json({
      items,
      total,
      page: Number(page) || 1,
      pages: Math.ceil(total / lim),
      limit: lim
    });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

/* -----------------------------------------------------------
   🟡 Place “mine/*” routes BEFORE “/:jobId” to avoid conflicts
----------------------------------------------------------- */

/** Worker — jobs I’ve accepted (active only) */
router.get('/mine/accepted', auth(true), requireRole('worker'), async (req, res) => {
  const items = await Job.find({
    assignments: {
      $elemMatch: { workerId: new mongoose.Types.ObjectId(req.user.id), status: 'accepted' }
    }
  })
  .sort({ publishedAt: -1 })
  .limit(50);

  return res.json(items);
});

/** Payer — jobs I posted */
router.get('/mine/posted', auth(true), requireRole('payer'), async (req, res) => {
  const items = await Job.find({ payerId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(100);

  return res.json(items);
});

/* -----------------------------------------------------------
   Get job by id (public)
----------------------------------------------------------- */
router.get('/:jobId', auth(false), async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Not found' });
  return res.json(job);
});

/* -----------------------------------------------------------
   Worker accepts a job — Enforce worker quotas
----------------------------------------------------------- */
router.post('/:jobId/accept', auth(true), requireRole('worker'), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { jobId } = req.params;
    const { dueMinutes = 60 } = req.body;
    const workerId = req.user.id;

    const worker = await User.findById(workerId).session(session);
    if (!worker) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ error: 'Worker not found' });
    }

    worker.maybeResetDailyCounters?.();

    const {
      maxActiveAccepts = 5,
      maxAcceptsPerDay = 20
    } = worker.limits || {};

    if ((worker.counters?.activeAccepts || 0) >= maxActiveAccepts) {
      await session.abortTransaction(); session.endSession();
      return res.status(403).json({ error: 'Active accept limit reached' });
    }
    if ((worker.counters?.acceptedToday || 0) >= maxAcceptsPerDay) {
      await session.abortTransaction(); session.endSession();
      return res.status(403).json({ error: 'Daily accept limit reached' });
    }

    const job = await Job.findById(jobId).session(session);
    if (!job) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ error: 'Job not found' });
    }

    if (!['open', 'full'].includes(job.status)) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ error: 'Job not accepting assignments' });
    }

    // already accepted?
    const exists = job.assignments.find(
      a => a.workerId?.toString() === workerId && a.status === 'accepted'
    );
    if (exists) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ error: 'Already accepted' });
    }

    // capacity check
    const active = job.assignments.filter(a => a.status === 'accepted').length;
    if (active >= job.maxListeners) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ error: 'Capacity reached' });
    }

    job.assignments.push({
      workerId: new mongoose.Types.ObjectId(workerId),
      dueAt: new Date(Date.now() + Number(dueMinutes) * 60 * 1000),
      status: 'accepted'
    });

    const newActive = active + 1;
    if (newActive >= job.maxListeners) job.status = 'full';

    await job.save({ session });

    // increment worker counters
    worker.counters.activeAccepts = (worker.counters.activeAccepts || 0) + 1;
    worker.counters.acceptedToday = (worker.counters.acceptedToday || 0) + 1;
    await worker.save({ session });

    await session.commitTransaction();
    session.endSession();
    return res.json(job);
  } catch (e) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    return res.status(400).json({ error: e.message });
  }
});

/* -----------------------------------------------------------
   Worker releases an accepted job — adjust worker counters
----------------------------------------------------------- */
router.post('/:jobId/release', auth(true), requireRole('worker'), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { jobId } = req.params;
    const workerId = req.user.id;

    const job = await Job.findById(jobId).session(session);
    if (!job) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ error: 'Job not found' });
    }

    const a = job.assignments.find(
      x => x.workerId?.toString() === workerId && x.status === 'accepted'
    );
    if (!a) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ error: 'No active assignment to release' });
    }

    a.status = 'rejected'; // or 'expired'
    await job.save({ session });

    // If freeing capacity, re-open if previously full
    const active = job.assignments.filter(x => x.status === 'accepted').length;
    if (job.status === 'full' && active < job.maxListeners) {
      job.status = 'open';
      await job.save({ session });
    }

    // decrement worker active accepts
    const worker = await User.findById(workerId).session(session);
    if (worker) {
      worker.maybeResetDailyCounters?.();
      if ((worker.counters?.activeAccepts || 0) > 0) {
        worker.counters.activeAccepts -= 1;
      }
      await worker.save({ session });
    }

    await session.commitTransaction();
    session.endSession();
    return res.json(job);
  } catch (e) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    return res.status(400).json({ error: e.message });
  }
});

/* -----------------------------------------------------------
   Submit review & complete — adjust worker counters, job
----------------------------------------------------------- */
router.post('/:jobId/reviews', auth(true), requireRole('worker'), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { jobId } = req.params;
    const workerId = req.user.id;
    const { rating, feedback } = req.body;

    if (rating == null || rating < 0 || rating > 5) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ error: 'rating must be between 0 and 5' });
    }

    const job = await Job.findById(jobId).session(session);
    if (!job) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ error: 'Job not found' });
    }

    // Must have active assignment
    const a = job.assignments.find(
      x => x.workerId?.toString() === workerId && x.status === 'accepted'
    );
    if (!a) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ error: 'No active assignment' });
    }

    // Expired?
    if (a.dueAt && Date.now() > new Date(a.dueAt).getTime()) {
      a.status = 'expired';
      await job.save({ session });
      await session.commitTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Assignment expired' });
    }

    // Create Review
    const [review] = await Review.create([{
      jobId: job._id,
      payerId: job.payerId,
      workerId,
      rating,
      feedback,
      isValid: false, // to be validated later
    }], { session });

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

    await job.save({ session });

    // adjust worker counters
    const worker = await User.findById(workerId).session(session);
    if (worker) {
      worker.maybeResetDailyCounters?.();
      if ((worker.counters?.activeAccepts || 0) > 0) {
        worker.counters.activeAccepts -= 1;
      }
      worker.counters.completedTotal = (worker.counters.completedTotal || 0) + 1;
      await worker.save({ session });
    }

    await session.commitTransaction();
    session.endSession();
    return res.status(201).json({ review, job });
  } catch (e) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    return res.status(400).json({ error: e.message });
  }
});

/* -----------------------------------------------------------
   Payer closes job manually — decrement openJobs
----------------------------------------------------------- */
router.patch('/:jobId/close', auth(true), requireRole('payer'), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const job = await Job.findById(req.params.jobId).session(session);
    if (!job) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ error: 'Not found' });
    }
    if (job.payerId.toString() !== req.user.id) {
      await session.abortTransaction(); session.endSession();
      return res.status(403).json({ error: 'Not your job' });
    }

    const wasCounted = ['open', 'full'].includes(job.status);
    job.status = 'closed';
    await job.save({ session });

    if (wasCounted) {
      const payer = await User.findById(job.payerId).session(session);
      if (payer) {
        payer.maybeResetDailyCounters?.();
        if ((payer.counters?.openJobs || 0) > 0) {
          payer.counters.openJobs -= 1;
        }
        await payer.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();
    return res.json(job);
  } catch (e) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    return res.status(400).json({ error: e.message });
  }
});

export default router;