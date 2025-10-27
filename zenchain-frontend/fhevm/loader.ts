/**
 * Relayer SDK Loader
 * Dynamically loads the Zama Relayer SDK from CDN
 * Based on frontend/fhevm/internal/RelayerSDKLoader.ts but with our own implementation
 */

import { SDK_CDN_URL } from "./constants";
import type { FhevmWindowType, FhevmRelayerSDKType } from "./fhevmTypes";

/**
 * Check if Relayer SDK is already loaded in window
 */
export function isRelayerSDKLoaded(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return (
    "relayerSDK" in window &&
    typeof (window as any).relayerSDK === "object" &&
    typeof (window as any).relayerSDK.initSDK === "function" &&
    typeof (window as any).relayerSDK.createInstance === "function"
  );
}

/**
 * Check if Relayer SDK is initialized
 */
export function isRelayerSDKInitialized(): boolean {
  if (!isRelayerSDKLoaded()) {
    return false;
  }
  return (window as any).relayerSDK.__initialized__ === true;
}

/**
 * Load Relayer SDK from CDN
 * Injects script tag and waits for load
 */
export async function loadRelayerSDK(): Promise<void> {
  console.log("[RelayerSDK] Loading SDK from CDN...");

  if (typeof window === "undefined") {
    throw new Error("RelayerSDK can only be loaded in browser environment");
  }

  // Already loaded
  if (isRelayerSDKLoaded()) {
    console.log("[RelayerSDK] SDK already loaded");
    return;
  }

  // Check if script tag already exists
  const existingScript = document.querySelector(
    `script[src="${SDK_CDN_URL}"]`
  );
  if (existingScript) {
    // Wait for it to load
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (isRelayerSDKLoaded()) {
          clearInterval(checkInterval);
          console.log("[RelayerSDK] SDK loaded successfully");
          resolve();
        }
      }, 100);

      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!isRelayerSDKLoaded()) {
          reject(new Error("RelayerSDK load timeout"));
        }
      }, 30000);
    });
  }

  // Create and inject script tag
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_CDN_URL;
    script.type = "text/javascript";
    script.async = true;

    script.onload = () => {
      if (!isRelayerSDKLoaded()) {
        reject(
          new Error(
            "RelayerSDK script loaded but window.relayerSDK is not available"
          )
        );
        return;
      }
      console.log("[RelayerSDK] SDK loaded successfully");
      resolve();
    };

    script.onerror = () => {
      reject(
        new Error(`Failed to load RelayerSDK from ${SDK_CDN_URL}`)
      );
    };

    document.head.appendChild(script);
    console.log("[RelayerSDK] Script tag injected");
  });
}

/**
 * Initialize Relayer SDK
 */
export async function initRelayerSDK(): Promise<void> {
  console.log("[RelayerSDK] Initializing SDK...");

  if (!isRelayerSDKLoaded()) {
    throw new Error("RelayerSDK not loaded. Call loadRelayerSDK() first.");
  }

  if (isRelayerSDKInitialized()) {
    console.log("[RelayerSDK] SDK already initialized");
    return;
  }

  const sdk = (window as unknown as FhevmWindowType).relayerSDK;
  const result = await sdk.initSDK();

  if (!result) {
    throw new Error("RelayerSDK initialization failed");
  }

  sdk.__initialized__ = true;
  console.log("[RelayerSDK] SDK initialized successfully");
}

/**
 * Get Relayer SDK instance (must be loaded and initialized first)
 */
export function getRelayerSDK(): FhevmRelayerSDKType {
  if (!isRelayerSDKLoaded()) {
    throw new Error("RelayerSDK not loaded");
  }

  if (!isRelayerSDKInitialized()) {
    throw new Error("RelayerSDK not initialized");
  }

  return (window as unknown as FhevmWindowType).relayerSDK;
}





