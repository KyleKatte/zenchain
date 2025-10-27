"use client";

/**
 * ZenChain Diary Contract Interaction Hook
 * Handles all interactions with ZenChainDiary.sol with FHEVM encryption
 */

import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import type { FhevmInstance } from "@/fhevm/fhevmTypes";
import { ZenChainDiaryABI } from "@/abi/ZenChainDiaryABI";
import { ZenChainDiaryAddresses } from "@/abi/ZenChainDiaryAddresses";

export interface DiaryEntryData {
  moodScore: number; // 1-10
  stressScore: number; // 1-10
  sleepQuality: number; // 1-10
  moodTags: number; // Bitmask
  diaryText: string; // Local storage only
  isPublic: boolean;
}

export interface UseZenChainDiaryReturn {
  // Actions
  submitEntry: (data: DiaryEntryData) => Promise<void>;
  getUserEntries: () => Promise<any[]>;
  
  // State
  isSubmitting: boolean;
  isFetching: boolean;
  message: string;
  contractAddress: string | undefined;
  isDeployed: boolean;
}

interface UseZenChainDiaryOptions {
  fhevmInstance: FhevmInstance | undefined;
  signer: ethers.JsonRpcSigner | undefined;
  account: string | undefined;
  chainId: number | undefined;
}

