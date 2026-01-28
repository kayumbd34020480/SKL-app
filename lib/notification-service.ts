import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Create a notification for admins when a user submits work
 */
export async function notifyAdminsOfSubmission(
  userId: string,
  userName: string,
  platform: string,
  description: string,
  amount: number
) {
  try {
    // Get all admin users
    const adminsQuery = query(collection(db, "users"), where("role", "==", "admin"));
    const adminsSnap = await getDocs(adminsQuery);

    // Create notification for each admin
    const notificationPromises = adminsSnap.docs.map((adminDoc) =>
      addDoc(collection(db, "notifications"), {
        userId: adminDoc.id,
        type: "user_submission",
        title: `New Work Submission from ${userName}`,
        message: `${userName} submitted work on ${platform}. Description: ${description}. Amount: ৳${amount}`,
        amount: amount,
        submissionData: {
          userId,
          userName,
          platform,
          description,
          amount,
        },
        read: false,
        createdAt: serverTimestamp(),
      })
    );

    await Promise.all(notificationPromises);
  } catch (error) {
    console.error("[v0] Error notifying admins:", error);
  }
}

/**
 * Create a notification for admins when a user requests withdrawal
 */
export async function notifyAdminsOfWithdrawal(
  userId: string,
  userName: string,
  amount: number,
  bankAccount: string
) {
  try {
    const adminsQuery = query(collection(db, "users"), where("role", "==", "admin"));
    const adminsSnap = await getDocs(adminsQuery);

    const notificationPromises = adminsSnap.docs.map((adminDoc) =>
      addDoc(collection(db, "notifications"), {
        userId: adminDoc.id,
        type: "withdrawal_request",
        title: `New Withdrawal Request from ${userName}`,
        message: `${userName} requested withdrawal of ৳${amount} to account ${bankAccount}`,
        amount: amount,
        withdrawalData: {
          userId,
          userName,
          amount,
          bankAccount,
        },
        read: false,
        createdAt: serverTimestamp(),
      })
    );

    await Promise.all(notificationPromises);
  } catch (error) {
    console.error("[v0] Error notifying admins of withdrawal:", error);
  }
}

/**
 * Create a notification for a user when admin takes action
 */
export async function notifyUserOfAction(
  userId: string,
  type: "task_approved" | "task_rejected" | "withdrawal_approved" | "withdrawal_rejected",
  title: string,
  message: string,
  amount?: number
) {
  try {
    await addDoc(collection(db, "notifications"), {
      userId,
      type,
      title,
      message,
      amount,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("[v0] Error notifying user:", error);
  }
}
