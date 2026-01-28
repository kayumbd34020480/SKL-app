"use client";

import { useEffect, useState } from "react";
import { collection, updateDoc, addDoc, doc, serverTimestamp, getDoc, deleteDoc, onSnapshot, query, orderBy, getDocs } from "firebase/firestore";
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
import { Wallet, CheckCircle, X, Clock, Trash2, Calendar, Filter } from "lucide-react";

interface WithdrawalRequest {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  paymentMethod: string;
  paymentDetails: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

export default function AdminWithdrawalsPage() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchRequests = async () => {
    const q = query(collection(db, "withdrawalRequests"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const requestsData = snapshot.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) as WithdrawalRequest[];
    setRequests(requestsData);
  };

  useEffect(() => {
    // Real-time listener for withdrawal requests
    const unsubscribe = onSnapshot(collection(db, "withdrawalRequests"), (snapshot) => {
      const requestsData = snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) as WithdrawalRequest[];
      setRequests(requestsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (request: WithdrawalRequest) => {
    setActionLoading(true);
    try {
      // Update withdrawal request status (balance already deducted when user submitted)
      await updateDoc(doc(db, "withdrawalRequests", request.id), {
        status: "approved",
        reviewedAt: serverTimestamp(),
      });

      // Create transaction record for completed withdrawal
      await addDoc(collection(db, "transactions"), {
        userId: request.userId,
        userEmail: request.userEmail,
        type: "withdrawal",
        amount: request.amount,
        description: `Withdrawal via ${request.paymentMethod} (approved)`,
        status: "completed",
        createdAt: serverTimestamp(),
      });

      // Create notification for user
      await addDoc(collection(db, "notifications"), {
        userId: request.userId,
        type: "withdrawal_approved",
        title: "Withdrawal Approved",
        message: `Your withdrawal request of ৳${request.amount.toFixed(2)} via ${request.paymentMethod} has been approved and processed.`,
        amount: request.amount,
        read: false,
        createdAt: serverTimestamp(),
      });

      setDialogOpen(false);
      setSelectedRequest(null);
      await fetchRequests();
    } catch (error) {
      console.error("[v0] Error approving withdrawal:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (request: WithdrawalRequest) => {
    setActionLoading(true);
    try {
      // Get user's current balance to refund the amount
      const userDoc = await getDoc(doc(db, "users", request.userId));
      const currentBalance = userDoc.data()?.balance || 0;

      // Update withdrawal request status
      await updateDoc(doc(db, "withdrawalRequests", request.id), {
        status: "rejected",
        reviewedAt: serverTimestamp(),
      });

      // Refund the amount back to user's balance
      await updateDoc(doc(db, "users", request.userId), {
        balance: currentBalance + request.amount,
      });

      // Create transaction record for the refund
      await addDoc(collection(db, "transactions"), {
        userId: request.userId,
        userEmail: request.userEmail,
        type: "refund",
        amount: request.amount,
        description: `Withdrawal request rejected - amount refunded`,
        status: "completed",
        createdAt: serverTimestamp(),
      });

      // Create notification for user
      await addDoc(collection(db, "notifications"), {
        userId: request.userId,
        type: "withdrawal_rejected",
        title: "Withdrawal Rejected",
        message: `Your withdrawal request of ৳${request.amount.toFixed(2)} has been rejected. The amount has been refunded to your balance.`,
        amount: request.amount,
        read: false,
        createdAt: serverTimestamp(),
      });

      setDialogOpen(false);
      setSelectedRequest(null);
      await fetchRequests();
    } catch (error) {
      console.error("[v0] Error rejecting withdrawal:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const openReviewDialog = (request: WithdrawalRequest) => {
    setSelectedRequest(request);
    setDialogOpen(true);
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to delete this withdrawal request?")) return;
    
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "withdrawalRequests", requestId));
      await fetchRequests();
    } catch (error) {
      console.error("[v0] Error deleting request:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter requests by date
  const filterByDate = (items: WithdrawalRequest[]) => {
    if (!dateFilter) return items;
    return items.filter((item) => {
      const itemDate = item.createdAt.toISOString().split("T")[0];
      return itemDate === dateFilter;
    });
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const processedRequests = filterByDate(requests.filter((r) => r.status !== "pending"));

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
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-900">Withdrawal Requests</h1>
          <p className="text-emerald-700 mt-1">Process user withdrawal requests</p>
        </div>

        {/* Pending Requests */}
        <Card className="border-0 shadow-md bg-white mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-emerald-900">Pending Requests</CardTitle>
            </div>
            <CardDescription>{pendingRequests.length} requests waiting</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No pending withdrawal requests</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <p className="font-medium text-gray-900">{request.userEmail}</p>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-emerald-600">
                            ৳{request.amount.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <p className="text-gray-700">{request.paymentMethod}</p>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">
                            {request.createdAt.toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => openReviewDialog(request)}
                          >
                            Process
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

        {/* Processed Requests */}
        <Card className="border-0 shadow-md bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-emerald-900">Processed Requests</CardTitle>
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
            <CardDescription>{processedRequests.length} requests processed</CardDescription>
            
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
            {processedRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No processed requests yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <p className="font-medium text-gray-900">{request.userEmail}</p>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-emerald-600">
                            ৳{request.amount.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <p className="text-gray-700">{request.paymentMethod}</p>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              request.status === "approved"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">
                            {request.createdAt.toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-transparent border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteRequest(request.id)}
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

        {/* Process Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="w-full max-w-md mx-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl text-emerald-900">Process Withdrawal</DialogTitle>
              <DialogDescription className="text-sm">
                Review the withdrawal request details and process
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4 mt-4 max-h-[calc(100vh-250px)] overflow-y-auto">
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">User</p>
                    <p className="font-medium text-gray-900 text-sm sm:text-base break-all">{selectedRequest.userEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Amount</p>
                    <p className="font-semibold text-emerald-600 text-lg sm:text-xl">
                      ৳{selectedRequest.amount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Payment Method</p>
                    <p className="font-medium text-gray-900 text-sm sm:text-base">{selectedRequest.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Payment Details</p>
                    <p className="font-medium text-gray-900 break-all text-sm sm:text-base">
                      {selectedRequest.paymentDetails}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-3 justify-end pt-4">
                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-initial bg-transparent border-red-200 text-red-600 hover:bg-red-50 text-sm sm:text-base"
                    onClick={() => handleReject(selectedRequest)}
                    disabled={actionLoading}
                  >
                    <X className="h-4 w-4 mr-1 sm:mr-2" />
                    Reject
                  </Button>
                  <Button
                    className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-base"
                    onClick={() => handleApprove(selectedRequest)}
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
    </div>
  );
}
