export interface SubmissionDetail {
  id: string;
  taskTitle: string;
  platform?: string;
  description: string;
  amount?: number;
  status: "pending" | "approved" | "rejected";
  type: "task" | "manual";
  createdAt: Date;
  reward?: number;
}
