"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, LogOut, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BanNoticeModalProps {
  isOpen: boolean;
  onLogout: () => void;
}

export function BanNoticeModal({ isOpen, onLogout }: BanNoticeModalProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Reset loading state when modal opens
      setIsLoggingOut(false);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setIsLoggingOut(false);
    }
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
          <div className="bg-gradient-to-br from-red-500 to-red-600 px-4 sm:px-6 py-5 sm:py-6 text-center">
            <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm">
              <ShieldX className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Account Suspended</h2>
          </div>

          {/* Content - reduced padding on mobile */}
          <div className="px-4 sm:px-6 py-4 sm:py-5">
            {/* Warning box */}
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 sm:p-4 mb-4 sm:mb-5">
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Your account has been banned by the administrator
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Access to your account has been restricted due to a violation of our terms of service or community guidelines.
                  </p>
                </div>
              </div>
            </div>

            {/* Additional info */}
            <div className="space-y-2 sm:space-y-3 text-center mb-4 sm:mb-5">
              <p className="text-xs sm:text-sm text-gray-600">
                If you believe this is a mistake, please contact our support team for assistance.
              </p>
              <p className="text-xs text-gray-500">
                Please log out to continue.
              </p>
            </div>

            {/* Action button */}
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-4 sm:py-5 rounded-xl font-medium text-sm sm:text-base transition-all"
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
                  Log Out
                </span>
              )}
            </Button>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100">
            <p className="text-xs text-center text-gray-500">
              Need help?{" "}
              <span className="text-red-600 font-medium">Contact Support</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
