"use client";

import { useEffect, useState } from "react";
import { XCircle, LogOut, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface RejectedAccountModalProps {
  isOpen: boolean;
  onLogout: () => void;
}

export function RejectedAccountModal({ isOpen, onLogout }: RejectedAccountModalProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

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
    // Don't redirect - let Firebase auth state change handle it
    // The user will be logged out and app will naturally redirect to login
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-300 max-h-screen overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with icon */}
          <div className="bg-gradient-to-br from-gray-600 to-gray-700 px-4 sm:px-6 py-6 sm:py-8 text-center">
            <div className="mx-auto w-16 sm:w-20 h-16 sm:h-20 bg-white/20 rounded-full flex items-center justify-center mb-3 sm:mb-4 backdrop-blur-sm flex-shrink-0">
              <XCircle className="w-8 sm:w-10 h-8 sm:h-10 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white text-balance">Request Rejected</h2>
          </div>

          {/* Content */}
          <div className="px-4 sm:px-6 py-5 sm:py-6">
            {/* Warning box */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-5 sm:mb-6">
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertTriangle className="w-4 sm:w-5 h-4 sm:h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-800 text-balance">
                    Your account registration has been rejected
                  </p>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    The administrator has declined your registration request. This may be due to incomplete information or other reasons.
                  </p>
                </div>
              </div>
            </div>

            {/* Additional info */}
            <div className="space-y-2 sm:space-y-3 text-center mb-5 sm:mb-6">
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                If you believe this is a mistake, please contact our support team for more information.
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                You may try registering again with valid information.
              </p>
            </div>

            {/* Action button */}
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full bg-gray-700 hover:bg-gray-800 text-white py-5 sm:py-6 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base transition-all disabled:opacity-75"
            >
              {isLoggingOut ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 sm:h-5 w-4 sm:w-5" viewBox="0 0 24 24">
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
                  <span>Logging out...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <LogOut className="w-4 sm:w-5 h-4 sm:h-5" />
                  <span>Return to Login</span>
                </span>
              )}
            </Button>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100">
            <p className="text-xs text-center text-gray-500 leading-relaxed">
              Need help?{" "}
              <span className="text-gray-700 font-medium">Contact Support</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
