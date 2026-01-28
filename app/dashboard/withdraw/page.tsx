"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { collection, query, where, addDoc, serverTimestamp, doc, updateDoc, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, Clock, CheckCircle, X, AlertCircle, ChevronRight, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { notifyAdminsOfWithdrawal } from "@/lib/notification-service";
import { BkashIcon, NagadIcon, BinanceIcon } from "@/components/payment-icons";

interface WithdrawalRequest {
  id: string;
  amount: number;
  paymentMethod: string;
  paymentDetails: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

const paymentMethods = [
  {
    id: "Bkash",
    name: "Bkash",
    description: "Mobile banking service",
    icon: BkashIcon,
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    selectedBorder: "border-pink-500",
  },
  {
    id: "Nagad",
    name: "Nagad",
    description: "Digital financial service",
    icon: NagadIcon,
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    selectedBorder: "border-orange-500",
  },
  {
    id: "Binance",
    name: "Binance",
    description: "Cryptocurrency exchange",
    icon: BinanceIcon,
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    selectedBorder: "border-yellow-500",
  },
];

export default function WithdrawPage() {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    paymentMethod: "",
    paymentDetails: "",
  });

  const fetchRequests = async () => {
    if (!user) return;

    const requestsQuery = query(
      collection(db, "withdrawalRequests"),
      where("userId", "==", user.uid)
    );

    const snapshot = await getDocs(requestsQuery);
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
    if (!user) {
      setLoading(false);
      return;
    }

    // Real-time listener for withdrawal requests
    const requestsQuery = query(
      collection(db, "withdrawalRequests"),
      where("userId", "==", user.uid)
    );
    
    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
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
  }, [user]);

  const handlePaymentMethodSelect = (methodId: string) => {
    setFormData({ ...formData, paymentMethod: methodId });
    setPaymentDialogOpen(false);
  };

  const getSelectedPaymentMethod = () => {
    return paymentMethods.find((m) => m.id === formData.paymentMethod);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const amount = parseFloat(formData.amount);

    if (!amount || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (amount < 100) {
      setError("Minimum withdrawal amount is ৳100");
      return;
    }

    if (amount > (userProfile?.balance || 0)) {
      setError("Insufficient balance");
      return;
    }

    if (!formData.paymentMethod || !formData.paymentDetails) {
      setError("Please fill in all payment details");
      return;
    }

    setSubmitLoading(true);
    try {
      // Deduct balance immediately when submitting withdrawal request
      const newBalance = (userProfile?.balance || 0) - amount;
      await updateDoc(doc(db, "users", user!.uid), {
        balance: newBalance,
      });

      // Create withdrawal request
      await addDoc(collection(db, "withdrawalRequests"), {
        userId: user?.uid,
        userEmail: user?.email,
        amount,
        paymentMethod: formData.paymentMethod,
        paymentDetails: formData.paymentDetails,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // Notify admins of withdrawal request
      await notifyAdminsOfWithdrawal(
        user!.uid,
        user?.displayName || user?.email || "User",
        amount,
        formData.paymentDetails
      );

      // Create transaction record for the hold
      await addDoc(collection(db, "transactions"), {
        userId: user?.uid,
        userEmail: user?.email,
        type: "withdrawal_pending",
        amount,
        description: `Withdrawal request via ${formData.paymentMethod} (pending)`,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
      setFormData({ amount: "", paymentMethod: "", paymentDetails: "" });
      await fetchRequests();
      await refreshUserProfile();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("[v0] Error submitting withdrawal:", err);
      setError("Failed to submit withdrawal request. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const selectedMethod = getSelectedPaymentMethod();

  return (
    <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pb-24">
      <div className="max-w-2xl mx-auto w-full px-4 md:px-6 lg:px-8 pt-4 md:pt-6 lg:pt-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-900">Withdraw Funds</h1>
          <p className="text-emerald-700 mt-1">Request a withdrawal from your balance</p>
        </div>

        {/* Balance Card */}
        <Card className="border-0 shadow-md bg-gradient-to-r from-emerald-600 to-teal-600 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <p className="text-emerald-100">Available Balance</p>
                <p className="text-3xl font-bold mt-1">
                  ৳{userProfile?.balance?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
                <Wallet className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Form */}
        <Card className="border-0 shadow-md bg-white mb-6">
          <CardHeader>
            <CardTitle className="text-emerald-900">New Withdrawal Request</CardTitle>
            <CardDescription>Fill in the details to request a withdrawal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-emerald-50 border-emerald-200">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-emerald-700">
                    Withdrawal request submitted successfully!
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (৳)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="100"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Minimum ৳100"
                  className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Minimum withdrawal: ৳100</p>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <button
                  type="button"
                  onClick={() => setPaymentDialogOpen(true)}
                  className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/50 transition-all"
                >
                  {selectedMethod ? (
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${selectedMethod.bgColor}`}>
                        <selectedMethod.icon className="h-8 w-8" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">{selectedMethod.name}</p>
                        <p className="text-sm text-gray-500">{selectedMethod.description}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500">Select a payment method</span>
                  )}
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              {/* Payment Method Dialog */}
              <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-center">
                      Choose Payment Method
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {paymentMethods.map((method) => {
                      const isSelected = formData.paymentMethod === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => handlePaymentMethodSelect(method.id)}
                          className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? `${method.selectedBorder} ${method.bgColor}`
                              : `${method.borderColor} hover:${method.bgColor} hover:${method.selectedBorder}`
                          }`}
                        >
                          <div className={`p-3 rounded-xl ${method.bgColor} flex items-center justify-center w-20 h-20 shrink-0`}>
                            <method.icon className="h-12 w-12" />
                          </div>
                          <div className="text-left flex-1">
                            <p className="font-bold text-lg text-gray-900">{method.name}</p>
                            <p className="text-sm text-gray-500">{method.description}</p>
                          </div>
                          {isSelected && (
                            <div className="absolute top-3 right-3 h-6 w-6 bg-emerald-500 rounded-full flex items-center justify-center">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </DialogContent>
              </Dialog>

              <div className="space-y-2">
                <Label htmlFor="paymentDetails">Payment Details</Label>
                <Input
                  id="paymentDetails"
                  type="text"
                  value={formData.paymentDetails}
                  onChange={(e) => setFormData({ ...formData, paymentDetails: e.target.value })}
                  placeholder={
                    formData.paymentMethod === "Binance"
                      ? "Enter your Binance wallet address"
                      : "Enter your account number"
                  }
                  className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={submitLoading || (userProfile?.balance || 0) <= 0}
              >
                {submitLoading ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Withdrawal History */}
        <Card className="border-0 shadow-md bg-white">
          <CardHeader>
            <CardTitle className="text-emerald-900">Withdrawal History</CardTitle>
            <CardDescription>Your previous withdrawal requests</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded" />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No withdrawal requests yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          request.status === "approved"
                            ? "bg-emerald-100"
                            : request.status === "rejected"
                            ? "bg-red-100"
                            : "bg-amber-100"
                        }`}
                      >
                        {request.status === "approved" ? (
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                        ) : request.status === "rejected" ? (
                          <X className="h-5 w-5 text-red-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          ৳{request.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {request.paymentMethod} - {request.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        request.status === "approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : request.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
