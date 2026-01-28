"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClipboardList, Plus, Edit, Trash2, Eye, EyeOff, Calendar, Filter } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  isPublished: boolean;
  workerLimit: number;
  createdAt: Date;
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    reward: "",
    workerLimit: "",
    isPublished: false,
  });
  const [dateFilter, setDateFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Real-time listener for tasks
    const unsubscribe = onSnapshot(collection(db, "tasks"), (snapshot) => {
      const tasksData = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      })) as Task[];
      setTasks(tasksData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setFormData({ title: "", description: "", reward: "", workerLimit: "", isPublished: false });
    setEditingTask(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      reward: task.reward.toString(),
      workerLimit: task.workerLimit.toString(),
      isPublished: task.isPublished,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.reward || !formData.workerLimit) return;

    setActionLoading(true);
    try {
      if (editingTask) {
        // Update existing task
        await updateDoc(doc(db, "tasks", editingTask.id), {
          title: formData.title,
          description: formData.description,
          reward: parseFloat(formData.reward),
          workerLimit: parseInt(formData.workerLimit),
          isPublished: formData.isPublished,
        });
      } else {
        // Create new task
        await addDoc(collection(db, "tasks"), {
          title: formData.title,
          description: formData.description,
          reward: parseFloat(formData.reward),
          workerLimit: parseInt(formData.workerLimit),
          isPublished: formData.isPublished,
          createdAt: serverTimestamp(),
        });
      }

      setDialogOpen(false);
      resetForm();
      await getDocs(collection(db, "tasks")).then((snapshot) => {
        const tasksData = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        })) as Task[];
        setTasks(tasksData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      });
    } catch (error) {
      console.error("[v0] Error saving task:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePublish = async (task: Task) => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "tasks", task.id), {
        isPublished: !task.isPublished,
      });
      await getDocs(collection(db, "tasks")).then((snapshot) => {
        const tasksData = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        })) as Task[];
        setTasks(tasksData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      });
    } catch (error) {
      console.error("[v0] Error toggling publish:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "tasks", taskId));
      await getDocs(collection(db, "tasks")).then((snapshot) => {
        const tasksData = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        })) as Task[];
        setTasks(tasksData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      });
    } catch (error) {
      console.error("[v0] Error deleting task:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter tasks by date
  const filteredTasks = dateFilter
    ? tasks.filter((task) => {
        const taskDate = task.createdAt.toISOString().split("T")[0];
        return taskDate === dateFilter;
      })
    : tasks;

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-emerald-900">Manage Tasks</h1>
            <p className="text-emerald-700 mt-1">Create and manage tasks for users</p>
          </div>
          <Button
            onClick={openCreateDialog}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>

        {/* Tasks Table */}
        <Card className="border-0 shadow-md bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-emerald-900">All Tasks</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="bg-transparent border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
            <CardDescription>{filteredTasks.length} tasks {dateFilter ? "found" : "total"}</CardDescription>
            
            {/* Date Filter */}
            {showFilters && (
              <div className="flex flex-wrap items-center gap-3 mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-auto border-gray-200"
                  />
                </div>
                {dateFilter && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDateFilter("")}
                    className="bg-transparent border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    Clear
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">{dateFilter ? "No tasks found for this date" : "No tasks created yet"}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Reward</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="font-medium text-gray-900">{task.title}</p>
                            <p className="text-sm text-gray-500 truncate">{task.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-semibold text-emerald-600 block">
                              ৳{task.reward.toFixed(2)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {task.workerLimit} workers needed
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              task.isPublished
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {task.isPublished ? "Published" : "Draft"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">
                            {task.createdAt.toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className={`bg-transparent ${
                                task.isPublished
                                  ? "border-gray-200 text-gray-600 hover:bg-gray-50"
                                  : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                              }`}
                              onClick={() => handleTogglePublish(task)}
                              disabled={actionLoading}
                            >
                              {task.isPublished ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-transparent border-gray-200 text-gray-600 hover:bg-gray-50"
                              onClick={() => openEditDialog(task)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-transparent border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(task.id)}
                              disabled={actionLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-emerald-900">
                {editingTask ? "Edit Task" : "Create New Task"}
              </DialogTitle>
              <DialogDescription>
                {editingTask
                  ? "Update the task details below"
                  : "Fill in the details for the new task"}
              </DialogDescription>
            </DialogHeader>
              <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter task title"
                  className="border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the task requirements"
                  className="min-h-[100px] border-gray-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Reward (৳)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.reward}
                    onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
                    placeholder="Reward amount"
                    className="border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Workers Needed</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.workerLimit}
                    onChange={(e) => setFormData({ ...formData, workerLimit: e.target.value })}
                    placeholder="Number of workers"
                    className="border-gray-200"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Publish immediately</Label>
                <Switch
                  checked={formData.isPublished}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                />
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
                  onClick={handleSubmit}
                  disabled={actionLoading || !formData.title || !formData.reward || !formData.workerLimit}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {actionLoading ? "Saving..." : editingTask ? "Update Task" : "Create Task"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
