export interface Submission {
  taskId: string;
  status: "pending" | "approved" | "rejected";
}
