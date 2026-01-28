"use client";

import { useEffect, useState } from "react";
import { collection, doc, updateDoc, addDoc, serverTimestamp, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Users, 
  Ban, 
  CheckCircle, 
  Plus, 
  Minus, 
  Edit,
  Search,
  Award
} from "lucide-react";

interface User {
  uid: string;
  email: string;
  displayName: string;
  balance: number;
  role: string;
  isBanned: boolean;
  badge?: string | null;
  createdAt: Date;
  phone?: string;
  address?: string;
}

const fetchUsers = async () => {
  const querySnapshot = await getDocs(collection(db, "users"));
  const usersData = querySnapshot.docs.map((docSnap) => ({
    uid: docSnap.id,
    ...docSnap.data(),
    createdAt: docSnap.data().createdAt?.toDate() || new Date(),
  })) as User[];
  return usersData;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceDescription, setBalanceDescription] = useState("");
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [balanceAction, setBalanceAction] = useState<"add" | "remove">("add");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: "", phone: "", address: "" });
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<"MEMBER" | "PREMIUM" | "VIP" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    // Real-time listener for users
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs.map((docSnap) => ({
        uid: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      })) as User[];
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleBan = async (user: User) => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        isBanned: !user.isBanned,
      });
      const updatedUsers = await fetchUsers();
      setUsers(updatedUsers);
    } catch (error) {
      console.error("[v0] Error toggling ban:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBalanceUpdate = async () => {
    if (!selectedUser || !balanceAmount) return;

    setActionLoading(true);
    try {
      const amount = parseFloat(balanceAmount);
      const newBalance =
        balanceAction === "add"
          ? selectedUser.balance + amount
          : Math.max(0, selectedUser.balance - amount);

      await updateDoc(doc(db, "users", selectedUser.uid), {
        balance: newBalance,
      });

      // Create transaction record
      await addDoc(collection(db, "transactions"), {
        userId: selectedUser.uid,
        userEmail: selectedUser.email,
        type: balanceAction === "add" ? "credit" : "debit",
        amount,
        description: balanceDescription || `Admin ${balanceAction === "add" ? "added" : "removed"} balance`,
        status: "completed",
        createdAt: serverTimestamp(),
      });

      // Create notification for user
      await addDoc(collection(db, "notifications"), {
        userId: selectedUser.uid,
        type: balanceAction === "add" ? "balance_added" : "balance_removed",
        title: balanceAction === "add" ? "Balance Added" : "Balance Removed",
        message: balanceDescription || `Admin ${balanceAction === "add" ? "added" : "removed"} balance from your account`,
        amount,
        read: false,
        createdAt: serverTimestamp(),
      });

      setBalanceDialogOpen(false);
      setBalanceAmount("");
      setBalanceDescription("");
      setSelectedUser(null);
      const updatedUsers = await fetchUsers();
      setUsers(updatedUsers);
    } catch (error) {
      console.error("[v0] Error updating balance:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      await updateDoc(doc(db, "users", selectedUser.uid), {
        displayName: editForm.displayName,
        phone: editForm.phone,
        address: editForm.address,
      });

      setEditDialogOpen(false);
      setSelectedUser(null);
      const updatedUsers = await fetchUsers();
      setUsers(updatedUsers);
    } catch (error) {
      console.error("[v0] Error updating user:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      displayName: user.displayName,
      phone: user.phone || "",
      address: user.address || "",
    });
    setEditDialogOpen(true);
  };

  const openBalanceDialog = (user: User, action: "add" | "remove") => {
    setSelectedUser(user);
    setBalanceAction(action);
    setBalanceDialogOpen(true);
  };

  const openBadgeDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedBadge(user.badge as "MEMBER" | "PREMIUM" | "VIP" | null);
    setBadgeDialogOpen(true);
  };

  const handleBadgeUpdate = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      await updateDoc(doc(db, "users", selectedUser.uid), {
        badge: selectedBadge,
      });

      // Create notification for user
      await addDoc(collection(db, "notifications"), {
        userId: selectedUser.uid,
        type: selectedBadge ? "badge_assigned" : "badge_removed",
        title: selectedBadge ? `${selectedBadge} Badge Assigned!` : "Badge Removed",
        message: selectedBadge
          ? `Congratulations! You have been assigned the ${selectedBadge} badge.`
          : "Your badge has been removed.",
        read: false,
        createdAt: serverTimestamp(),
      });

      setBadgeDialogOpen(false);
      setSelectedUser(null);
      setSelectedBadge(null);
      const updatedUsers = await fetchUsers();
      setUsers(updatedUsers);
    } catch (error) {
      console.error("[v0] Error updating badge:", error);
    } finally {
      setActionLoading(false);
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

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-900">Manage Users</h1>
          <p className="text-emerald-700 mt-1">View and manage all registered users</p>
        </div>

        {/* Search */}
        <Card className="border-0 shadow-md bg-white mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users List - Responsive Layout */}
        <Card className="border-0 shadow-md bg-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-emerald-900">All Users</CardTitle>
            </div>
            <CardDescription>{filteredUsers.length} users found</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Badge</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{user.displayName}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-emerald-600">
                          ৳{user.balance.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.badge ? (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${
                              user.badge === "VIP"
                                ? "bg-purple-100 text-purple-700"
                                : user.badge === "PREMIUM"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            <Award className="h-3 w-3" />
                            {user.badge}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">No badge</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.isBanned
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {user.isBanned ? "Banned" : "Active"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-transparent border-purple-200 text-purple-600 hover:bg-purple-50"
                            onClick={() => openBadgeDialog(user)}
                            title="Manage badge"
                          >
                            <Award className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-transparent border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            onClick={() => openBalanceDialog(user, "add")}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-transparent border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => openBalanceDialog(user, "remove")}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-transparent border-gray-200 text-gray-600 hover:bg-gray-50"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={`bg-transparent ${
                              user.isBanned
                                ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                : "border-red-200 text-red-600 hover:bg-red-50"
                            }`}
                            onClick={() => handleToggleBan(user)}
                            disabled={actionLoading}
                          >
                            {user.isBanned ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Ban className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredUsers.map((user) => (
                <div key={user.uid} className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
                  {/* User Info */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{user.displayName}</p>
                      <p className="text-xs text-gray-600 truncate">{user.email}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        user.isBanned
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {user.isBanned ? "Banned" : "Active"}
                    </span>
                  </div>

                  {/* User Details */}
                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Balance:</span>
                      <span className="font-semibold text-emerald-600">৳{user.balance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Role:</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Badge:</span>
                      {user.badge ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                            user.badge === "VIP"
                              ? "bg-purple-100 text-purple-700"
                              : user.badge === "PREMIUM"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          <Award className="h-3 w-3" />
                          {user.badge}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">No badge</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-200 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 bg-transparent border-purple-200 text-purple-600 hover:bg-purple-50 text-xs"
                      onClick={() => openBadgeDialog(user)}
                      title="Manage badge"
                    >
                      <Award className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 bg-transparent border-emerald-200 text-emerald-600 hover:bg-emerald-50 text-xs"
                      onClick={() => openBalanceDialog(user, "add")}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 bg-transparent border-red-200 text-red-600 hover:bg-red-50 text-xs"
                      onClick={() => openBalanceDialog(user, "remove")}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 bg-transparent border-gray-200 text-gray-600 hover:bg-gray-50 text-xs"
                      onClick={() => openEditDialog(user)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={`flex-1 bg-transparent text-xs ${
                        user.isBanned
                          ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                          : "border-red-200 text-red-600 hover:bg-red-50"
                      }`}
                      onClick={() => handleToggleBan(user)}
                      disabled={actionLoading}
                    >
                      {user.isBanned ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <Ban className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Balance Dialog */}
        <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-emerald-900">
                {balanceAction === "add" ? "Add Balance" : "Remove Balance"}
              </DialogTitle>
              <DialogDescription>
                {balanceAction === "add" ? "Add funds to" : "Remove funds from"}{" "}
                {selectedUser?.displayName}&apos;s account
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Amount (৳)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  value={balanceDescription}
                  onChange={(e) => setBalanceDescription(e.target.value)}
                  placeholder="Reason for balance change"
                  className="border-gray-200"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setBalanceDialogOpen(false)}
                  className="bg-transparent border-gray-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBalanceUpdate}
                  disabled={actionLoading || !balanceAmount}
                  className={
                    balanceAction === "add"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }
                >
                  {actionLoading ? "Processing..." : balanceAction === "add" ? "Add" : "Remove"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Badge Dialog */}
        <Dialog open={badgeDialogOpen} onOpenChange={setBadgeDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-emerald-900">Manage User Badge</DialogTitle>
              <DialogDescription>
                Assign or remove a badge for {selectedUser?.displayName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-3">
                <Label>Select Badge</Label>
                <div className="space-y-2">
                  {[
                    { value: null, label: "No Badge", color: "gray" },
                    { value: "MEMBER", label: "Member Badge", color: "gray" },
                    { value: "PREMIUM", label: "Premium Badge", color: "blue" },
                    { value: "VIP", label: "VIP Badge", color: "purple" },
                  ].map((badge) => (
                    <button
                      key={badge.value || "none"}
                      onClick={() => setSelectedBadge(badge.value as any)}
                      className={`w-full p-3 rounded-lg border-2 flex items-center gap-2 transition ${
                        selectedBadge === badge.value
                          ? badge.color === "purple"
                            ? "border-purple-500 bg-purple-50"
                            : badge.color === "blue"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-500 bg-gray-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      {badge.value && <Award className="h-4 w-4" />}
                      <span className="font-medium">{badge.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setBadgeDialogOpen(false)}
                  className="bg-transparent border-gray-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBadgeUpdate}
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {actionLoading ? "Updating..." : "Save Badge"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-emerald-900">Edit User Profile</DialogTitle>
              <DialogDescription>
                Update {selectedUser?.email}&apos;s profile information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  className="border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="border-gray-200"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  className="bg-transparent border-gray-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditUser}
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {actionLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
