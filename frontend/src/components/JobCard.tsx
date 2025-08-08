import Link from 'next/link';

type Job = {
  _id: string;
  title: string;
  description?: string;
  tags?: string[];
  status: 'open'|'full'|'closed'|'expired';
  publishedAt?: string;
  payoutPerReview?: number;
  ratingAvg?: number;
  ratingCount?: number;
};

export default function JobCard({ job }: { job: Job }) {
  return (
    <div className="border rounded p-4 hover:shadow-sm transition">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{job.title}</h3>
        <span className="text-xs px-2 py-1 rounded border bg-black-100">{job.status}</span>
      </div>
      {job.description && <p className="mt-2 text-sm text-white-700 line-clamp-2">{job.description}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {(job.tags || []).map(t => (
          <span key={t} className="text-xs bg-black-100 px-2 py-1 rounded border">{t}</span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {job.ratingAvg?.toFixed?.(1) ?? '—'} ★ ({job.ratingCount ?? 0})
        </div>
        <Link href={`/jobs/${job._id}`} className="text-sm underline">View</Link>
      </div>
    </div>
  );
}