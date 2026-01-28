"use client";

import React from "react"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { AppSidebar } from "@/components/app-sidebar";
import { Notifications } from "@/components/notifications";
import { FixedHeader } from "@/components/fixed-header";
import { AppLoader } from "@/components/app-loader";
import { SectionLoaderProvider } from "@/contexts/section-loader-context";
import { SectionLoader } from "@/components/section-loader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (!loading && userProfile?.isBanned) {
      router.push("/login");
    }
  }, [user, userProfile, loading, router]);

  if (loading) {
    return <AppLoader message="Loading your dashboard..." />;
  }

  if (!user || userProfile?.isBanned) {
    return null;
  }

  // If user is rejected, show the layout with rejected modal overlay
  // Don't redirect - let them see the rejected modal and logout manually

  return (
    <SectionLoaderProvider>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <SectionLoader />
        <FixedHeader />
        <div className="pt-16">
          {children}
          <AppSidebar />
        </div>
      </div>
    </SectionLoaderProvider>
  );
}
