"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { collection, query, where, doc, updateDoc, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClipboardList, CheckCircle, X, Clock, Trash2, Calendar, Filter } from "lucide-react";

interface SubmissionDetail {
  id: string;
  taskTitle: string;
  platform?: string;
  description: string;
  amount?: number;
  status: "pending" | "approved" | "rejected";
  type: "task" | "manual";
  createdAt: Date;
  reward?: number;
  userDeleted?: boolean;
}

export default function TaskHistoryPage() {
  const { user } = useAuth();
  const [submissionDetails, setSubmissionDetails] = useState<SubmissionDetail[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Real-time listener for submissions
    const submissionsQuery = query(
      collection(db, "taskSubmissions"),
      where("userId", "==", user.uid)
    );
    
    const unsubscribe = onSnapshot(submissionsQuery, (snapshot) => {
      const submissionsData = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      })) as SubmissionDetail[];

      // Filter out submissions that user has deleted (soft delete)
      const visibleSubmissions = submissionsData.filter((s) => !s.userDeleted);
      setSubmissionDetails(visibleSubmissions);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!confirm("Are you sure you want to remove this submission from your history? (Admin will still be able to see it)")) return;
    
    setDeleteLoading(submissionId);
    try {
      // Soft delete - mark as deleted by user but keep in database for admin
      await updateDoc(doc(db, "taskSubmissions", submissionId), {
        userDeleted: true,
      });
      // Remove from local state
      setSubmissionDetails((prev) => prev.filter((s) => s.id !== submissionId));
    } catch (error) {
      console.error("[v0] Error removing submission:", error);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Filter by date
  const filterByDate = (items: SubmissionDetail[]) => {
    if (!dateFilter) return items;
    return items.filter((item) => {
      const itemDate = item.createdAt.toISOString().split("T")[0];
      return itemDate === dateFilter;
    });
  };

  // Apply all filters
  const filteredSubmissions = filterByDate(
    submissionDetails.filter((sub) => statusFilter === "all" || sub.status === statusFilter)
  ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-emerald-900">Task History</h1>
          <p className="text-emerald-700 mt-2">View all your submitted tasks</p>
        </div>

        {/* Filters Section */}
        <div className="mb-6 space-y-4">
          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap items-center">
            {(["all", "pending", "approved", "rejected"] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                className={`${
                  statusFilter === status
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setStatusFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="ml-auto bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Date Filter
            </Button>
          </div>

          {/* Date Filter */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-lg shadow-sm border border-gray-100">
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
              <span className="text-sm text-gray-500">
                {filteredSubmissions.length} {filteredSubmissions.length === 1 ? "result" : "results"} found
              </span>
            </div>
          )}
        </div>

        {/* Submissions List */}
        {loading ? (
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-12 text-center">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-4 w-1/3 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
              </div>
            </CardContent>
          </Card>
        ) : filteredSubmissions.length === 0 ? (
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-12 text-center">
              <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">
                {submissionDetails.length === 0 ? "No submissions yet" : "No submissions found"}
              </h3>
              <p className="text-gray-500 mt-1">
                {submissionDetails.length === 0 
                  ? "Complete tasks to see them here" 
                  : "Try adjusting your filters"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredSubmissions.map((submission) => (
                <Card key={submission.id} className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Task/Platform Info */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">
                          {submission.type === "manual" ? "Platform" : "Task"}
                        </p>
                        <p className="text-sm font-bold text-gray-900 mt-1">
                          {submission.taskTitle || submission.platform}
                        </p>
                        {submission.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{submission.description}</p>
                        )}
                      </div>

                      {/* Amount & Status */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase">Amount</p>
                          <p className="text-sm font-bold text-emerald-600 mt-1">
                            ৳{(submission.reward || submission.amount || 0).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase">Status</p>
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold mt-1 ${
                              submission.status === "approved"
                                ? "bg-emerald-100 text-emerald-700"
                                : submission.status === "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {submission.status === "approved" ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : submission.status === "rejected" ? (
                              <X className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Date and Delete */}
                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        Submitted on {submission.createdAt.toLocaleDateString()} at{" "}
                        {submission.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-transparent border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteSubmission(submission.id)}
                        disabled={deleteLoading === submission.id}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {deleteLoading === submission.id ? "Removing..." : "Remove"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
