/**
 * FHEVM Type Definitions
 * Defines TypeScript types for FHEVM instance and configuration
 */

import { Eip1193Provider } from "ethers";

/**
 * FHEVM Instance - core interface for encryption/decryption
 */
export interface FhevmInstance {
  /**
   * Create encrypted input for contract call
   */
  createEncryptedInput(
    contractAddress: string,
    userAddress: string
  ): EncryptedInputBuilder;

  /**
   * User-side decryption of encrypted values
   */
  userDecrypt(
    handles: Array<{ handle: string; contractAddress: string }>,
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimestamp: number,
    durationDays: number
  ): Promise<Record<string, bigint | boolean>>;

  /**
   * Generate keypair for decryption
   */
  generateKeypair(): { publicKey: string; privateKey: string };

  /**
   * Create EIP-712 typed data for decryption signature
   */
  createEIP712(
    publicKey: string,
    contractAddresses: string[],
    startTimestamp: number,
    durationDays: number
  ): EIP712Type;

  /**
   * Get public key for encryption
   */
  getPublicKey(): string;

  /**
   * Get public parameters
   */
  getPublicParams(maxBits?: number): string;
}

/**
 * Encrypted Input Builder - for creating encrypted inputs
 */
export interface EncryptedInputBuilder {
  add8(value: number | bigint): this;
  add16(value: number | bigint): this;
  add32(value: number | bigint): this;
  add64(value: number | bigint): this;
  add128(value: number | bigint): this;
  add256(value: number | bigint): this;
  addBool(value: boolean): this;
  addAddress(value: string): this;
  encrypt(): Promise<{
    handles: string[];
    inputProof: string;
  }>;
}

/**
 * FHEVM Instance Configuration
 */
export interface FhevmInstanceConfig {
  network: Eip1193Provider | string;
  aclContractAddress: string;
  kmsVerifierContractAddress: string;
  inputVerifierContractAddress: string;
  fhevmExecutorContractAddress: string;
  publicKey?: string;
  publicParams?: string;
}

/**
 * FHEVM Window Type (for Relayer SDK injection)
 */
export interface FhevmWindowType extends Window {
  relayerSDK: FhevmRelayerSDKType;
}

/**
 * Relayer SDK Type
 */
export interface FhevmRelayerSDKType {
  __initialized__?: boolean;
  initSDK(options?: FhevmInitSDKOptions): Promise<boolean>;
  createInstance(config: FhevmInstanceConfig): Promise<FhevmInstance>;
  SepoliaConfig: {
    aclContractAddress: string;
    kmsVerifierContractAddress: string;
    inputVerifierContractAddress: string;
    fhevmExecutorContractAddress: string;
  };
}

/**
 * Init SDK Options
 */
export interface FhevmInitSDKOptions {
  // Add any init options here
}

/**
 * Decryption signature storage key format
 */
export interface DecryptionSignatureKey {
  chainId: number;
  contractAddress: string;
  userAddress: string;
}

/**
 * EIP-712 typed data structure
 */
export type EIP712Type = {
  domain: {
    chainId: number;
    name: string;
    verifyingContract: `0x${string}`;
    version: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: any;
  primaryType: string;
  types: {
    [key: string]: {
      name: string;
      type: string;
    }[];
  };
};

/**
 * FHEVM Decryption Signature Type
 */
export type FhevmDecryptionSignatureType = {
  publicKey: string;
  privateKey: string;
  signature: string;
  startTimestamp: number; // Unix timestamp in seconds
  durationDays: number;
  userAddress: `0x${string}`;
  contractAddresses: `0x${string}`[];
  eip712: EIP712Type;
};

