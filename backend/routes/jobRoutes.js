// backend/routes/jobRoutes.js
import express from 'express';
import Job from '../models/Job.js';
import Review from '../models/Review.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const router = express.Router();

/** Create job (payer) */
router.post('/', async (req, res) => {
  try {
    const payerId = req.body.payerId; // from auth in real app
    const job = await Job.create({
      payerId,
      title: req.body.title,
      link: req.body.link,
      description: req.body.description,
      tags: req.body.tags || [],
      maxListeners: req.body.maxListeners,
      payoutPerReview: req.body.payoutPerReview ?? 0,
      isBetaFree: req.body.isBetaFree ?? false,
      expireAt: req.body.expireAt // optional
    });
    res.status(201).json(job);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/** List open jobs (worker dashboard) */
router.get('/', async (req, res) => {
  const { tag } = req.query;
  const query = { status: 'open' };
  if (tag) query.tags = tag;
  const jobs = await Job.find(query).sort({ publishedAt: -1 }).limit(50);
  res.json(jobs);
});

/** Worker accepts a job */
router.post('/:jobId/accept', async (req, res) => {
  const { jobId } = req.params;
  const workerId = req.body.workerId; // from auth in real app
  const dueMinutes = Number(req.body.dueMinutes ?? 60);

  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (job.status !== 'open' && job.status !== 'full') {
    return res.status(400).json({ error: 'Job not accepting assignments' });
  }

  const already = job.assignments.find(a => a.workerId.toString() === workerId);
  if (already) return res.status(400).json({ error: 'Already accepted' });

  const active = job.assignments.filter(a => a.status === 'accepted').length;
  if (active >= job.maxListeners) return res.status(400).json({ error: 'Cap reached' });

  job.assignments.push({
    workerId: new mongoose.Types.ObjectId(workerId),
    dueAt: new Date(Date.now() + dueMinutes * 60 * 1000),
  });

  // If now at cap, mark full
  const newActive = active + 1;
  if (newActive >= job.maxListeners) job.status = 'full';

  await job.save();
  res.json(job);
});

/** Worker completes: submit a review */
router.post('/:jobId/reviews', async (req, res) => {
  const { jobId } = req.params;
  const workerId = req.body.workerId; // from auth
  const { rating, feedback } = req.body;

  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  // Ensure assignment exists and is accepted
  const a = job.assignments.find(x => x.workerId.toString() === workerId && x.status === 'accepted');
  if (!a) return res.status(400).json({ error: 'No active assignment' });
  if (a.dueAt && Date.now() > new Date(a.dueAt).getTime()) {
    a.status = 'expired';
    await job.save();
    return res.status(400).json({ error: 'Assignment expired' });
  }

  const review = await Review.create({
    jobId: job._id,
    payerId: job.payerId,
    workerId,
    rating,
    feedback,
    isValid: false // will validate later (>=5 rule/moderation)
  });

  // mark assignment completed
  a.status = 'completed';
  a.completedAt = new Date();
  a.reviewId = review._id;

  // update job aggregates
  const newCount = job.ratingCount + 1;
  const newAvg = (job.ratingAvg * job.ratingCount + rating) / newCount;
  job.ratingCount = newCount;
  job.ratingAvg = newAvg;

  // optional: close job when all done
  const unfinished = job.assignments.some(x => x.status === 'accepted');
  if (!unfinished && job.status !== 'closed') job.status = 'closed';

  await job.save();

  // increment worker's reviewsCount (for validation rule)
  await User.updateOne(
    { _id: workerId },
    { $inc: { 'worker.reviewsCount': 1 } }
  );

  res.status(201).json({ review, job });
});

export default router;


// import express from 'express';
// import Job from '../models/Job.js';

// const router = express.Router();

// // POST a new job
// router.post('/', async (req, res) => {
//   try {
//     const job = new Job(req.body);
//     await job.save();
//     res.status(201).json(job);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

// // GET all jobs
// router.get('/', async (req, res) => {
//   try {
//     const jobs = await Job.find();
//     res.json(jobs);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// export default router;
