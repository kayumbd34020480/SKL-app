"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ClipboardList, Clock, DollarSign } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalTasks: number;
  pendingSubmissions: number;
  pendingWithdrawals: number;
  totalPayout: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalTasks: 0,
    pendingSubmissions: 0,
    pendingWithdrawals: 0,
    totalPayout: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time listener for users
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setStats((prev) => ({ ...prev, totalUsers: snapshot.size }));
    });

    // Real-time listener for tasks
    const unsubscribeTasks = onSnapshot(collection(db, "tasks"), (snapshot) => {
      setStats((prev) => ({ ...prev, totalTasks: snapshot.size }));
    });

    // Real-time listener for pending submissions
    const pendingSubQuery = query(
      collection(db, "taskSubmissions"),
      where("status", "==", "pending")
    );
    const unsubscribePendingSub = onSnapshot(pendingSubQuery, (snapshot) => {
      setStats((prev) => ({ ...prev, pendingSubmissions: snapshot.size }));
    });

    // Real-time listener for pending withdrawals
    const pendingWithQuery = query(
      collection(db, "withdrawalRequests"),
      where("status", "==", "pending")
    );
    const unsubscribePendingWith = onSnapshot(pendingWithQuery, (snapshot) => {
      setStats((prev) => ({ ...prev, pendingWithdrawals: snapshot.size }));
    });

    // Real-time listener for approved submissions (total payout)
    const approvedSubQuery = query(
      collection(db, "taskSubmissions"),
      where("status", "==", "approved")
    );
    const unsubscribeApprovedSub = onSnapshot(approvedSubQuery, (snapshot) => {
      let totalPayout = 0;
      snapshot.docs.forEach((docSnap) => {
        totalPayout += docSnap.data().reward || 0;
      });
      setStats((prev) => ({ ...prev, totalPayout }));
      setLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeTasks();
      unsubscribePendingSub();
      unsubscribePendingWith();
      unsubscribeApprovedSub();
    };
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-900">Admin Dashboard</h1>
          <p className="text-emerald-700 mt-1">Overview of your investment platform</p>
        </div>

        {/* Stats Cards - Vertical Stack on Mobile, Grid on Desktop */}
        <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-4 mb-8">
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-emerald-900">{stats.totalUsers}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tasks</p>
                  <p className="text-2xl font-bold text-emerald-900">{stats.totalTasks}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <ClipboardList className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Reviews</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {stats.pendingSubmissions}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Withdraw</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.pendingWithdrawals}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-md bg-white">
            <CardHeader>
              <CardTitle className="text-emerald-900">Pending Task Submissions</CardTitle>
              <CardDescription>Review and approve task completions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600">{stats.pendingSubmissions}</p>
              <p className="text-sm text-gray-500 mt-1">submissions waiting for review</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white">
            <CardHeader>
              <CardTitle className="text-emerald-900">Pending Withdrawals</CardTitle>
              <CardDescription>Process withdrawal requests</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600">{stats.pendingWithdrawals}</p>
              <p className="text-sm text-gray-500 mt-1">withdrawal requests pending</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
