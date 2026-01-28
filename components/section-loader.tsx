"use client";

import { useSectionLoader } from "@/contexts/section-loader-context";

export function SectionLoader() {
  const { isLoading, message } = useSectionLoader();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-all duration-200">
      <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-6 min-w-[300px]">
        {/* Animated loader circles */}
        <div className="relative w-16 h-16">
          {/* Outer circle */}
          <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
          
          {/* Rotating gradient circle */}
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 border-r-teal-500"
            style={{
              animation: "spin 1.2s linear infinite",
            }}
          />

          {/* Inner pulsing circle */}
          <div
            className="absolute inset-2 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500"
            style={{
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />
        </div>

        {/* Loading text */}
        <div className="text-center">
          <p className="text-gray-800 font-semibold text-sm">{message}</p>
          
          {/* Animated dots */}
          <div className="flex items-center justify-center gap-1 mt-3">
            <span
              className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
              style={{
                animation: "bounce 1.4s infinite",
                animationDelay: "0ms",
              }}
            />
            <span
              className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
              style={{
                animation: "bounce 1.4s infinite",
                animationDelay: "200ms",
              }}
            />
            <span
              className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
              style={{
                animation: "bounce 1.4s infinite",
                animationDelay: "400ms",
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
            opacity: 1;
          }
          50% {
            transform: translateY(-8px);
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
}