export function useZenChainDiary({
  fhevmInstance,
  signer,
  account,
  chainId,
}: UseZenChainDiaryOptions): UseZenChainDiaryReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [message, setMessage] = useState("");

  // Get contract address for current chain
  const contractAddress = chainId ? (ZenChainDiaryAddresses as any)[chainId.toString()]?.address : undefined;
  const isDeployed = Boolean(contractAddress && contractAddress !== ethers.ZeroAddress);

  // Get contract instance
  const getContract = useCallback(() => {
    if (!contractAddress || !signer) return undefined;
    return new ethers.Contract(contractAddress, ZenChainDiaryABI.abi, signer);
  }, [contractAddress, signer]);

  /**
   * Submit encrypted diary entry
   */
  const submitEntry = useCallback(async (data: DiaryEntryData) => {
    if (!fhevmInstance || !signer || !account || !contractAddress) {
      setMessage("❌ Wallet not connected or contract not deployed");
      throw new Error("Missing dependencies");
    }

    const contract = getContract();
    if (!contract) {
      setMessage("❌ Contract not available");
      throw new Error("Contract not available");
    }

    setIsSubmitting(true);
    setMessage("🔐 Encrypting your diary entry...");

    try {
      console.log("[useZenChainDiary] Creating encrypted input for:", data);

      // Convert diary text to bytes32 (first 32 bytes as hash/summary)
      const textBytes = new TextEncoder().encode(data.diaryText || '');
      const textHash = new Uint8Array(32);
      textHash.set(textBytes.slice(0, 32)); // Take first 32 bytes
      // Convert bytes to bigint for euint256
      let textHashBigInt = 0n;
      for (let i = 0; i < 32; i++) {
        textHashBigInt = (textHashBigInt << 8n) | BigInt(textHash[i]);
      }

      // Create encrypted input
      const input = fhevmInstance.createEncryptedInput(contractAddress, account);
      input.add8(data.moodScore);
      input.add8(data.stressScore);
      input.add8(data.sleepQuality);
      input.add32(data.moodTags);
      input.add256(textHashBigInt);

      setMessage("🔐 Encrypting data...");
      const encryptedData = await input.encrypt();

      console.log("[useZenChainDiary] Encrypted data:", encryptedData);

      setMessage("📝 Submitting to blockchain...");

      // Call contract
      const tx = await contract.submitEntry(
        encryptedData.handles[0], // mood
        encryptedData.inputProof,
        encryptedData.handles[1], // stress
        encryptedData.inputProof,
        encryptedData.handles[2], // sleep
        encryptedData.inputProof,
        encryptedData.handles[3], // tags
        encryptedData.inputProof,
        encryptedData.handles[4], // text hash
        encryptedData.inputProof,
        data.isPublic
      );

      setMessage(`⏳ Waiting for transaction ${tx.hash.slice(0, 10)}... to be confirmed...`);
      console.log("[useZenChainDiary] Transaction sent:", tx.hash);

      const receipt = await tx.wait();
      console.log("[useZenChainDiary] Transaction confirmed:", receipt);

      // Extract entry ID from logs
      let entryId: string | undefined;
      if (receipt?.logs && receipt.logs.length > 0) {
        try {
          const log = receipt.logs[0];
          const parsedLog = contract.interface.parseLog({
            topics: [...log.topics],
            data: log.data,
          });
          if (parsedLog && parsedLog.args && parsedLog.args.length > 1) {
            entryId = parsedLog.args[1].toString();
          }
        } catch (e) {
          console.warn("[useZenChainDiary] Could not parse entry ID from logs");
        }
      }

      // Store diary text locally (not on-chain)
      if (data.diaryText && entryId) {
        const storageKey = `zenchain.diary.${account}.${entryId}`;
        localStorage.setItem(storageKey, data.diaryText);
        console.log("[useZenChainDiary] Stored local text for entry:", entryId);
      }

      setMessage("✅ Entry submitted successfully!");
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      console.error("[useZenChainDiary] Submit error:", error);
      
      let errorMessage = "❌ Failed to submit entry";
      if (error.message) {
        if (error.message.includes("user rejected")) {
          errorMessage = "❌ Transaction rejected by user";
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "❌ Insufficient funds for gas";
        } else {
          errorMessage = `❌ Error: ${error.message.slice(0, 100)}`;
        }
      }
      
      setMessage(errorMessage);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [fhevmInstance, signer, account, contractAddress, getContract]);

  /**
   * Get user's diary entries (encrypted handles)
   */
  const getUserEntries = useCallback(async (): Promise<any[]> => {
    if (!account || !contractAddress) {
      console.warn("[useZenChainDiary] Cannot fetch entries: wallet not connected");
      return [];
    }

    const contract = getContract();
    if (!contract) {
      console.warn("[useZenChainDiary] Cannot fetch entries: contract not available");
      return [];
    }

    setIsFetching(true);
    setMessage("📚 Fetching your entries...");

    try {
      console.log("[useZenChainDiary] Fetching entries for:", account);

      // Get entry IDs for user
      const entryIds = await contract.getUserEntries(account, 0, 100);
      console.log("[useZenChainDiary] Entry IDs:", entryIds);

      const entries = [];
      for (const id of entryIds) {
        try {
          const entry = await contract.getEntry(id);
          
          // Load local text if available
          const storageKey = `zenchain.diary.${account}.${id.toString()}`;
          const localText = localStorage.getItem(storageKey) || "";

          entries.push({
            id: id.toString(),
            moodScore: entry.moodScore, // This is encrypted handle
            stressScore: entry.stressScore, // This is encrypted handle
            sleepQuality: entry.sleepQuality, // This is encrypted handle
            moodTags: entry.moodTags, // This is encrypted handle
            timestamp: Number(entry.timestamp),
            isPublic: entry.isPublic,
            isDeleted: entry.isDeleted,
            isEncrypted: true, // Mark as needing decryption
            localText,
          });
        } catch (e) {
          console.error(`[useZenChainDiary] Error fetching entry ${id}:`, e);
        }
      }

      console.log("[useZenChainDiary] Fetched entries:", entries);
      setMessage("");
      return entries;
    } catch (error: any) {
      console.error("[useZenChainDiary] Fetch error:", error);
      setMessage(`❌ Error fetching entries: ${error.message || error.toString()}`);
      return [];
    } finally {
      setIsFetching(false);
    }
  }, [account, contractAddress, getContract]);

  return {
    submitEntry,
    getUserEntries,
    isSubmitting,
    isFetching,
    message,
    contractAddress,
    isDeployed,
  };
}
