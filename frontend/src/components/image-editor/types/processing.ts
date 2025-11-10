export interface ProcessingJob {
  id: string;
  files: File[]; // Använd File-objekt istället för index
  visualOrder: number[]; // Visuell ordning för filnamn
  profile: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: Date;
}

export interface ProcessingQueue {
  jobs: ProcessingJob[];
  isProcessing: boolean;
}

export interface QueueSummary {
  profile: string;
  count: number;
}

export interface ProfileStatus {
  profile: string;
  count: number;
  status: "ready" | "processing" | "finished" | "failed";
  progress?: number; // 0-100 för progress bar
}
