"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  UserPlus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Mail, 
  User,
  Calendar,
  AlertTriangle,
  Trash2
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PendingUser {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date;
  isApproved: boolean;
  isRejected: boolean;
}

export default function AccountRequestsPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [rejectedUsers, setRejectedUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<PendingUser | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "rejected">("pending");

  useEffect(() => {
    // Listen for pending users (not approved and not rejected)
    const pendingQuery = query(
      collection(db, "users"),
      where("isApproved", "==", false),
      where("isRejected", "==", false),
      where("role", "==", "user")
    );

    const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
      const users = snapshot.docs.map((docSnap) => ({
        uid: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      })) as PendingUser[];
      setPendingUsers(users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      setLoading(false);
    });

    // Listen for rejected users
    const rejectedQuery = query(
      collection(db, "users"),
      where("isRejected", "==", true),
      where("role", "==", "user")
    );

    const unsubscribeRejected = onSnapshot(rejectedQuery, (snapshot) => {
      const users = snapshot.docs.map((docSnap) => ({
        uid: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      })) as PendingUser[];
      setRejectedUsers(users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    });

    return () => {
      unsubscribePending();
      unsubscribeRejected();
    };
  }, []);

  const handleApprove = async (user: PendingUser) => {
    setActionLoading(user.uid);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        isApproved: true,
        isRejected: false,
        approvedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error approving user:", error);
    }
    setActionLoading(null);
  };

  const handleReject = async (user: PendingUser) => {
    setActionLoading(user.uid);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        isApproved: false,
        isRejected: true,
        rejectedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error rejecting user:", error);
    }
    setActionLoading(null);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setActionLoading(userToDelete.uid);
    try {
      await deleteDoc(doc(db, "users", userToDelete.uid));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
    setActionLoading(null);
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const filteredPendingUsers = pendingUsers.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRejectedUsers = rejectedUsers.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Account Requests</h1>
            <p className="text-sm text-gray-500">Manage user registration requests</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card className="border-amber-100 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700">Pending Requests</p>
                <p className="text-2xl font-bold text-amber-900">{pendingUsers.length}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-gray-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected Users</p>
                <p className="text-2xl font-bold text-gray-900">{rejectedUsers.length}</p>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === "pending" ? "default" : "outline"}
          onClick={() => setActiveTab("pending")}
          className={activeTab === "pending" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
        >
          <Clock className="w-4 h-4 mr-2" />
          Pending ({pendingUsers.length})
        </Button>
        <Button
          variant={activeTab === "rejected" ? "default" : "outline"}
          onClick={() => setActiveTab("rejected")}
          className={activeTab === "rejected" ? "bg-gray-700 hover:bg-gray-800" : ""}
        >
          <XCircle className="w-4 h-4 mr-2" />
          Rejected ({rejectedUsers.length})
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Pending Users List */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {filteredPendingUsers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No Pending Requests</h3>
                <p className="text-sm text-gray-500">All registration requests have been processed</p>
              </CardContent>
            </Card>
          ) : (
            filteredPendingUsers.map((user) => (
              <Card key={user.uid} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* User Info */}
                    <div className="flex-1 p-4 sm:p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">{user.displayName}</h3>
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span>Registered: {formatDate(user.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex sm:flex-col gap-2 p-4 sm:p-6 bg-gray-50 sm:bg-transparent border-t sm:border-t-0 sm:border-l border-gray-100">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(user)}
                        disabled={actionLoading === user.uid}
                        className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(user)}
                        disabled={actionLoading === user.uid}
                        className="flex-1 sm:flex-none border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Rejected Users List */}
      {activeTab === "rejected" && (
        <div className="space-y-4">
          {filteredRejectedUsers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No Rejected Users</h3>
                <p className="text-sm text-gray-500">There are no rejected registration requests</p>
              </CardContent>
            </Card>
          ) : (
            filteredRejectedUsers.map((user) => (
              <Card key={user.uid} className="overflow-hidden border-gray-200">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* User Info */}
                    <div className="flex-1 p-4 sm:p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">{user.displayName}</h3>
                            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
                              <XCircle className="w-3 h-3 mr-1" />
                              Rejected
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span>Registered: {formatDate(user.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex sm:flex-col gap-2 p-4 sm:p-6 bg-gray-50 sm:bg-transparent border-t sm:border-t-0 sm:border-l border-gray-100">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(user)}
                        disabled={actionLoading === user.uid}
                        className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setUserToDelete(user);
                          setDeleteDialogOpen(true);
                        }}
                        disabled={actionLoading === user.uid}
                        className="flex-1 sm:flex-none border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete User Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete the account for{" "}
              <span className="font-semibold">{userToDelete?.displayName}</span> ({userToDelete?.email})?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
