export type JobStatus = 'pending' | 'success' | 'error';

export interface BackgroundJob {
    id: string;
    title: string;
    description: string;
    status: JobStatus;
    progress?: number;
    error?: string;
}

type JobUpdatePayload = Partial<BackgroundJob> & { id: string };

class JobEventManager {
    private target = new EventTarget();

    addJob(job: BackgroundJob) {
        this.emit('job-added', job);
    }

    updateJob(id: string, updates: Partial<BackgroundJob>) {
        this.emit('job-updated', { id, ...updates });
    }

    removeJob(id: string) {
        this.emit('job-removed', { id });
    }

    subscribe(event: 'job-added' | 'job-updated' | 'job-removed', callback: (payload: any) => void) {
        const handler = (e: Event) => callback((e as CustomEvent).detail);
        this.target.addEventListener(event, handler);
        return () => this.target.removeEventListener(event, handler);
    }

    private emit(event: string, detail: any) {
        this.target.dispatchEvent(new CustomEvent(event, { detail }));
    }
}

export const jobBus = new JobEventManager();
