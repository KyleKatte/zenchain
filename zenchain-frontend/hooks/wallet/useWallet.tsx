"use client";

/**
 * Simple Wallet Hook
 * Handles MetaMask connection and account management
 */

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { STORAGE_KEYS } from "@/fhevm/constants";

export interface UseWalletReturn {
  // State
  isConnected: boolean;
  isInitialized: boolean; // Has completed initial connection check
  account: string | undefined;
  chainId: number | undefined;
  provider: ethers.Eip1193Provider | undefined;
  signer: ethers.JsonRpcSigner | undefined;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  
  // Status
  isConnecting: boolean;
  error: string | undefined;
}

export function useWallet(): UseWalletReturn {
  const [provider, setProvider] = useState<ethers.Eip1193Provider | undefined>();
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | undefined>();
  const [account, setAccount] = useState<string | undefined>();
  const [chainId, setChainId] = useState<number | undefined>();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isInitialized, setIsInitialized] = useState(false); // Track if we've checked for existing connection

  const isConnected = Boolean(provider && account && chainId);

  /**
   * Connect to MetaMask
   */
  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(undefined);

    try {
      // Check if MetaMask is installed
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("Please install MetaMask to use this dApp");
      }

      const ethProvider = window.ethereum as ethers.Eip1193Provider;

      // Request accounts
      const accounts = await ethProvider.request({
        method: "eth_requestAccounts",
      }) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      // Get chainId
      const chainIdHex = await ethProvider.request({
        method: "eth_chainId",
      }) as string;
      const chainIdNum = parseInt(chainIdHex, 16);

      // Create ethers provider and signer
      const ethersProvider = new ethers.BrowserProvider(ethProvider);
      const ethersSigner = await ethersProvider.getSigner();

      // Update state
      setProvider(ethProvider);
      setSigner(ethersSigner);
      setAccount(accounts[0].toLowerCase());
      setChainId(chainIdNum);

      // Store connection state
      localStorage.setItem(STORAGE_KEYS.WALLET_CONNECTED, "true");
      localStorage.setItem(STORAGE_KEYS.WALLET_LAST_ACCOUNTS, JSON.stringify(accounts));
      localStorage.setItem(STORAGE_KEYS.WALLET_LAST_CHAIN_ID, chainIdNum.toString());

      console.log("[Wallet] Connected:", accounts[0], "Chain:", chainIdNum);
    } catch (err) {
      console.error("[Wallet] Connection failed:", err);
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  /**
   * Disconnect wallet
   */
  const disconnect = useCallback(() => {
    setProvider(undefined);
    setSigner(undefined);
    setAccount(undefined);
    setChainId(undefined);

    // Clear storage
    localStorage.removeItem(STORAGE_KEYS.WALLET_CONNECTED);
    localStorage.removeItem(STORAGE_KEYS.WALLET_LAST_ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.WALLET_LAST_CHAIN_ID);

    console.log("[Wallet] Disconnected");
  }, []);

  /**
   * Auto-reconnect on mount if previously connected
   */
  useEffect(() => {
    const attemptReconnect = async () => {
      const wasConnected = localStorage.getItem(STORAGE_KEYS.WALLET_CONNECTED);
      
      if (wasConnected === "true" && window.ethereum && !isConnected) {
        // Try silent reconnect
        const ethProvider = window.ethereum as ethers.Eip1193Provider;
        
        try {
          const accounts = await ethProvider.request({ method: "eth_accounts" }) as string[];
          
          if (accounts && accounts.length > 0) {
            console.log("[Wallet] Auto-reconnecting...");
            
            // Manually set state without calling connect() to avoid loop
            const ethersProvider = new ethers.BrowserProvider(ethProvider);
            const ethersSigner = await ethersProvider.getSigner();
            const chainIdHex = await ethProvider.request({ method: "eth_chainId" }) as string;
            const chainIdNum = parseInt(chainIdHex, 16);
            
            setProvider(ethProvider);
            setSigner(ethersSigner);
            setAccount(accounts[0].toLowerCase());
            setChainId(chainIdNum);
            
            console.log("[Wallet] Auto-reconnected successfully");
          } else {
            console.log("[Wallet] No accounts found, skipping auto-reconnect");
          }
        } catch (err) {
          console.warn("[Wallet] Auto-reconnect failed:", err);
        }
      } else {
        console.log("[Wallet] No previous connection or already connected");
      }
      
      // Mark as initialized regardless of reconnect success
      setIsInitialized(true);
    };

    attemptReconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount

  /**
   * Listen to account changes
   */
  useEffect(() => {
    if (!provider) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accountList = accounts as string[];
      if (accountList.length === 0) {
        disconnect();
      } else {
        setAccount(accountList[0].toLowerCase());
        localStorage.setItem(STORAGE_KEYS.WALLET_LAST_ACCOUNTS, JSON.stringify(accountList));
      }
    };

    const handleChainChanged = (chainIdHex: unknown) => {
      const newChainId = parseInt(chainIdHex as string, 16);
      console.log("[Wallet] Chain changed to:", newChainId);
      setChainId(newChainId);
      localStorage.setItem(STORAGE_KEYS.WALLET_LAST_CHAIN_ID, newChainId.toString());
      // Note: Not reloading page to avoid connection loops
      // User can manually refresh if needed
    };

    const handleDisconnect = () => {
      disconnect();
    };

    // Add event listeners (with type assertion for ethers provider)
    const ethProvider = provider as any;
    if (ethProvider.on) {
      ethProvider.on("accountsChanged", handleAccountsChanged);
      ethProvider.on("chainChanged", handleChainChanged);
      ethProvider.on("disconnect", handleDisconnect);
    }

    // Cleanup
    return () => {
      if (ethProvider.removeListener) {
        ethProvider.removeListener("accountsChanged", handleAccountsChanged);
        ethProvider.removeListener("chainChanged", handleChainChanged);
        ethProvider.removeListener("disconnect", handleDisconnect);
      }
    };
  }, [provider, disconnect]);

  return {
    isConnected,
    isInitialized,
    account,
    chainId,
    provider,
    signer,
    connect,
    disconnect,
    isConnecting,
    error,
  };
}

