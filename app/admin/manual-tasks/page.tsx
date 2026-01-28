"use client";

import { useEffect, useState } from "react";
import { collection, updateDoc, addDoc, doc, serverTimestamp, getDocs, deleteDoc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClipboardCheck, CheckCircle, X, Clock, Trash2, Calendar, Filter } from "lucide-react";
import { notifyUserOfAction } from "@/lib/notification-service";

interface ManualSubmission {
  id: string;
  userId: string;
  userEmail: string;
  platform: string;
  description: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

export default function AdminManualTasksPage() {
  const [submissions, setSubmissions] = useState<ManualSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<ManualSubmission | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Real-time listener for all task submissions
    const unsubscribe = onSnapshot(collection(db, "taskSubmissions"), (snapshot) => {
      const allSubmissions = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      })) as (ManualSubmission & { type?: string })[];

      // Filter client-side to get only manual submissions (type === "manual" AND has platform)
      const manualSubmissions = allSubmissions.filter((s) => s.type === "manual" && s.platform) as ManualSubmission[];
      
      // Sort by createdAt descending
      manualSubmissions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setSubmissions(manualSubmissions);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (submission: ManualSubmission) => {
    setActionLoading(true);
    try {
      // Update submission status
      await updateDoc(doc(db, "taskSubmissions", submission.id), {
        status: "approved",
        reviewedAt: serverTimestamp(),
      });

      // Get user's current balance
      const userDoc = await getDoc(doc(db, "users", submission.userId));
      const currentBalance = userDoc.data()?.balance || 0;

      // Update user balance
      await updateDoc(doc(db, "users", submission.userId), {
        balance: currentBalance + submission.amount,
      });

      // Create transaction record
      await addDoc(collection(db, "transactions"), {
        userId: submission.userId,
        userEmail: submission.userEmail,
        type: "manual_reward",
        amount: submission.amount,
        description: `Manual task reward: ${submission.platform}`,
        status: "completed",
        createdAt: serverTimestamp(),
      });

      // Create notification for user
      await addDoc(collection(db, "notifications"), {
        userId: submission.userId,
        type: "manual_approved",
        title: "Manual Task Approved",
        message: `Your manual task submission for "${submission.platform}" has been approved! Reward added to your balance.`,
        amount: submission.amount,
        read: false,
        createdAt: serverTimestamp(),
      });

      setDialogOpen(false);
      setSelectedSubmission(null);
      await fetchSubmissions();
    } catch (error) {
      console.error("[v0] Error approving submission:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (submission: ManualSubmission) => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "taskSubmissions", submission.id), {
        status: "rejected",
        reviewedAt: serverTimestamp(),
      });

      // Create notification for user
      await addDoc(collection(db, "notifications"), {
        userId: submission.userId,
        type: "manual_rejected",
        title: "Manual Task Rejected",
        message: `Your manual task submission for "${submission.platform}" was not approved. Please review and try again.`,
        read: false,
        createdAt: serverTimestamp(),
      });

      setDialogOpen(false);
      setSelectedSubmission(null);
      await fetchSubmissions();
    } catch (error) {
      console.error("[v0] Error rejecting submission:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const openReviewDialog = (submission: ManualSubmission) => {
    setSelectedSubmission(submission);
    setDialogOpen(true);
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!confirm("Are you sure you want to delete this submission?")) return;
    
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "taskSubmissions", submissionId));
      await fetchSubmissions();
    } catch (error) {
      console.error("[v0] Error deleting submission:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    const snapshot = await getDocs(collection(db, "taskSubmissions"));
    const allSubmissions = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate() || new Date(),
    })) as (ManualSubmission & { type?: string })[];

    // Filter client-side to get only manual submissions (type === "manual" AND has platform)
    const manualSubmissions = allSubmissions.filter((s) => s.type === "manual" && s.platform) as ManualSubmission[];
    
    // Sort by createdAt descending
    manualSubmissions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    setSubmissions(manualSubmissions);
  };

  // Filter submissions by date
  const filterByDate = (items: ManualSubmission[]) => {
    if (!dateFilter) return items;
    return items.filter((item) => {
      const itemDate = item.createdAt.toISOString().split("T")[0];
      return itemDate === dateFilter;
    });
  };

  const pendingSubmissions = submissions.filter((s) => s.status === "pending");
  const reviewedSubmissions = filterByDate(submissions.filter((s) => s.status !== "pending"));

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
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-900">Manual Tasks</h1>
          <p className="text-emerald-700 mt-1">Review user manual task submissions</p>
        </div>

        {/* Pending Manual Submissions */}
        <Card className="border-0 shadow-md bg-white mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-emerald-900">Pending Review</CardTitle>
            </div>
            <CardDescription>{pendingSubmissions.length} submissions waiting</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingSubmissions.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No pending manual submissions</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingSubmissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <p className="font-medium text-gray-900">{submission.userEmail}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-gray-700 font-semibold">{submission.platform}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-600 truncate max-w-xs">{submission.description}</p>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-emerald-600">
                            ৳{submission.amount.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">
                            {submission.createdAt.toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => openReviewDialog(submission)}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviewed Manual Submissions */}
        <Card className="border-0 shadow-md bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-emerald-900">Reviewed Submissions</CardTitle>
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
            <CardDescription>{reviewedSubmissions.length} submissions reviewed</CardDescription>
            
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
            {reviewedSubmissions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No reviewed submissions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviewedSubmissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <p className="font-medium text-gray-900">{submission.userEmail}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-gray-700 font-semibold">{submission.platform}</p>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-emerald-600">
                            ৳{submission.amount.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              submission.status === "approved"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">
                            {submission.createdAt.toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-transparent border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteSubmission(submission.id)}
                            disabled={actionLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-full max-w-md mx-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl text-emerald-900">Review Manual Task</DialogTitle>
            <DialogDescription className="text-sm">
              Review the manual task submission details
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4 mt-4 max-h-[calc(100vh-250px)] overflow-y-auto">
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">User</p>
                  <p className="font-medium text-gray-900 text-sm sm:text-base break-all">{selectedSubmission.userEmail}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Platform</p>
                  <p className="font-semibold text-emerald-600 text-lg sm:text-xl">{selectedSubmission.platform}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Task Details</p>
                  <p className="text-gray-900 text-sm sm:text-base leading-relaxed">{selectedSubmission.description}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Earning Amount</p>
                  <p className="font-semibold text-emerald-600 text-lg sm:text-xl">
                    ৳{selectedSubmission.amount.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3 justify-end pt-4">
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-initial bg-transparent border-red-200 text-red-600 hover:bg-red-50 text-sm sm:text-base"
                  onClick={() => handleReject(selectedSubmission)}
                  disabled={actionLoading}
                >
                  <X className="h-4 w-4 mr-1 sm:mr-2" />
                  Reject
                </Button>
                <Button
                  className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-base"
                  onClick={() => handleApprove(selectedSubmission)}
                  disabled={actionLoading}
                >
                  <CheckCircle className="h-4 w-4 mr-1 sm:mr-2" />
                  {actionLoading ? "Processing..." : "Approve & Pay"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
