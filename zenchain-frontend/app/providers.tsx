"use client";

/**
 * Global Providers
 * Wraps the app with necessary context providers
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { createFhevmInstance } from "@/fhevm/fhevm";
import { useWallet } from "@/hooks/wallet/useWallet";

interface FhevmContextValue {
  instance: FhevmInstance | undefined;
  isLoading: boolean;
  error: string | undefined;
}

const FhevmContext = createContext<FhevmContextValue>({
  instance: undefined,
  isLoading: true,
  error: undefined,
});

export function useFhevm() {
  return useContext(FhevmContext);
}

export function Providers({ children }: { children: ReactNode }) {
  const { chainId, provider } = useWallet();
  const [fhevmInstance, setFhevmInstance] = useState<FhevmInstance | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let abortController = new AbortController();

    async function initFhevm() {
      if (!chainId || !provider) {
        console.log("[FhevmProvider] Waiting for wallet connection...");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(undefined);

      try {
        console.log("[FhevmProvider] Initializing FHEVM for chain:", chainId);

        const instance = await createFhevmInstance({
          provider,
          signal: abortController.signal,
          onStatusChange: (state) => {
            console.log("[FhevmProvider] State:", state);
          },
        });

        if (!abortController.signal.aborted) {
          console.log("[FhevmProvider] FHEVM instance created successfully");
          setFhevmInstance(instance);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!abortController.signal.aborted) {
          console.error("[FhevmProvider] Failed to initialize FHEVM:", err);
          setError(err.message || "Failed to initialize FHEVM");
          setIsLoading(false);
        }
      }
    }

    initFhevm();

    return () => {
      abortController.abort();
    };
  }, [chainId, provider]);

  return (
    <FhevmContext.Provider value={{ instance: fhevmInstance, isLoading, error }}>
      {children}
    </FhevmContext.Provider>
  );
}

