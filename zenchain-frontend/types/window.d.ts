/**
 * Global window type extensions for wallet providers
 */

import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider & {
      on?: (event: string, callback: (...args: any[]) => void) => void;
      removeListener?: (event: string, callback: (...args: any[]) => void) => void;
      request?: (args: { method: string; params?: Array<any> | Record<string, any> }) => Promise<any>;
    };
  }
}

export {};





