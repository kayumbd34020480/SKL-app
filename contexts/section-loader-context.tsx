"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

interface SectionLoaderContextType {
  isLoading: boolean;
  showLoader: (message?: string) => void;
  hideLoader: () => void;
  setMessage: (message: string) => void;
  message: string;
}

const SectionLoaderContext = createContext<SectionLoaderContextType | undefined>(undefined);

export function SectionLoaderProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("Loading section...");

  const showLoader = useCallback((msg?: string) => {
    if (msg) setMessage(msg);
    setIsLoading(true);
  }, []);

  const hideLoader = useCallback(() => {
    setIsLoading(false);
  }, []);

  const updateMessage = useCallback((msg: string) => {
    setMessage(msg);
  }, []);

  const contextValue: SectionLoaderContextType = {
    isLoading,
    showLoader,
    hideLoader,
    setMessage: updateMessage,
    message,
  };

  // Expose context globally so auth context can access it
  useEffect(() => {
    (window as any).__sectionLoaderContext = contextValue;
  }, []); // Removed contextValue from the dependency array

  return (
    <SectionLoaderContext.Provider value={contextValue}>
      {children}
    </SectionLoaderContext.Provider>
  );
}

export function useSectionLoader() {
  const context = useContext(SectionLoaderContext);
  if (context === undefined) {
    throw new Error("useSectionLoader must be used within SectionLoaderProvider");
  }
  return context;
}
