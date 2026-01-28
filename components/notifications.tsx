"use client";

import React from "react"

import { useEffect, useState } from "react";
import { collection, query, where, updateDoc, doc, deleteDoc, onSnapshot, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Bell, CheckCircle, X, Coins, Wallet, AlertCircle, Trash2 } from "lucide-react";

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

export function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Real-time listener for notifications
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
      },
      (error) => {
        console.error("Error listening to notifications:", error);
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

  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
        return <Coins className="h-5 w-5 text-emerald-600" />;
      case "balance_removed":
        return <Coins className="h-5 w-5 text-red-600" />;
      case "withdrawal_approved":
        return <Wallet className="h-5 w-5 text-emerald-600" />;
      case "withdrawal_rejected":
        return <Wallet className="h-5 w-5 text-red-600" />;
      case "task_approved":
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case "task_rejected":
        return <X className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 right-4 z-50 h-12 w-12 rounded-full bg-white shadow-lg hover:bg-gray-50 border border-gray-200"
        >
          <Bell className="h-5 w-5 text-emerald-700" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-emerald-900">Notifications</SheetTitle>
          </div>
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

        <div className="mt-6 space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg cursor-pointer transition-colors relative group ${getBackgroundColor(
                  notification.type,
                  notification.read
                )}`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600 hover:bg-red-50"
                  onClick={(e) => deleteNotification(notification.id, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="flex items-start gap-3 pr-8">
                  <div className="mt-0.5">{getIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`font-medium text-gray-900 ${!notification.read ? "font-semibold" : ""}`}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    {notification.amount !== undefined && (
                      <p className={`text-sm font-semibold mt-1 ${
                        notification.type.includes("added") || notification.type.includes("approved")
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}>
                        {notification.type.includes("added") || notification.type === "withdrawal_rejected" ? "+" : ""}
                        ৳{notification.amount.toFixed(2)}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {notification.createdAt.toLocaleDateString()} at{" "}
                      {notification.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
