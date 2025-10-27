/**
 * FHEVM Decryption Signature Management
 * Handles user signatures for decryption authorization
 * Based on frontend/fhevm/FhevmDecryptionSignature.ts but with our own implementation
 */

import { ethers } from "ethers";
import { STORAGE_KEYS, DECRYPTION_SIGNATURE_DURATION_DAYS } from "./constants";
import type { FhevmInstance } from "./fhevmTypes";

/**
 * Decryption Signature Data
 */
export interface DecryptionSignatureData {
  privateKey: string;
  publicKey: string;
  signature: string;
  contractAddresses: string[];
  userAddress: string;
  startTimestamp: number;
  durationDays: number;
  chainId: number;
}

/**
 * Generate storage key for decryption signature
 */
function getStorageKey(
  chainId: number,
  userAddress: string,
  contractAddress: string
): string {
  return `${STORAGE_KEYS.DECRYPTION_SIGNATURE}.${chainId}.${userAddress.toLowerCase()}.${contractAddress.toLowerCase()}`;
}

/**
 * Load decryption signature from localStorage
 */
function loadSignature(
  chainId: number,
  userAddress: string,
  contractAddress: string
): DecryptionSignatureData | null {
  try {
    const key = getStorageKey(chainId, userAddress, contractAddress);
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return null;
    }

    const data: DecryptionSignatureData = JSON.parse(stored);

    // Check if signature is expired
    const expiryTimestamp = data.startTimestamp + data.durationDays * 24 * 60 * 60;
    const now = Math.floor(Date.now() / 1000);

    if (now >= expiryTimestamp) {
      console.log("[Decryption] Signature expired, removing");
      localStorage.removeItem(key);
      return null;
    }

    // Verify data integrity
    if (
      !data.privateKey ||
      !data.publicKey ||
      !data.signature ||
      !Array.isArray(data.contractAddresses) ||
      !data.contractAddresses.includes(contractAddress.toLowerCase())
    ) {
      console.warn("[Decryption] Invalid signature data, removing");
      localStorage.removeItem(key);
      return null;
    }

    console.log("[Decryption] Loaded existing signature");
    return data;
  } catch (e) {
    console.error("[Decryption] Failed to load signature:", e);
    return null;
  }
}

/**
 * Store decryption signature in localStorage
 */
function storeSignature(
  chainId: number,
  userAddress: string,
  contractAddress: string,
  data: DecryptionSignatureData
): void {
  try {
    const key = getStorageKey(chainId, userAddress, contractAddress);
    localStorage.setItem(key, JSON.stringify(data));
    console.log("[Decryption] Signature stored successfully");
  } catch (e) {
    console.error("[Decryption] Failed to store signature:", e);
  }
}

/**
 * Generate new decryption signature
 */
async function generateSignature(
  fhevmInstance: FhevmInstance,
  contractAddresses: string[],
  signer: ethers.JsonRpcSigner,
  chainId: number
): Promise<DecryptionSignatureData> {
  console.log("[Decryption] Generating new signature...");

  // Generate keypair for decryption
  if (!fhevmInstance.generateKeypair) {
    throw new Error("FHEVM instance does not support generateKeypair");
  }

  const keypair = fhevmInstance.generateKeypair();
  // Ensure keys have 0x prefix
  const privateKey = keypair.privateKey.startsWith('0x') ? keypair.privateKey : `0x${keypair.privateKey}`;
  const publicKey = keypair.publicKey.startsWith('0x') ? keypair.publicKey : `0x${keypair.publicKey}`;

  const userAddress = await signer.getAddress();
  const startTimestamp = Math.floor(Date.now() / 1000);
  const durationDays = DECRYPTION_SIGNATURE_DURATION_DAYS;

  console.log("[Decryption] Public key:", publicKey.slice(0, 20) + "...");

  // Create EIP-712 message using FHEVM instance
  if (!fhevmInstance.createEIP712) {
    throw new Error("FHEVM instance does not support createEIP712");
  }

  console.log("[Decryption] Creating EIP-712 message...");
  const eip712 = fhevmInstance.createEIP712(
    publicKey,
    contractAddresses,
    startTimestamp,
    durationDays
  );

  let signature: string;
  try {
    console.log("[Decryption] Requesting EIP-712 signature from wallet...");
    console.log("[Decryption] EIP-712 types:", Object.keys(eip712.types));
    signature = await signer.signTypedData(
      eip712.domain,
      { Reencrypt: eip712.types.Reencrypt },
      eip712.message
    );
    console.log("[Decryption] Signature received:", signature.slice(0, 20) + "...");
  } catch (e: any) {
    console.error("[Decryption] EIP-712 signature request failed:", e);
    // Try with UserDecryptRequestVerification as fallback
    try {
      console.log("[Decryption] Retrying with UserDecryptRequestVerification type...");
      signature = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification || eip712.types.Reencrypt },
        eip712.message
      );
      console.log("[Decryption] Signature received:", signature.slice(0, 20) + "...");
    } catch (e2: any) {
      console.error("[Decryption] Second attempt failed:", e2);
      throw new Error(`Failed to sign EIP-712 decryption authorization: ${e2.message || e2.toString()}`);
    }
  }

  return {
    privateKey,
    publicKey,
    signature,
    contractAddresses: contractAddresses.map((addr) => addr.toLowerCase()),
    userAddress: userAddress.toLowerCase(),
    startTimestamp,
    durationDays,
    chainId,
  };
}

