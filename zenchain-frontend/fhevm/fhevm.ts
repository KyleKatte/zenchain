/**
 * FHEVM Instance Creation
 * Handles instance creation with Mock/Relayer SDK switching based on chainId
 * Based on frontend/fhevm/internal/fhevm.ts but with our own implementation
 */

import { Eip1193Provider, JsonRpcProvider } from "ethers";
import { DEFAULT_MOCK_CHAINS, STORAGE_KEYS } from "./constants";
import type { FhevmInstance, FhevmInstanceConfig } from "./fhevmTypes";
import {
  loadRelayerSDK,
  initRelayerSDK,
  getRelayerSDK,
  isRelayerSDKLoaded,
  isRelayerSDKInitialized,
} from "./loader";

/**
 * Status type for FHEVM instance creation
 */
export type FhevmStatusType =
  | "sdk-loading"
  | "sdk-loaded"
  | "sdk-initializing"
  | "sdk-initialized"
  | "creating"
  | "ready";

/**
 * Create FHEVM Instance Options
 */
export interface CreateFhevmInstanceOptions {
  provider: Eip1193Provider | string;
  mockChains?: Record<number, string>;
  onStatusChange?: (status: FhevmStatusType) => void;
  signal?: AbortSignal;
}

/**
 * FHEVM Abort Error
 */
export class FhevmAbortError extends Error {
  constructor(message = "FHEVM operation was cancelled") {
    super(message);
    this.name = "FhevmAbortError";
  }
}

/**
 * Get chainId from provider
 */
async function getChainId(
  providerOrUrl: Eip1193Provider | string
): Promise<number> {
  if (typeof providerOrUrl === "string") {
    const provider = new JsonRpcProvider(providerOrUrl);
    const network = await provider.getNetwork();
    provider.destroy();
    return Number(network.chainId);
  }

  const chainIdHex = await providerOrUrl.request({ method: "eth_chainId" });
  return Number.parseInt(chainIdHex as string, 16);
}

/**
 * Check if node is a Hardhat FHEVM node
 */
async function checkHardhatFhevmNode(rpcUrl: string): Promise<
  | {
      ACLAddress: string;
      InputVerifierAddress: string;
      KMSVerifierAddress: string;
    }
  | undefined
> {
  try {
    const provider = new JsonRpcProvider(rpcUrl);

    // Check client version
    const version = await provider.send("web3_clientVersion", []);
    if (
      typeof version !== "string" ||
      !version.toLowerCase().includes("hardhat")
    ) {
      provider.destroy();
      return undefined;
    }

    // Get FHEVM relayer metadata
    const metadata = await provider.send("fhevm_relayer_metadata", []);
    provider.destroy();

    if (
      !metadata ||
      typeof metadata !== "object" ||
      !("ACLAddress" in metadata) ||
      !("InputVerifierAddress" in metadata) ||
      !("KMSVerifierAddress" in metadata)
    ) {
      return undefined;
    }

    return metadata as {
      ACLAddress: string;
      InputVerifierAddress: string;
      KMSVerifierAddress: string;
    };
  } catch {
    return undefined;
  }
}

/**
 * Store public key in localStorage
 */
function storePublicKey(aclAddress: string, publicKey: string, publicParams: string) {
  try {
    localStorage.setItem(
      `${STORAGE_KEYS.PUBLIC_KEY}.${aclAddress}`,
      JSON.stringify({ publicKey, publicParams, timestamp: Date.now() })
    );
  } catch (e) {
    console.warn("Failed to store public key:", e);
  }
}

/**
 * Retrieve public key from localStorage
 */
