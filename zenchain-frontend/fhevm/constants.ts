/**
 * FHEVM Constants
 * CDN URLs and network configurations
 */

/**
 * Relayer SDK CDN URL (loads from Zama CDN)
 */
export const SDK_CDN_URL =
  "https://cdn.jsdelivr.net/npm/@zama-fhe/relayer-sdk@latest/dist/index.umd.js";

/**
 * Default mock chains configuration
 * Maps chainId to RPC URL for local development
 */
export const DEFAULT_MOCK_CHAINS: Record<number, string> = {
  31337: "http://localhost:8545", // Hardhat
};

/**
 * Decryption signature duration (in days)
 */
export const DECRYPTION_SIGNATURE_DURATION_DAYS = 7;

/**
 * LocalStorage keys
 */
export const STORAGE_KEYS = {
  DECRYPTION_SIGNATURE: "zenchain.decryption.signature",
  PUBLIC_KEY: "zenchain.fhevm.publicKey",
  WALLET_CONNECTED: "zenchain.wallet.connected",
  WALLET_LAST_CONNECTOR_ID: "zenchain.wallet.lastConnectorId",
  WALLET_LAST_ACCOUNTS: "zenchain.wallet.lastAccounts",
  WALLET_LAST_CHAIN_ID: "zenchain.wallet.lastChainId",
} as const;

/**
 * Network configurations
 */
export const NETWORK_CONFIGS = {
  localhost: {
    chainId: 31337,
    name: "Hardhat",
    rpcUrl: "http://localhost:8545",
    useMock: true,
  },
  sepolia: {
    chainId: 11155111,
    name: "Sepolia",
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
    useMock: false,
  },
} as const;

/**
 * Mood Tags Bitmask (for ZenChain diary entries)
 */
export const MOOD_TAGS = {
  ANXIOUS: 0x01,
  CALM: 0x02,
  HAPPY: 0x04,
  TIRED: 0x08,
  SAD: 0x10,
  EXCITED: 0x20,
  DEPRESSED: 0x40,
  RELAXED: 0x80,
  ANGRY: 0x100,
  GRATEFUL: 0x200,
  LONELY: 0x400,
  FULFILLED: 0x800,
} as const;

/**
 * Mood tag labels (for UI)
 */
export const MOOD_TAG_LABELS = {
  [MOOD_TAGS.ANXIOUS]: "Anxious",
  [MOOD_TAGS.CALM]: "Calm",
  [MOOD_TAGS.HAPPY]: "Happy",
  [MOOD_TAGS.TIRED]: "Tired",
  [MOOD_TAGS.SAD]: "Sad",
  [MOOD_TAGS.EXCITED]: "Excited",
  [MOOD_TAGS.DEPRESSED]: "Depressed",
  [MOOD_TAGS.RELAXED]: "Relaxed",
  [MOOD_TAGS.ANGRY]: "Angry",
  [MOOD_TAGS.GRATEFUL]: "Grateful",
  [MOOD_TAGS.LONELY]: "Lonely",
  [MOOD_TAGS.FULFILLED]: "Fulfilled",
} as const;





