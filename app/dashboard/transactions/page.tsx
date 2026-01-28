"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { collection, query, where, doc, updateDoc, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, History, AlertCircle, RefreshCw, Trash2, Search, Calendar, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Transaction {
  id: string;
  type: "credit" | "debit" | "withdrawal" | "task_reward";
  amount: number;
  description: string;
  createdAt: Date;
  status: string;
  hiddenByUser?: boolean;
}

const fetchTransactions = async (userId: string, setTransactions: any) => {
  const transactionsQuery = query(
    collection(db, "transactions"),
    where("userId", "==", userId)
  );
  
  const snapshot = await getDocs(transactionsQuery);
  let transactionsData = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Transaction[];
  
  // Sort client-side
  transactionsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  // Filter out transactions hidden by user
  transactionsData = transactionsData.filter((t) => !t.hiddenByUser);
  
  setTransactions(transactionsData);
};

export default function TransactionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setLoading(false);
      return;
    }

    // Real-time listener for transactions
    const transactionsQuery = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid)
    );
    
    const unsubscribe = onSnapshot(
      transactionsQuery,
      (snapshot) => {
        let transactionsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Transaction[];
        
        // Sort client-side
        transactionsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        // Filter out transactions hidden by user
        transactionsData = transactionsData.filter((t) => !t.hiddenByUser);
        
        setTransactions(transactionsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching transactions:", err);
        setError("Failed to load transactions. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading]);

  // Filter transactions based on search and date
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = !dateFilter || 
      transaction.createdAt.toISOString().split('T')[0] === dateFilter;
    return matchesSearch && matchesDate;
  });

  const handleHideTransaction = async () => {
    if (!selectedTransaction) return;

    setActionLoading(true);
    try {
      // Mark as hidden by user (soft delete for user only)
      await updateDoc(doc(db, "transactions", selectedTransaction.id), {
        hiddenByUser: true,
      });
      setDeleteDialogOpen(false);
      setSelectedTransaction(null);
      await fetchTransactions(user.uid, setTransactions);
    } catch (err) {
      console.error("Error hiding transaction:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDeleteDialogOpen(true);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "credit":
        return "Credit";
      case "debit":
        return "Debit";
      case "withdrawal":
        return "Withdrawal";
      case "task_reward":
        return "Task Reward";
      default:
        return type;
    }
  };

  if (loading || authLoading) {
    return (
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pb-24">
        <div className="max-w-4xl mx-auto w-full px-4 md:px-6 lg:px-8 pt-4 md:pt-6 lg:pt-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="h-24 bg-gray-200 rounded" />
            <div className="h-24 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pb-24">
        <div className="max-w-4xl mx-auto w-full px-4 md:px-6 lg:px-8 pt-4 md:pt-6 lg:pt-8">
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">Something went wrong</h3>
              <p className="text-gray-500 mt-1 mb-4">{error}</p>
              <Button onClick={() => fetchTransactions(user.uid, setTransactions)} className="bg-emerald-600 hover:bg-emerald-700">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pb-24">
        <div className="max-w-4xl mx-auto w-full px-4 md:px-6 lg:px-8 pt-4 md:pt-6 lg:pt-8">
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-16 w-16 text-amber-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">Please log in</h3>
              <p className="text-gray-500 mt-1">You need to be logged in to view your transactions</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pb-24">
      <div className="max-w-4xl mx-auto w-full px-4 md:px-6 lg:px-8 pt-4 md:pt-6 lg:pt-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-900">Transaction History</h1>
          <p className="text-emerald-700 mt-1">View all your financial transactions</p>
        </div>

        {/* Search and Filter - Desktop */}
        <div className="hidden sm:block mb-6">
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-gray-200"
                  />
                </div>
                <div className="relative w-48">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="pl-10 border-gray-200"
                  />
                </div>
                {(searchQuery || dateFilter) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setDateFilter("");
                    }}
                    className="bg-transparent border-gray-200"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter - Mobile (Icon buttons) */}
        <div className="flex sm:hidden gap-2 mb-4">
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={`bg-white border-gray-200 ${(searchQuery || dateFilter) ? 'border-emerald-500 text-emerald-600' : ''}`}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" align="start">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-gray-200 h-9 text-sm"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="pl-10 border-gray-200 h-9 text-sm"
                  />
                </div>
                {(searchQuery || dateFilter) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setDateFilter("");
                    }}
                    className="w-full bg-transparent border-gray-200 text-sm"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
          {(searchQuery || dateFilter) && (
            <div className="flex items-center text-xs text-emerald-600 bg-emerald-50 px-2 rounded-md">
              Filtered
            </div>
          )}
        </div>

        {filteredTransactions.length === 0 ? (
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-12 text-center">
              <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">
                {transactions.length === 0 ? "No transactions yet" : "No transactions found"}
              </h3>
              <p className="text-gray-500 mt-1">
                {transactions.length === 0
                  ? "Your transaction history will appear here"
                  : "Try adjusting your search or filter"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-md bg-white">
            <CardHeader>
              <CardTitle className="text-emerald-900">All Transactions</CardTitle>
              <CardDescription>{filteredTransactions.length} transactions found</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-gray-50 rounded-lg p-3 sm:p-4"
                  >
                    {/* Mobile Layout */}
                    <div className="sm:hidden space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                              transaction.type === "credit" || transaction.type === "task_reward"
                                ? "bg-emerald-100"
                                : "bg-red-100"
                            }`}
                          >
                            {transaction.type === "credit" || transaction.type === "task_reward" ? (
                              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <span
                            className={`text-base font-bold ${
                              transaction.type === "credit" || transaction.type === "task_reward"
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {transaction.type === "credit" || transaction.type === "task_reward"
                              ? "+"
                              : "-"}
                            ৳{transaction.amount.toFixed(2)}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 bg-transparent border-red-200 text-red-600 hover:bg-red-50 shrink-0"
                          onClick={() => openDeleteDialog(transaction)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            transaction.type === "credit" || transaction.type === "task_reward"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {getTypeLabel(transaction.type)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {transaction.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div
                          className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${
                            transaction.type === "credit" || transaction.type === "task_reward"
                              ? "bg-emerald-100"
                              : "bg-red-100"
                          }`}
                        >
                          {transaction.type === "credit" || transaction.type === "task_reward" ? (
                            <ArrowUpRight className="h-6 w-6 text-emerald-600" />
                          ) : (
                            <ArrowDownRight className="h-6 w-6 text-red-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 truncate">{transaction.description}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-sm text-gray-500">
                              {transaction.createdAt.toLocaleDateString()} at{" "}
                              {transaction.createdAt.toLocaleTimeString()}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                transaction.type === "credit" || transaction.type === "task_reward"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {getTypeLabel(transaction.type)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`text-lg font-bold ${
                            transaction.type === "credit" || transaction.type === "task_reward"
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.type === "credit" || transaction.type === "task_reward"
                            ? "+"
                            : "-"}
                          ৳{transaction.amount.toFixed(2)}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-transparent border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => openDeleteDialog(transaction)}
                          title="Delete from history"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Delete Transaction</DialogTitle>
              <DialogDescription>
                This will remove the transaction from your history. The admin will still be able to see it.
              </DialogDescription>
            </DialogHeader>
            {selectedTransaction && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm">
                  <span className="text-gray-500">Amount:</span>{" "}
                  <span className="font-semibold">৳{selectedTransaction.amount.toFixed(2)}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-500">Description:</span>{" "}
                  {selectedTransaction.description}
                </p>
                <p className="text-sm">
                  <span className="text-gray-500">Date:</span>{" "}
                  {selectedTransaction.createdAt.toLocaleString()}
                </p>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                className="bg-transparent"
              >
                Cancel
              </Button>
              <Button
                onClick={handleHideTransaction}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={actionLoading}
              >
                {actionLoading ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
