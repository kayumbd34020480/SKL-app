"use client";

import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, updateDoc, doc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, Trash2, Coins, Wallet, AlertCircle, X, User, Edit, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  userId: string;
  type: "balance_added" | "balance_removed" | "withdrawal_approved" | "withdrawal_rejected" | "task_approved" | "task_rejected" | "info";
  title: string;
  message: string;
  amount?: number;
  read: boolean;
  createdAt: Date;
}

export function FixedHeader() {
  const { userProfile, user, signOut } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  useEffect(() => {
    if (!user) return;

    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notificationsData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          }))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) as Notification[];

        setNotifications(notificationsData);
        setUnreadCount(notificationsData.filter((n) => !n.read).length);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true,
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read);
      const batch = writeBatch(db);
      for (const notification of unreadNotifications) {
        batch.update(doc(db, "notifications", notification.id), { read: true });
      }
      await batch.commit();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, "notifications", notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      const batch = writeBatch(db);
      for (const notification of notifications) {
        batch.delete(doc(db, "notifications", notification.id));
      }
      await batch.commit();
    } catch (error) {
      console.error("Error deleting all notifications:", error);
    }
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "balance_added":
        return <Coins className="h-4 w-4 text-emerald-600" />;
      case "balance_removed":
        return <Coins className="h-4 w-4 text-red-600" />;
      case "withdrawal_approved":
        return <Wallet className="h-4 w-4 text-emerald-600" />;
      case "withdrawal_rejected":
        return <Wallet className="h-4 w-4 text-red-600" />;
      case "task_approved":
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case "task_rejected":
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  const getBackgroundColor = (type: Notification["type"], read: boolean) => {
    if (read) return "bg-gray-50";
    switch (type) {
      case "balance_added":
      case "withdrawal_approved":
      case "task_approved":
        return "bg-emerald-50";
      case "balance_removed":
      case "withdrawal_rejected":
      case "task_rejected":
        return "bg-red-50";
      default:
        return "bg-blue-50";
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white shadow-md border-b border-gray-200" style={{ height: "60px" }}>
      <div className="w-full h-full px-4 md:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: App Name */}
        <h1 className="text-lg md:text-xl font-bold text-blue-600">NK TECH ZONE</h1>

        {/* Right: Notification and Profile */}
        <div className="flex items-center gap-4">
          {/* Notification Icon with Sheet */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                cursor: "pointer",
                background: "none",
                border: "none",
                padding: "4px",
                position: "relative"
              }}>
                <svg style={{ width: "18px", height: "18px" }} viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    backgroundColor: "#ef4444",
                    color: "white",
                    fontSize: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold"
                  }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle className="text-gray-900">Notifications</SheetTitle>
                <SheetDescription>
                  Updates from admin and system notifications
                </SheetDescription>
                {notifications.length > 0 && (
                  <div className="flex items-center gap-2 pt-2">
                    {unreadCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200 bg-transparent"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark all read
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={deleteAllNotifications}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 bg-transparent"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete all
                    </Button>
                  </div>
                )}
              </SheetHeader>

              <div className="mt-6 space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg text-sm cursor-pointer relative group ${getBackgroundColor(notification.type, notification.read)}`}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <div className="flex items-start gap-2 pr-6">
                        {getIcon(notification.type)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`font-medium text-gray-900 ${!notification.read ? "font-semibold" : ""}`}>{notification.title}</p>
                            {!notification.read && (
                              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                          {notification.amount !== undefined && (
                            <p className={`text-xs font-semibold mt-1 ${
                              notification.type.includes("added") || notification.type.includes("approved")
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}>
                              ৳{notification.amount.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Profile Avatar with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-10 w-10 bg-gray-900 cursor-pointer hover:opacity-80 transition">
                <AvatarFallback className="bg-gray-900 text-white font-semibold text-sm">
                  {userProfile?.displayName?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-3 border-b border-gray-100">
                <p className="font-semibold text-gray-900">{userProfile?.displayName || "User"}</p>
                <p className="text-sm text-gray-500 truncate">{user?.email || "No email"}</p>
              </div>
              <DropdownMenuItem 
                className="cursor-pointer py-2.5 px-3 mt-1"
                onClick={() => router.push("/dashboard/profile")}
              >
                <User className="mr-2 h-4 w-4 text-gray-500" />
                <span>View Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer py-2.5 px-3"
                onClick={() => router.push("/dashboard/profile?edit=true")}
              >
                <Edit className="mr-2 h-4 w-4 text-gray-500" />
                <span>Edit Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer py-2.5 px-3 text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
