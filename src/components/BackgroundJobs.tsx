"use client";

import { useEffect, useState } from "react";
import { BackgroundJob, jobBus } from "@/lib/job-events";
import { Loader2, CheckCircle2, XCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackgroundJobs() {
    const [jobs, setJobs] = useState<BackgroundJob[]>([]);

    useEffect(() => {
        const unsubAdd = jobBus.subscribe('job-added', (job) => {
            setJobs(prev => {
                if (prev.find(j => j.id === job.id)) return prev;
                return [...prev, job];
            });
        });

        const unsubUpdate = jobBus.subscribe('job-updated', (update) => {
            setJobs(prev => prev.map(j => j.id === update.id ? { ...j, ...update } : j));

            // Auto close success/error jobs after 5s
            if (update.status === 'success' || update.status === 'error') {
                setTimeout(() => {
                    setJobs(prev => prev.filter(j => j.id !== update.id));
                }, 5000);
            }
        });

        const unsubRemove = jobBus.subscribe('job-removed', ({ id }) => {
            setJobs(prev => prev.filter(j => j.id !== id));
        });

        return () => {
            unsubAdd();
            unsubUpdate();
            unsubRemove();
        };
    }, []);

    if (jobs.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
            {jobs.map(job => (
                <div key={job.id} className="bg-white border shadow-lg rounded-xl p-3 text-sm flex items-start gap-3 animate-in slide-in-from-bottom-5">
                    {job.status === 'pending' && <Loader2 className="w-5 h-5 text-indigo-500 animate-spin shrink-0" />}
                    {job.status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                    {job.status === 'error' && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}

                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate flex items-center gap-2">
                            {job.title}
                        </div>
                        <div className="text-slate-500 text-xs line-clamp-2 mt-0.5">{job.error || job.description}</div>
                        {job.status === 'pending' && job.progress !== undefined && (
                            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${job.progress}%` }} />
                            </div>
                        )}
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 text-slate-400 hover:text-slate-900"
                        onClick={() => setJobs(prev => prev.filter(j => j.id !== job.id))}
                    >
                        <X className="w-3 h-3" />
                    </Button>
                </div>
            ))}
        </div>
    );
}
