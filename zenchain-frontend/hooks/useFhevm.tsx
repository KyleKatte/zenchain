"use client";

/**
 * FHEVM Instance Hook
 * Manages FHEVM instance creation and lifecycle
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Eip1193Provider } from "ethers";
import {
  createFhevmInstance,
  FhevmStatusType,
  FhevmAbortError,
} from "@/fhevm/fhevm";
import type { FhevmInstance } from "@/fhevm/fhevmTypes";

export interface UseFhevmOptions {
  provider: Eip1193Provider | undefined;
  chainId: number | undefined;
  autoCreate?: boolean;
}

export interface UseFhevmReturn {
  instance: FhevmInstance | undefined;
  status: FhevmStatusType | "idle" | "error";
  error: Error | undefined;
  isCreating: boolean;
  isReady: boolean;
  createInstance: () => void;
  resetInstance: () => void;
}

export function useFhevm(options: UseFhevmOptions): UseFhevmReturn {
  const { provider, chainId, autoCreate = true } = options;

  const [instance, setInstance] = useState<FhevmInstance | undefined>(
    undefined
  );
  const [status, setStatus] = useState<FhevmStatusType | "idle" | "error">(
    "idle"
  );
  const [error, setError] = useState<Error | undefined>(undefined);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastChainIdRef = useRef<number | undefined>(undefined);

  const isCreating =
    status === "sdk-loading" ||
    status === "sdk-loaded" ||
    status === "sdk-initializing" ||
    status === "sdk-initialized" ||
    status === "creating";

  const isReady = status === "ready" && instance !== undefined;

  /**
   * Create FHEVM instance
   */
  const createInstance = useCallback(() => {
    if (!provider) {
      console.warn("[useFhevm] No provider available");
      return;
    }

    if (!chainId) {
      console.warn("[useFhevm] No chainId available");
      return;
    }

    // Abort any existing creation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    console.log(`[useFhevm] Creating instance for chainId ${chainId}`);
    setStatus("sdk-loading");
    setError(undefined);

    createFhevmInstance({
      provider,
      onStatusChange: (newStatus) => {
        if (!abortController.signal.aborted) {
          setStatus(newStatus);
        }
      },
      signal: abortController.signal,
    })
      .then((newInstance) => {
        if (!abortController.signal.aborted) {
          console.log("[useFhevm] Instance created successfully");
          setInstance(newInstance);
          setStatus("ready");
          setError(undefined);
          lastChainIdRef.current = chainId;
        }
      })
      .catch((err) => {
        if (err instanceof FhevmAbortError) {
          console.log("[useFhevm] Instance creation aborted");
          return;
        }

        if (!abortController.signal.aborted) {
          console.error("[useFhevm] Failed to create instance:", err);
          setError(err);
          setStatus("error");
          setInstance(undefined);
        }
      });
  }, [provider, chainId]);

  /**
   * Reset instance (on disconnect or chain change)
   */
  const resetInstance = useCallback(() => {
    console.log("[useFhevm] Resetting instance");

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setInstance(undefined);
    setStatus("idle");
    setError(undefined);
    lastChainIdRef.current = undefined;
  }, []);

  /**
   * Auto-create instance when provider/chainId changes
   */
  useEffect(() => {
    if (!autoCreate) {
      return;
    }

    if (!provider || !chainId) {
      resetInstance();
      return;
    }

    // If chainId changed, reset and recreate
    if (lastChainIdRef.current !== chainId) {
      console.log(
        `[useFhevm] ChainId changed: ${lastChainIdRef.current} -> ${chainId}`
      );
      resetInstance();
      // Use timeout to ensure reset completes before creating
      const timer = setTimeout(() => {
        createInstance();
      }, 100);
      return () => clearTimeout(timer);
    }

    // If no instance and not creating, create one
    if (!instance && status === "idle") {
      createInstance();
    }
  }, [provider, chainId, instance, status, autoCreate, createInstance, resetInstance]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    instance,
    status,
    error,
    isCreating,
    isReady,
    createInstance,
    resetInstance,
  };
}