function retrievePublicKey(aclAddress: string): { publicKey?: string; publicParams?: string } {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEYS.PUBLIC_KEY}.${aclAddress}`);
    if (stored) {
      const data = JSON.parse(stored);
      // Check if not older than 7 days
      if (Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000) {
        return { publicKey: data.publicKey, publicParams: data.publicParams };
      }
    }
  } catch (e) {
    console.warn("Failed to retrieve public key:", e);
  }
  return {};
}

/**
 * Create FHEVM Instance
 * Automatically switches between Mock (localhost) and Relayer SDK (testnet/mainnet)
 */
export async function createFhevmInstance(
  options: CreateFhevmInstanceOptions
): Promise<FhevmInstance> {
  const {
    provider: providerOrUrl,
    mockChains = DEFAULT_MOCK_CHAINS,
    onStatusChange,
    signal,
  } = options;

  const notify = (status: FhevmStatusType) => {
    if (onStatusChange) {
      onStatusChange(status);
    }
  };

  const throwIfAborted = () => {
    if (signal?.aborted) {
      throw new FhevmAbortError();
    }
  };

  // Step 1: Resolve chainId and determine if Mock or Relayer
  const chainId = await getChainId(providerOrUrl);
  throwIfAborted();

  const rpcUrl =
    typeof providerOrUrl === "string"
      ? providerOrUrl
      : mockChains[chainId] || undefined;

  const isMockChain = chainId in mockChains;

  console.log(`[FHEVM] Creating instance for chainId ${chainId} (${isMockChain ? "Mock" : "Relayer"})`);

  // Step 2: Mock path (for Hardhat local node)
  if (isMockChain && rpcUrl) {
    const metadata = await checkHardhatFhevmNode(rpcUrl);
    throwIfAborted();

    if (metadata) {
      console.log("[FHEVM] Detected Hardhat FHEVM node, using Mock");
      notify("creating");

      // Dynamic import to avoid bundling mock-utils in production
      const { MockFhevmInstance } = await import("@fhevm/mock-utils");
      const { JsonRpcProvider } = await import("ethers");
      
      const provider = new JsonRpcProvider(rpcUrl);
      const mockInstance = await MockFhevmInstance.create(provider, provider, {
        aclContractAddress: metadata.ACLAddress,
        chainId: chainId,
        gatewayChainId: 55815,
        inputVerifierContractAddress: metadata.InputVerifierAddress,
        kmsContractAddress: metadata.KMSVerifierAddress,
        verifyingContractAddressDecryption: "0x5ffdaAB0373E62E2ea2944776209aEf29E631A64",
        verifyingContractAddressInputVerification: "0x812b06e1CDCE800494b79fFE4f925A504a9A9810",
      });

      throwIfAborted();
      notify("ready");

      console.log("[FHEVM] Mock instance created successfully");
      return mockInstance as unknown as FhevmInstance;
    }
  }

  // Step 3: Relayer SDK path (for Sepolia/mainnet)
  throwIfAborted();

  // Load SDK if not already loaded
  if (!isRelayerSDKLoaded()) {
    notify("sdk-loading");
    await loadRelayerSDK();
    throwIfAborted();
    notify("sdk-loaded");
  }

  // Initialize SDK if not already initialized
  if (!isRelayerSDKInitialized()) {
    notify("sdk-initializing");
    await initRelayerSDK();
    throwIfAborted();
    notify("sdk-initialized");
  }

  // Get SDK instance
  const sdk = getRelayerSDK();
  const aclAddress = sdk.SepoliaConfig.aclContractAddress;

  // Try to retrieve cached public key
  const cached = retrievePublicKey(aclAddress);

  // Create instance config
  const config: FhevmInstanceConfig = {
    ...sdk.SepoliaConfig,
    network: providerOrUrl,
    publicKey: cached.publicKey,
    publicParams: cached.publicParams,
  };

  notify("creating");
  console.log("[FHEVM] Creating Relayer SDK instance...");

  const instance = await sdk.createInstance(config);
  throwIfAborted();

  // Store public key for future use
  storePublicKey(
    aclAddress,
    instance.getPublicKey(),
    instance.getPublicParams(2048)
  );

  notify("ready");
  console.log("[FHEVM] Relayer SDK instance created successfully");

  return instance;
}