/**
 * Load or generate decryption signature
 * @param fhevmInstance FHEVM instance
 * @param contractAddresses Array of contract addresses to authorize
 * @param signer Ethers signer
 * @param chainId Chain ID
 * @returns Decryption signature data
 */
export async function loadOrGenerateDecryptionSignature(
  fhevmInstance: FhevmInstance,
  contractAddresses: string[],
  signer: ethers.JsonRpcSigner,
  chainId: number
): Promise<DecryptionSignatureData> {
  const userAddress = await signer.getAddress();
  const primaryContract = contractAddresses[0];

  // Try to load existing signature
  const existing = loadSignature(chainId, userAddress, primaryContract);

  if (existing) {
    // Check if all requested contracts are authorized
    const allAuthorized = contractAddresses.every((addr) =>
      existing.contractAddresses.includes(addr.toLowerCase())
    );

    if (allAuthorized) {
      console.log("[Decryption] Using existing signature");
      return existing;
    }

    console.log("[Decryption] Existing signature doesn't cover all contracts, generating new");
  }

  // Generate new signature
  const newSignature = await generateSignature(
    fhevmInstance,
    contractAddresses,
    signer,
    chainId
  );

  // Store for future use
  storeSignature(chainId, userAddress, primaryContract, newSignature);

  return newSignature;
}

/**
 * Clear decryption signature (on disconnect or explicit clear)
 */
export function clearDecryptionSignature(
  chainId: number,
  userAddress: string,
  contractAddress: string
): void {
  try {
    const key = getStorageKey(chainId, userAddress, contractAddress);
    localStorage.removeItem(key);
    console.log("[Decryption] Signature cleared");
  } catch (e) {
    console.error("[Decryption] Failed to clear signature:", e);
  }
}

/**
 * Clear all decryption signatures for a user
 */
export function clearAllDecryptionSignatures(userAddress: string): void {
  try {
    const prefix = `${STORAGE_KEYS.DECRYPTION_SIGNATURE}.`;
    const keys = Object.keys(localStorage).filter(
      (key) => key.startsWith(prefix) && key.includes(userAddress.toLowerCase())
    );
    
    keys.forEach((key) => localStorage.removeItem(key));
    console.log(`[Decryption] Cleared ${keys.length} signatures`);
  } catch (e) {
    console.error("[Decryption] Failed to clear signatures:", e);
  }
}

/**
 * Clear all ZenChain data from localStorage
 * Useful when contract is redeployed or for troubleshooting
 */
export function clearAllZenChainData(): void {
  try {
    const keysToRemove: string[] = [];
    
    // Find all keys related to ZenChain
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('fhevm.') ||
        key.startsWith('zenchain.') ||
        key.startsWith('wallet.')
      )) {
        keysToRemove.push(key);
      }
    }
    
    // Remove them
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    console.log(`[Decryption] Cleared ${keysToRemove.length} ZenChain data items`);
    
    return;
  } catch (e) {
    console.error("[Decryption] Failed to clear ZenChain data:", e);
  }
}



