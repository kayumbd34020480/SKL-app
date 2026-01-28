"use client";

import React from "react";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useSectionLoader } from "@/contexts/section-loader-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Menu, 
  Plus,
  LayoutDashboard, 
  ClipboardList, 
  Wallet, 
  History, 
  Users, 
  Settings,
  LogOut,
  ShieldCheck,
  Youtube,
  Facebook,
  Mail,
  Instagram,
  Send,
  MessageCircle,
  MoreHorizontal,
  UserPlus
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { notifyAdminsOfSubmission } from "@/lib/notification-service";
import { CheckCircle } from "lucide-react";

const userNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/dashboard/task-history", label: "Task History", icon: History },
  { href: "/dashboard/withdraw", label: "Withdraw", icon: Wallet },
  { href: "/dashboard/transactions", label: "Transactions", icon: History },
  { href: "/dashboard/profile", label: "Profile", icon: Settings },
];

const adminNavItems = [
  { href: "/admin", label: "Admin Dashboard", icon: ShieldCheck },
  { href: "/admin/account-requests", label: "Account Requests", icon: UserPlus },
  { href: "/admin/users", label: "Manage Users", icon: Users },
  { href: "/admin/tasks", label: "Manage Tasks", icon: ClipboardList },
  { href: "/admin/task-slots", label: "Task Slots", icon: Users },
  { href: "/admin/manual-tasks", label: "Manual Tasks", icon: History },
  { href: "/admin/submissions", label: "Task Submissions", icon: ClipboardList },
  { href: "/admin/transactions", label: "Transactions Feed", icon: Wallet },
  { href: "/admin/withdrawals", label: "Withdrawal Requests", icon: Wallet },
];

export function AppSidebar() {
  const [open, setOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    platform: "",
    description: "",
    amount: "0",
  });
  const pathname = usePathname();
  const router = useRouter();
  const { userProfile, signOut, isAdmin, user } = useAuth();
  const { showLoader, hideLoader } = useSectionLoader();

  const navItems = isAdmin ? adminNavItems : userNavItems;

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    router.push("/");
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate required fields
    if (!formData.platform) {
      setError("Please select a platform");
      return;
    }
    if (!formData.description.trim()) {
      setError("Please enter work details");
      return;
    }
    if (parseFloat(formData.amount) <= 0) {
      setError("Please enter a valid earning amount");
      return;
    }
    if (!user || !formData.platform || !formData.description || !formData.amount) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "taskSubmissions"), {
        userId: user.uid,
        userEmail: user.email,
        platform: formData.platform,
        description: formData.description,
        amount: parseFloat(formData.amount),
        status: "pending",
        type: "manual",
        createdAt: serverTimestamp(),
      });

      // Notify admins
      await notifyAdminsOfSubmission(
        user.uid,
        user.displayName || user.email || "User",
        formData.platform,
        formData.description,
        parseFloat(formData.amount)
      );

      setSuccess(true);
      setFormData({ platform: "", description: "", amount: "0" });
      setTimeout(() => {
        setSuccess(false);
        setSubmitOpen(false);
      }, 2000);
    } catch (error) {
      console.error("[v0] Error submitting work:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 items-center">
      {/* Submit Work Dialog - Users Only */}
      {!isAdmin && (
        <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
          <DialogContent className="w-full max-w-md mx-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900">Submit New Work</DialogTitle>
              <DialogDescription className="text-sm"></DialogDescription>
            </DialogHeader>

            {success ? (
              <Alert className="bg-emerald-50 border-emerald-200">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-700">
                  Work submitted successfully! Waiting for admin approval.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {error && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleSubmitWork} className="space-y-4">
                  {/* Platform Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-900">Select Platform</Label>
                    <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
                      <SelectTrigger className="border border-gray-300 bg-gray-50">
                        <SelectValue placeholder="Choose a platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="YouTube">
                          <div className="flex items-center gap-2">
                            <Youtube className="h-4 w-4 text-red-600" />
                            YouTube
                          </div>
                        </SelectItem>
                        <SelectItem value="Facebook">
                          <div className="flex items-center gap-2">
                            <Facebook className="h-4 w-4 text-blue-600" />
                            Facebook
                          </div>
                        </SelectItem>
                        <SelectItem value="TikTok">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-black" />
                            TikTok
                          </div>
                        </SelectItem>
                        <SelectItem value="Gmail">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-red-500" />
                            Gmail
                          </div>
                        </SelectItem>
                        <SelectItem value="Instagram">
                          <div className="flex items-center gap-2">
                            <Instagram className="h-4 w-4 text-pink-600" />
                            Instagram
                          </div>
                        </SelectItem>
                        <SelectItem value="Telegram">
                          <div className="flex items-center gap-2">
                            <Send className="h-4 w-4 text-blue-500" />
                            Telegram
                          </div>
                        </SelectItem>
                        <SelectItem value="Other">
                          <div className="flex items-center gap-2">
                            <MoreHorizontal className="h-4 w-4 text-gray-600" />
                            Other
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Work Details */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-900">Work Details</Label>
                    <Textarea
                      placeholder="Describe your work…"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="border border-gray-300 bg-gray-50 min-h-20 focus:border-blue-500 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  {/* Earning Amount */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-900">Earning Amount (৳)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="border border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSubmitOpen(false)}
                      className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm"
                      disabled={loading}
                    >
                      {loading ? "Submitting..." : "Submit Work"}
                    </Button>
                </div>
              </form>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Plus Button - Users Only */}
      {!isAdmin && (
        <Button
          size="icon"
          className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          onClick={() => setSubmitOpen(true)}
          title="Submit new work"
        >
          <Plus className="h-5 w-5" />
          <span className="sr-only">Submit work</span>
        </Button>
      )}

      {/* Menu Button */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            size="icon"
            className="h-10 w-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 bg-white">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-emerald-100 bg-emerald-50">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-emerald-900">NK TECH ZONE</h2>
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 bg-emerald-600">
                  <AvatarFallback className="bg-emerald-600 text-white font-semibold">
                    {userProfile?.displayName?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-emerald-900 truncate">
                    {userProfile?.displayName || "User"}
                  </p>
                  {!isAdmin && (
                    <p className="text-sm text-emerald-600">
                      Balance: ৳{userProfile?.balance?.toFixed(2) || "0.00"}
                    </p>
                  )}
                </div>
              </div>
              {isAdmin && (
                <span className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-600 text-white">
                  Admin
                </span>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 overflow-y-auto">
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
                    if (!isActive) {
                      e.preventDefault();
                      showLoader(`Loading ${item.label.toLowerCase()}...`);
                      setOpen(false);
                      setTimeout(() => {
                        router.push(item.href);
                        setTimeout(() => hideLoader(), 600);
                      }, 100);
                    }
                  };
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={handleNavClick}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                          isActive 
                            ? "bg-emerald-100 text-emerald-900 font-medium" 
                            : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-800"
                        )}
                      >
                        <item.icon className={cn("h-5 w-5", isActive ? "text-emerald-600" : "text-gray-500")} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-emerald-100">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
