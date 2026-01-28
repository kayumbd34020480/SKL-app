"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Wallet, ClipboardCheck, Clock, TrendingUp, ArrowUpRight, ArrowDownRight, Award, CheckCircle, XCircle, AlertCircle, Send } from "lucide-react";

interface Transaction {
  id: string;
  type: "credit" | "debit" | "withdrawal" | "task_reward";
  amount: number;
  description: string;
  createdAt: Date;
  status: string;
}

interface TaskSubmission {
  id: string;
  taskTitle: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

export default function DashboardPage() {
  const { userProfile, user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [stats, setStats] = useState({
    totalEarned: 0,
    pendingTasks: 0,
    completedTasks: 0,
    pendingWithdraw: 0,
  });

  useEffect(() => {
    if (!user) return;

    // Real-time listener for transactions
    const transactionsQuery = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid)
    );
    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionsData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5) as Transaction[];
      setTransactions(transactionsData);
    });

    // Real-time listener for task submissions
    const submissionsQuery = query(
      collection(db, "taskSubmissions"),
      where("userId", "==", user.uid)
    );
    const unsubscribeSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
      const submissionsData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5) as TaskSubmission[];
      setSubmissions(submissionsData);

      // Calculate stats from submissions
      let totalEarned = 0;
      let pending = 0;
      let completed = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.status === "approved") {
          totalEarned += data.reward || 0;
          completed++;
        } else if (data.status === "pending") {
          pending++;
        }
      });

      setStats((prev) => ({ ...prev, totalEarned, pendingTasks: pending, completedTasks: completed }));
    });

    // Real-time listener for withdrawal requests
    const withdrawalQuery = query(
      collection(db, "withdrawalRequests"),
      where("userId", "==", user.uid)
    );
    const unsubscribeWithdrawals = onSnapshot(withdrawalQuery, (snapshot) => {
      let pendingWithdraw = 0;
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.status === "pending") {
          pendingWithdraw += data.amount || 0;
        }
      });
      setStats((prev) => ({ ...prev, pendingWithdraw }));
    });

    return () => {
      unsubscribeTransactions();
      unsubscribeSubmissions();
      unsubscribeWithdrawals();
    };
  }, [user]);

  return (
    <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pb-24">
      <div className="w-full">
        {/* Header */}
        <div className="px-4 md:px-6 lg:px-8 pt-4 md:pt-6 lg:pt-8 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-900">
            Welcome back, {userProfile?.displayName || "User"}
          </h1>
          <p className="text-emerald-700 mt-1">Here is your investment overview</p>
        </div>

        {/* Stats Cards */}
        <div className="px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
            <Card className="border-0 shadow-md bg-white">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Current Balance</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      ৳{userProfile?.balance?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-emerald-600" />
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
                      ৳{stats.pendingWithdraw.toFixed(2)}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <ArrowDownRight className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-white">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Tasks</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.pendingTasks}</p>
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
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.completedTasks}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <ClipboardCheck className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Recent Transactions */}
            <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Send className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl text-emerald-900">Recent Transactions</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Your latest financial activity</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="py-8 sm:py-12 text-center">
                    <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {transactions.map((transaction, index) => (
                      <div key={transaction.id} className={`flex items-center justify-between p-3 sm:p-4 rounded-lg transition-colors ${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      } hover:bg-emerald-50`}>
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            transaction.type === "credit" || transaction.type === "task_reward"
                              ? "bg-emerald-100"
                              : "bg-red-100"
                          }`}>
                            {transaction.type === "credit" || transaction.type === "task_reward" ? (
                              <ArrowUpRight className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600" />
                            ) : (
                              <ArrowDownRight className="h-4 sm:h-5 w-4 sm:w-5 text-red-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{transaction.description}</p>
                            <p className="text-xs sm:text-sm text-gray-500">
                              {transaction.createdAt.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`font-bold ml-2 text-sm sm:text-base whitespace-nowrap ${
                          transaction.type === "credit" || transaction.type === "task_reward"
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}>
                          {transaction.type === "credit" || transaction.type === "task_reward" ? "+" : "-"}
                          ৳{transaction.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Task Submissions */}
            <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <ClipboardCheck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl text-emerald-900">Recent Submissions</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Your latest task submissions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <div className="py-8 sm:py-12 text-center">
                    <ClipboardCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No submissions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {submissions.map((submission, index) => (
                      <div key={submission.id} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg gap-2 sm:gap-3 transition-colors ${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      } hover:bg-blue-50`}>
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            submission.status === "approved"
                              ? "bg-emerald-100"
                              : submission.status === "rejected"
                              ? "bg-red-100"
                              : "bg-amber-100"
                          }`}>
                            {submission.status === "approved" ? (
                              <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600" />
                            ) : submission.status === "rejected" ? (
                              <XCircle className="h-4 sm:h-5 w-4 sm:w-5 text-red-600" />
                            ) : (
                              <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5 text-amber-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{submission.taskTitle}</p>
                            <p className="text-xs sm:text-sm text-gray-500">
                              {submission.createdAt.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap self-start sm:self-auto ${
                          submission.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : submission.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
