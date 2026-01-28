"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ClipboardList, CheckCircle, Clock, X, Coins, AlertCircle } from "lucide-react";
import { notifyAdminsOfSubmission } from "@/lib/notification-service";
import { Progress } from "@/components/ui/progress";
import { Submission } from "@/types/submission"; // Assuming Submission type is defined in "@/types/submission"
import { SubmissionDetail } from "@/types/submission-detail"; // Assuming SubmissionDetail type is defined in "@/types/submission-detail"
import { Users } from "lucide-react"; // Import Users component

interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  isPublished: boolean;
  workerLimit: number;
  createdAt: Date;
}

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [proofText, setProofText] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submissionCounts, setSubmissionCounts] = useState<{ [key: string]: number }>({});
  const [submissionDetails, setSubmissionDetails] = useState<(Submission & SubmissionDetail)[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Real-time listener for published tasks
    const tasksQuery = query(
      collection(db, "tasks"),
      where("isPublished", "==", true)
    );
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Task[];
      setTasks(tasksData);
      setIsInitialLoad(false);
    });

    // Real-time listener for user's submissions
    const submissionsQuery = query(
      collection(db, "taskSubmissions"),
      where("userId", "==", user.uid)
    );
    const unsubscribeUserSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
      const submissionsData = snapshot.docs.map((doc) => ({
        taskId: doc.data().taskId,
        status: doc.data().status,
      })) as Submission[];
      setSubmissions(submissionsData);
    });

    // Real-time listener for all task submissions (for counting)
    const allSubmissionsQuery = collection(db, "taskSubmissions");
    const unsubscribeAllSubmissions = onSnapshot(allSubmissionsQuery, (snapshot) => {
      const counts: { [key: string]: number } = {};
      snapshot.docs.forEach((doc) => {
        const taskId = doc.data().taskId;
        if (taskId) {
          counts[taskId] = (counts[taskId] || 0) + 1;
        }
      });
      setSubmissionCounts(counts);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeUserSubmissions();
      unsubscribeAllSubmissions();
    };
  }, [user]);

  const getTaskSubmissionStatus = (taskId: string) => {
    return submissions.find((s) => s.taskId === taskId);
  };

  const handleSubmitTask = async () => {
    if (!user || !selectedTask) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "taskSubmissions"), {
        taskId: selectedTask.id,
        taskTitle: selectedTask.title,
        userId: user.uid,
        userEmail: user.email,
        proofText,
        proofUrl,
        reward: selectedTask.reward,
        status: "pending",
        type: "task",
        createdAt: serverTimestamp(),
      });

      // Notify admins of new submission
      await notifyAdminsOfSubmission(
        user.uid,
        user.displayName || user.email || "User",
        selectedTask.title,
        proofText,
        selectedTask.reward
      );

      setSubmissions([...submissions, { taskId: selectedTask.id, status: "pending" }]);
      setDialogOpen(false);
      setProofText("");
      setProofUrl("");
      setSelectedTask(null);
    } catch (error) {
      console.error("[v0] Error submitting task:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pb-24">
      <div className="max-w-6xl mx-auto w-full px-4 md:px-6 lg:px-8 pt-4 md:pt-6 lg:pt-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-900">Available Tasks</h1>
          <p className="text-emerald-700 mt-1">Complete tasks to earn rewards</p>
        </div>

        {isInitialLoad ? (
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-12">
              <div className="animate-pulse space-y-4">
                <div className="h-32 bg-gray-200 rounded" />
                <div className="h-32 bg-gray-200 rounded" />
                <div className="h-32 bg-gray-200 rounded" />
              </div>
            </CardContent>
          </Card>
        ) : tasks.length === 0 ? (
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-12 text-center">
              <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">No tasks available</h3>
              <p className="text-gray-500 mt-1">Check back later for new tasks</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {/* Sort tasks: unsubmitted first (by newest), then submitted (by newest) */}
            {[...tasks]
              .sort((a, b) => {
                const aSubmitted = submissions.some((s) => s.taskId === a.id);
                const bSubmitted = submissions.some((s) => s.taskId === b.id);
                
                // If one is submitted and the other is not, unsubmitted comes first
                if (aSubmitted !== bSubmitted) {
                  return aSubmitted ? 1 : -1;
                }
                
                // If both have same submission status, sort by createdAt (newest first)
                return b.createdAt.getTime() - a.createdAt.getTime();
              })
              .map((task) => {
              const submission = getTaskSubmissionStatus(task.id);
              const submittedCount = submissionCounts[task.id] || 0;
              const spotsRemaining = task.workerLimit - submittedCount;
              const isFull = spotsRemaining <= 0;

              return (
                <Card key={task.id} className="border-0 shadow-md bg-white">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-emerald-900">{task.title}</CardTitle>
                        <CardDescription className="mt-1">{task.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2 bg-emerald-100 px-3 py-1 rounded-full">
                        <Coins className="h-4 w-4 text-emerald-600" />
                        <span className="font-semibold text-emerald-700">৳{task.reward.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold tracking-wide ${
                          isFull ? "text-red-600" : "text-blue-700"
                        }`}>
                          {submittedCount} OF {task.workerLimit}
                        </span>
                        {!isFull && (
                          <span className="text-xs font-medium text-gray-500">
                            {spotsRemaining} {spotsRemaining === 1 ? "spot" : "spots"} left
                          </span>
                        )}
                        {isFull && (
                          <span className="text-xs font-medium text-red-500">
                            Full
                          </span>
                        )}
                      </div>
                      <Progress 
                        value={(submittedCount / task.workerLimit) * 100} 
                        className={`h-2 ${isFull ? "[&>div]:bg-red-500" : "[&>div]:bg-blue-600"}`}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {submission ? (
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                        submission.status === "approved"
                          ? "bg-emerald-50 text-emerald-700"
                          : submission.status === "rejected"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700"
                      }`}>
                        {submission.status === "approved" ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : submission.status === "rejected" ? (
                          <X className="h-5 w-5" />
                        ) : (
                          <Clock className="h-5 w-5" />
                        )}
                        <span className="font-medium">
                          {submission.status === "approved"
                            ? "Task completed and approved!"
                            : submission.status === "rejected"
                            ? "Submission rejected"
                            : "Submission pending review"}
                        </span>
                      </div>
                    ) : isFull ? (
                      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <span className="font-medium text-red-700">
                          This task is full. No more submissions allowed.
                        </span>
                      </div>
                    ) : (
                      <Dialog open={dialogOpen && selectedTask?.id === task.id} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => setSelectedTask(task)}
                          >
                            Submit Task
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-emerald-900">Submit Task Proof</DialogTitle>
                            <DialogDescription>
                              Provide proof of completing &quot;{task.title}&quot;
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label htmlFor="proofText">Description / Notes</Label>
                              <Textarea
                                id="proofText"
                                placeholder="Describe how you completed the task..."
                                value={proofText}
                                onChange={(e) => setProofText(e.target.value)}
                                className="min-h-[100px] border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="proofUrl">Proof URL (optional)</Label>
                              <Input
                                id="proofUrl"
                                type="url"
                                placeholder="https://..."
                                value={proofUrl}
                                onChange={(e) => setProofUrl(e.target.value)}
                                className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                              />
                            </div>
                            <div className="flex gap-3 justify-end">
                              <Button
                                variant="outline"
                                onClick={() => setDialogOpen(false)}
                                className="border-gray-200 bg-transparent"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleSubmitTask}
                                disabled={loading || !proofText}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                {loading ? "Submitting..." : "Submit"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
