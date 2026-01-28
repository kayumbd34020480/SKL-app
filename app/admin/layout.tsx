"use client";

import React from "react"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { AppSidebar } from "@/components/app-sidebar";
import { FixedHeader } from "@/components/fixed-header";
import { SectionLoaderProvider } from "@/contexts/section-loader-context";
import { SectionLoader } from "@/components/section-loader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (!loading && user && !isAdmin) {
      router.push("/dashboard");
    }
  }, [user, isAdmin, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <SectionLoaderProvider>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
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
