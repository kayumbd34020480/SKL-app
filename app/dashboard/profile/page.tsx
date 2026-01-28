"use client";

import React, { useRef } from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { doc, updateDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Edit2, CheckCircle, Wallet, ClipboardList, ArrowDownLeft, Phone, MapPin, Camera, Loader2 } from "lucide-react";

const MAX_FILE_SIZE = 500 * 1024; // 500KB

export default function ProfilePage() {
  const { userProfile, user, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [totalWorks, setTotalWorks] = useState(0);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    displayName: userProfile?.displayName || "",
    phone: userProfile?.phone || "",
    address: userProfile?.address || "",
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setAvatarError(null);

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setAvatarError("Image size must be less than 500KB");
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setAvatarError("Only JPEG, PNG, GIF, and WebP images are allowed");
      return;
    }

    setAvatarUploading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('userId', user.uid);
      if (userProfile?.avatarUrl) {
        uploadFormData.append('oldAvatarUrl', userProfile.avatarUrl);
      }

      const response = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }
      
      // Update user profile in Firebase
      await updateDoc(doc(db, "users", user.uid), {
        avatarUrl: result.url,
      });

      await refreshUserProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Real-time stats calculation
  useEffect(() => {
    if (!user) return;

    // Real-time listener for total works (all task submissions)
    const submissionsQuery = query(
      collection(db, "taskSubmissions"),
      where("userId", "==", user.uid)
    );
    const unsubscribeSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
      setTotalWorks(snapshot.size);
    });

    // Real-time listener for total withdrawals (sum of approved withdrawal amounts)
    const withdrawalsQuery = query(
      collection(db, "withdrawalRequests"),
      where("userId", "==", user.uid),
      where("status", "==", "approved")
    );
    const unsubscribeWithdrawals = onSnapshot(withdrawalsQuery, (snapshot) => {
      let totalAmount = 0;
      snapshot.docs.forEach((docSnap) => {
        totalAmount += docSnap.data().amount || 0;
      });
      setTotalWithdrawals(totalAmount);
    });

    return () => {
      unsubscribeSubmissions();
      unsubscribeWithdrawals();
    };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setSuccess(false);

    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: formData.displayName,
        phone: formData.phone,
        address: formData.address,
      });
      await refreshUserProfile();
      setSuccess(true);
      setEditMode(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // Error updating profile
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 pb-24">
      <div className="max-w-2xl mx-auto w-full px-4 md:px-6 lg:px-8 pt-4 md:pt-6 lg:pt-8">
        
        {/* Success Alert */}
        {success && (
          <Alert className="bg-emerald-50 border-emerald-200 mb-6">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-700">
              Profile updated successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* User Card */}
        <Card className="border-0 shadow-md bg-white mb-4 sm:mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="relative flex-shrink-0">
                <Avatar className="h-14 w-14 sm:h-16 sm:w-16 bg-emerald-600">
                  {userProfile?.avatarUrl ? (
                    <AvatarImage src={userProfile.avatarUrl || "/placeholder.svg"} alt={userProfile?.displayName || "User"} />
                  ) : null}
                  <AvatarFallback className="bg-emerald-600 text-white text-lg sm:text-xl font-semibold">
                    {userProfile?.displayName?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {editMode && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg border-2 border-white disabled:opacity-50"
                    >
                      {avatarUploading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Camera className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base sm:text-xl font-bold text-gray-900 truncate">
                    {userProfile?.displayName || "User"}
                  </h2>
                  {userProfile?.badge && (
                    <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold whitespace-nowrap flex-shrink-0 ${
                      userProfile.badge === "VIP"
                        ? "bg-purple-400 text-white"
                        : userProfile.badge === "PREMIUM"
                        ? "bg-yellow-400 text-yellow-900"
                        : "bg-amber-300 text-amber-900"
                    }`}>
                      {userProfile.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 truncate">{userProfile?.email}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                  Joined {userProfile?.joinedDate ? new Date(userProfile.joinedDate).toLocaleDateString() : "Recently"}
                </p>
              </div>
            </div>

            {/* Avatar Error */}
            {avatarError && (
              <Alert className="bg-red-50 border-red-200 mb-4">
                <AlertDescription className="text-red-700 text-sm">
                  {avatarError}
                </AlertDescription>
              </Alert>
            )}

            {/* Avatar Upload Hint */}
            {editMode && (
              <p className="text-xs text-gray-500 mb-4 text-center">
                Click the camera icon to upload a profile photo (max 500KB)
              </p>
            )}

            {!editMode ? (
              <Button
                onClick={() => setEditMode(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-10 sm:h-11 text-sm"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="displayName" className="text-xs text-gray-700">Full Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-10"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs text-gray-700">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone number"
                    className="text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-xs text-gray-700">Address</Label>
                  <Input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Address"
                    className="text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-10"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm h-10"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 text-sm bg-transparent h-10"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Bio Section */}
        {!editMode && userProfile?.bio && (
          <Card className="border-0 shadow-md bg-white mb-6">
            <CardContent className="p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Bio</h3>
              <p className="text-sm text-gray-600">{userProfile.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Professional Info Section */}
        {!editMode && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100 mb-4 sm:mb-6">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-4 sm:mb-6">Professional Information</h3>
              <div className="space-y-3 sm:space-y-4">
                {/* Full Name */}
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</p>
                    <p className="text-xs sm:text-sm font-medium text-gray-900 mt-0.5 truncate">
                      {userProfile?.displayName || "Not provided"}
                    </p>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone Number</p>
                    <p className="text-xs sm:text-sm font-medium text-gray-900 mt-0.5 truncate">
                      {userProfile?.phone || "Not provided"}
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">Address</p>
                    <p className="text-xs sm:text-sm font-medium text-gray-900 mt-0.5 truncate">
                      {userProfile?.address || "Not provided"}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</p>
                    <p className="text-xs sm:text-sm font-medium text-gray-900 mt-0.5 truncate">
                      {userProfile?.email || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 gap-3 mb-4 sm:mb-6">
          {/* Balance Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-blue-600 font-semibold mb-1">Balance</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-900">৳{userProfile?.balance?.toFixed(2) || "0"}</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-blue-200 flex items-center justify-center flex-shrink-0">
                  <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Works Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-emerald-600 font-semibold mb-1">Total Works</p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-900">{totalWorks}</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-emerald-200 flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Withdrawals Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-orange-600 font-semibold mb-1">Withdrawals</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-900">৳{totalWithdrawals.toFixed(2)}</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-orange-200 flex items-center justify-center flex-shrink-0">
                  <ArrowDownLeft className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Works History */}
        {userProfile?.works && userProfile.works.length > 0 && (
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-6">
              <h3 className="text-base font-bold text-gray-900 mb-4">Works ({userProfile.works.length})</h3>
              <div className="space-y-4">
                {userProfile.works.map((work: any, index: number) => (
                  <div key={index} className="pb-4 border-b border-gray-200 last:border-b-0">
                    <p className="text-sm font-semibold text-gray-900">{work.title || "Task"}</p>
                    <p className="text-xs text-gray-600 mt-1">{work.description || ""}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm font-bold text-blue-600">৳{work.amount || 0}</p>
                      <span className={`text-xs font-semibold px-3 py-1 rounded ${
                        work.status === "Approved" 
                          ? "bg-green-100 text-green-700"
                          : work.status === "Rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {work.status || "Pending"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
