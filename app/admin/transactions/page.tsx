"use client";

import { useEffect, useState } from "react";
import { collection, doc, deleteDoc, onSnapshot, getDocs, query, orderBy } from "firebase/firestore";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  History, 
  Search, 
  Trash2,
  AlertCircle,
  RefreshCw,
  Calendar,
  Filter,
  X
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Transaction {
  id: string;
  userId: string;
  userEmail?: string;
  type: "credit" | "debit" | "withdrawal" | "task_reward";
  amount: number;
  description: string;
  createdAt: Date;
  status: string;
  hiddenByUser?: boolean;
}

interface User {
  uid: string;
  email: string;
  displayName: string;
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const fetchData = async () => {
    try {
      const transactionsSnapshot = await getDocs(query(collection(db, "transactions"), orderBy("createdAt", "desc")));
      const transactionsData = transactionsSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      })) as Transaction[];
      setTransactions(transactionsData);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError("Failed to load transactions. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    // Real-time listener for users
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersMap = new Map<string, User>();
      snapshot.docs.forEach((docSnap) => {
        usersMap.set(docSnap.id, {
          uid: docSnap.id,
          email: docSnap.data().email,
          displayName: docSnap.data().displayName,
        });
      });
      setUsers(usersMap);
    });

    // Real-time listener for transactions
    const unsubscribeTransactions = onSnapshot(
      collection(db, "transactions"),
      (snapshot) => {
        const transactionsData = snapshot.docs
          .map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate() || new Date(),
          }))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) as Transaction[];
        
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

    return () => {
      unsubscribeUsers();
      unsubscribeTransactions();
    };
  }, []);

  const getUserInfo = (userId: string, userEmail?: string) => {
    const user = users.get(userId);
    if (user) {
      return { name: user.displayName, email: user.email };
    }
    return { name: "Unknown User", email: userEmail || "N/A" };
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const userInfo = getUserInfo(transaction.userId, transaction.userEmail);
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (userInfo.name || "").toLowerCase().includes(searchLower) ||
      (userInfo.email || "").toLowerCase().includes(searchLower) ||
      (transaction.description || "").toLowerCase().includes(searchLower);
    
    const matchesDate = !dateFilter || 
      transaction.createdAt.toISOString().split('T')[0] === dateFilter;
    
    return matchesSearch && matchesDate;
  });

  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;

    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "transactions", selectedTransaction.id));
      setDeleteDialogOpen(false);
      setSelectedTransaction(null);
      await fetchData();
    } catch (err) {
      console.error("Error deleting transaction:", err);
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

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 pb-24">
        <div className="max-w-6xl mx-auto">
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">Something went wrong</h3>
              <p className="text-gray-500 mt-1 mb-4">{error}</p>
              <Button onClick={fetchData} className="bg-emerald-600 hover:bg-emerald-700">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-900">Transactions Feed</h1>
          <p className="text-emerald-700 mt-1">Monitor all user transaction history</p>
        </div>

        {/* Search and Filter - Desktop */}
        <div className="hidden sm:block mb-6">
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by user name, email, or description..."
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
                    placeholder="Search user, email..."
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

        {/* Transactions List */}
        <Card className="border-0 shadow-md bg-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-emerald-900">All Transactions</CardTitle>
            </div>
            <CardDescription>{filteredTransactions.length} transactions found</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">No transactions found</h3>
                <p className="text-gray-500 mt-1">
                  {searchQuery || dateFilter
                    ? "Try adjusting your search or filter"
                    : "Transaction history will appear here"}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => {
                        const userInfo = getUserInfo(transaction.userId, transaction.userEmail);
                        return (
                          <TableRow key={transaction.id} className={transaction.hiddenByUser ? "bg-amber-50" : ""}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-gray-900">{userInfo.name}</p>
                                <p className="text-sm text-gray-500">{userInfo.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {transaction.type === "credit" || transaction.type === "task_reward" ? (
                                  <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                                )}
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    transaction.type === "credit" || transaction.type === "task_reward"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {getTypeLabel(transaction.type)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-gray-700 max-w-xs truncate">
                                {transaction.description}
                              </p>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`font-semibold ${
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
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p className="text-gray-900">{transaction.createdAt.toLocaleDateString()}</p>
                                <p className="text-gray-500">{transaction.createdAt.toLocaleTimeString()}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 w-fit">
                                  {transaction.status}
                                </span>
                                {transaction.hiddenByUser && (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 w-fit">
                                    Hidden by user
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-transparent border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => openDeleteDialog(transaction)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {filteredTransactions.map((transaction) => {
                    const userInfo = getUserInfo(transaction.userId, transaction.userEmail);
                    return (
                      <div
                        key={transaction.id}
                        className={`rounded-lg p-3 border ${
                          transaction.hiddenByUser
                            ? "bg-amber-50 border-amber-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        {/* Row 1: User Info, Amount and Delete */}
                        <div className="flex items-start justify-between gap-2 mb-2">
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
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-900 text-sm truncate">{userInfo.name}</p>
                              <p className="text-xs text-gray-500 truncate">{userInfo.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`font-bold text-base ${
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
                              className="h-8 w-8 p-0 bg-transparent border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => openDeleteDialog(transaction)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Row 2: Description */}
                        <p className="text-sm text-gray-700 mb-2">{transaction.description}</p>

                        {/* Row 3: Badges */}
                        <div className="flex flex-wrap items-center gap-1.5">
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
                          {transaction.hiddenByUser && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              Hidden
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete Transaction</DialogTitle>
              <DialogDescription>
                Are you sure you want to permanently delete this transaction? This action cannot be undone.
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
                onClick={handleDeleteTransaction}
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
