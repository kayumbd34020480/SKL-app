"use client";

import { useEffect, useState } from "react";
import { Clock, LogOut, UserCheck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PendingApprovalModalProps {
  isOpen: boolean;
  onLogout: () => void;
  userEmail?: string;
}

export function PendingApprovalModal({ isOpen, onLogout, userEmail }: PendingApprovalModalProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await onLogout();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-auto my-auto animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with icon - reduced padding on mobile */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 px-4 sm:px-6 py-5 sm:py-6 text-center">
            <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm">
              <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Pending Approval</h2>
          </div>

          {/* Content - reduced padding on mobile */}
          <div className="px-4 sm:px-6 py-4 sm:py-5">
            {/* Info box */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 sm:p-4 mb-4 sm:mb-5">
              <div className="flex items-start gap-2 sm:gap-3">
                <UserCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Your account is awaiting administrator approval
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Please wait while the admin reviews your registration request. This usually takes a short time.
                  </p>
                </div>
              </div>
            </div>

            {/* User email display */}
            {userEmail && (
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-5">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Registered Email</p>
                    <p className="text-sm font-medium text-gray-800 truncate">{userEmail}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Status indicator */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-amber-500"></span>
                </span>
                <span className="text-xs sm:text-sm text-gray-600">Waiting for admin review...</span>
              </div>
            </div>

            {/* Additional info */}
            <div className="space-y-1.5 sm:space-y-2 text-center mb-4 sm:mb-5">
              <p className="text-xs sm:text-sm text-gray-600">
                You will receive access once approved.
              </p>
              <p className="text-xs text-gray-500">
                Check back later or contact support if you have questions.
              </p>
            </div>

            {/* Action button */}
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="outline"
              className="w-full border-amber-200 text-amber-700 hover:bg-amber-50 py-4 sm:py-5 rounded-xl font-medium text-sm sm:text-base transition-all bg-transparent"
            >
              {isLoggingOut ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Logging out...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                  Return to Login
                </span>
              )}
            </Button>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100">
            <p className="text-xs text-center text-gray-500">
              Need help?{" "}
              <span className="text-amber-600 font-medium">Contact Support</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
