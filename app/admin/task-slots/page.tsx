"use client";

import { useEffect, useState } from "react";
import { collection, updateDoc, doc, onSnapshot, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Edit, AlertCircle } from "lucide-react";

interface TaskSlot {
  id: string;
  title: string;
  workerLimit: number;
  submittedCount: number;
  reward: number;
  isPublished: boolean;
}

const fetchTasks = async (setTasks: any) => {
  const q = query(collection(db, "tasks"), orderBy("reward", "desc"));
  const querySnapshot = await getDocs(q);
  const tasksData = querySnapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      title: data.title,
      workerLimit: data.workerLimit || 0,
      submittedCount: data.submittedCount || 0,
      reward: data.reward,
      isPublished: data.isPublished,
    };
  });
  setTasks(tasksData);
};

export default function TaskSlotsPage() {
  const [tasks, setTasks] = useState<TaskSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskSlot | null>(null);
  const [newLimit, setNewLimit] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [submissionCounts, setSubmissionCounts] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    // Real-time listener for tasks
    const unsubscribeTasks = onSnapshot(collection(db, "tasks"), (snapshot) => {
      const tasksData = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title,
          workerLimit: data.workerLimit || 0,
          submittedCount: submissionCounts[docSnap.id] || 0,
          reward: data.reward,
          isPublished: data.isPublished,
        };
      });
      // Sort by newest first (using reward as proxy since createdAt may not exist on all)
      setTasks(tasksData);
      setLoading(false);
    });

    // Real-time listener for submissions to count per task
    const unsubscribeSubmissions = onSnapshot(collection(db, "taskSubmissions"), (snapshot) => {
      const counts: { [key: string]: number } = {};
      snapshot.docs.forEach((docSnap) => {
        const taskId = docSnap.data().taskId;
        if (taskId) {
          counts[taskId] = (counts[taskId] || 0) + 1;
        }
      });
      setSubmissionCounts(counts);
      
      // Update task counts
      setTasks((prevTasks) =>
        prevTasks.map((task) => ({
          ...task,
          submittedCount: counts[task.id] || 0,
        }))
      );
    });

    return () => {
      unsubscribeTasks();
      unsubscribeSubmissions();
    };
  }, [submissionCounts]);

  const openEditDialog = (task: TaskSlot) => {
    setSelectedTask(task);
    setNewLimit(task.workerLimit.toString());
    setDialogOpen(true);
  };

  const handleUpdateLimit = async () => {
    if (!selectedTask || !newLimit) return;

    const newLimitNum = parseInt(newLimit);
    if (newLimitNum < selectedTask.submittedCount) {
      alert(
        `Cannot set limit below ${selectedTask.submittedCount} submissions already made`
      );
      return;
    }

    setActionLoading(true);
    try {
      await updateDoc(doc(db, "tasks", selectedTask.id), {
        workerLimit: newLimitNum,
      });

      setDialogOpen(false);
      setSelectedTask(null);
      setNewLimit("");
      await fetchTasks(setTasks);
    } catch (error) {
      console.error("[v0] Error updating limit:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const getProgressColor = (submitted: number, limit: number) => {
    const percentage = (submitted / limit) * 100;
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-amber-500";
    if (percentage >= 50) return "bg-blue-500";
    return "bg-emerald-500";
  };

  const getProgressStatus = (submitted: number, limit: number) => {
    if (submitted >= limit) return "FULL";
    if (submitted >= Math.floor(limit * 0.8)) return "NEARLY FULL";
    return "AVAILABLE";
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-900">
            Task Worker Slots
          </h1>
          <p className="text-emerald-700 mt-1">
            Manage worker limits and monitor submissions
          </p>
        </div>

        {/* Tasks Table */}
        <Card className="border-0 shadow-md bg-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-emerald-900">Task Slots Overview</CardTitle>
            </div>
            <CardDescription>
              {tasks.length} tasks total - {tasks.filter((t) => t.submittedCount >= t.workerLimit).length} at capacity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No tasks available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Limit</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reward</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => {
                      const remaining = task.workerLimit - task.submittedCount;
                      const percentage = (task.submittedCount / task.workerLimit) * 100;
                      const status = getProgressStatus(task.submittedCount, task.workerLimit);
                      const progressColor = getProgressColor(
                        task.submittedCount,
                        task.workerLimit
                      );

                      return (
                        <TableRow key={task.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{task.title}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {task.isPublished ? "Published" : "Draft"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-gray-900">
                              {task.workerLimit}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-emerald-600">
                              {task.submittedCount}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${progressColor} transition-all`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {percentage.toFixed(0)}%
                            </p>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                                status === "FULL"
                                  ? "bg-red-100 text-red-700"
                                  : status === "NEARLY FULL"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {status === "FULL" && (
                                <AlertCircle className="h-3 w-3" />
                              )}
                              {status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-emerald-600">
                              ৳{task.reward.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-transparent border-gray-200 text-gray-600 hover:bg-gray-50"
                              onClick={() => openEditDialog(task)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit Limit
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-2">Tasks at Capacity</p>
              <p className="text-3xl font-bold text-red-600">
                {tasks.filter((t) => t.submittedCount >= t.workerLimit).length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-2">Nearly Full</p>
              <p className="text-3xl font-bold text-amber-600">
                {tasks.filter(
                  (t) =>
                    t.submittedCount >= Math.floor(t.workerLimit * 0.8) &&
                    t.submittedCount < t.workerLimit
                ).length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-2">Total Submissions</p>
              <p className="text-3xl font-bold text-emerald-600">
                {tasks.reduce((sum, t) => sum + t.submittedCount, 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-emerald-900">Update Worker Limit</DialogTitle>
              <DialogDescription>
                Adjust the number of workers needed for &quot;{selectedTask?.title}&quot;
              </DialogDescription>
            </DialogHeader>
            {selectedTask && (
              <div className="space-y-4 mt-4">
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm text-gray-500">Current Status</p>
                  <p className="font-semibold text-gray-900">
                    {selectedTask.submittedCount} of {selectedTask.workerLimit} slots filled
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedTask.workerLimit - selectedTask.submittedCount} spots available
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newLimit">New Worker Limit</Label>
                  <Input
                    id="newLimit"
                    type="number"
                    min={selectedTask.submittedCount}
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    placeholder="Enter new limit"
                    className="border-gray-200"
                  />
                  <p className="text-xs text-gray-500">
                    Minimum: {selectedTask.submittedCount} (already submitted)
                  </p>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="bg-transparent border-gray-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateLimit}
                    disabled={actionLoading || !newLimit}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {actionLoading ? "Updating..." : "Update Limit"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
