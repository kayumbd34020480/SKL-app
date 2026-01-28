'use client';

import { useRouter } from "next/navigation";
import { useSectionLoader } from "@/contexts/section-loader-context";
import { useCallback } from "react";

export function useSectionNavigation() {
  const router = useRouter();
  const { showLoader, hideLoader } = useSectionLoader();

  const navigateTo = useCallback(
    async (path: string, message: string = "Loading section...") => {
      showLoader(message);
      // Small delay to ensure loader appears smoothly
      setTimeout(() => {
        router.push(path);
        // Hide loader after navigation
        setTimeout(() => {
          hideLoader();
        }, 800);
      }, 100);
    },
    [router, showLoader, hideLoader]
  );

  return { navigateTo };
}
