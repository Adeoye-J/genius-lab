"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Job {
  _id: string;
  title: string;
  price: number;
  status: string;
  createdAt: string;
  completedAt?: string;
  workerId: { profession: string; trustScore: number };
  location: { city: string; state: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  requested: {
    label: "Pending",
    color: "bg-amber-100 text-amber-800 border-amber-200",
  },
  accepted: {
    label: "Accepted",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  in_progress: {
    label: "In Progress",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  completed: {
    label: "Awaiting payment",
    color: "bg-orange-100 text-orange-800 border-orange-200",
  },
  paid: { label: "Paid", color: "bg-accent/10 text-accent border-accent/20" },
  cancelled: {
    label: "Cancelled",
    color: "bg-muted text-muted-foreground border-border",
  },
};

export default function CustomerHistoryPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/jobs?limit=50");
    const data = await res.json();
    if (data.success) setJobs(data.data.jobs);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return (
    <div className="max-w-4xl">
      {/* HEADER */}
      <div className="mb-8">
         <p className="text-foreground font-semibold text-xl mb-1 capitalize">Your jobs</p>
          <p className="text-sm text-foreground/60">Track and manage all your requests</p>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-gray-100 animate-pulse rounded-xl"
            />
          ))}
        </div>
      )}

      {/* EMPTY */}
      {!loading && jobs.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🧑‍🔧</div>
          <p className="text-lg font-semibold text-gray-900">No jobs yet</p>
          <p className="text-sm text-gray-500 mt-1">Start by hiring a worker</p>
          <Link
            href="/workers"
            className="inline-block mt-5 bg-black text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-gray-800 transition"
          >
            Browse workers
          </Link>
        </div>
      )}

      {/* LIST */}
      {!loading && jobs.length > 0 && (
        <div className="space-y-4">
          {jobs.map((job) => {
            const cfg = STATUS_CONFIG[job.status] ?? {
              label: job.status,
              color: "bg-gray-100 text-gray-600 border-gray-200",
            };

            return (
              <Link
                key={job._id}
                href={`/jobs/${job._id}`}
                className="group block bg-surface-muted rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden dark:border-2"
              >
                {/* LEFT COLOR BAR */}
                <div className="flex">
                  <div className={`w-1.5 ${cfg.color.split(" ")[0]}`} />

                  {/* CONTENT */}
                  <div className="flex-1 p-5">
                    {/* TOP ROW */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:underline capitalize">
                          {job.title}
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                          {job.workerId.profession} · {job.location.city}
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(job.createdAt).toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          ₦{job.price.toLocaleString("en-NG")}
                        </p>

                        <span
                          className={`inline-block mt-1 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.color}`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    </div>

                    {/* PAYMENT WARNING */}
                    {job.status === "completed" && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-orange-600">
                        <span>⚠</span>
                        <span>Payment required</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
