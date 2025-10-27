"use client";

/**
 * ZenChain Home Page
 * Entry point for the application with wallet connection
 */

import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/wallet/useWallet';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const { isConnected, isInitialized, connect, isConnecting, error, account, chainId } = useWallet();
  const [hasNavigated, setHasNavigated] = useState(false);

  const handleConnect = async () => {
    if (isConnected) {
      // Navigate to dashboard if already connected
      setHasNavigated(true);
      router.push('/dashboard');
    } else {
      // Connect wallet
      await connect();
    }
  };

  // Navigate to dashboard once connected (only after initialization is complete)
  useEffect(() => {
    if (isInitialized && isConnected && !hasNavigated) {
      console.log("[Home] Auto-navigating to dashboard");
      setHasNavigated(true);
      router.push('/dashboard');
    }
  }, [isInitialized, isConnected, hasNavigated, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            🧘 ZenChain
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            Your Mental Health, Encrypted
          </p>
          <p className="text-lg text-gray-500">
            Record your emotions privately on-chain with Fully Homomorphic
            Encryption
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="card-neumorphic">
            <div className="text-3xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Privacy-First</h3>
            <p className="text-gray-600 dark:text-gray-400">
              All your mood data is encrypted using FHEVM. Only you can decrypt
              your personal entries.
            </p>
          </div>

          <div className="card-neumorphic">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Anonymous Stats</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Optionally contribute to global mental health trends without
              revealing your identity.
            </p>
          </div>

          <div className="card-neumorphic">
            <div className="text-3xl mb-4">🔑</div>
            <h3 className="text-xl font-semibold mb-2">Self-Sovereign</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your data, your control. No central authority can access your
              diary.
            </p>
          </div>

          <div className="card-neumorphic">
            <div className="text-3xl mb-4">📈</div>
            <h3 className="text-xl font-semibold mb-2">Trend Analysis</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Visualize your emotional journey with charts and insights over
              time.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <button 
            className="btn-neumorphic text-lg px-8 py-4 mb-4"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting 
              ? '🔄 Connecting...' 
              : isConnected 
              ? `✓ Connected: ${account?.slice(0, 6)}...${account?.slice(-4)}` 
              : 'Connect Wallet to Start 🔒'}
          </button>
          
          {error && (
            <p className="text-sm text-red-500 mb-2">
              ⚠️ {error}
            </p>
          )}

          {isConnected && (
            <p className="text-sm text-green-600 dark:text-green-400 mb-2">
              ✓ Connected to chain {chainId}
            </p>
          )}

          <p className="text-sm text-gray-500">
            Supports MetaMask, Coinbase Wallet, and WalletConnect
          </p>
        </div>

        {/* Info Section */}
        <div className="mt-16 card-neumorphic">
          <h3 className="text-xl font-semibold mb-4">🚀 Getting Started</h3>
          <ol className="space-y-2 text-gray-600 dark:text-gray-400">
            <li>1. Connect your wallet (MetaMask recommended)</li>
            <li>2. Submit your first diary entry with mood/stress/sleep scores</li>
            <li>3. View your personal dashboard with encrypted statistics</li>
            <li>4. Optionally share anonymous data for community insights</li>
          </ol>
        </div>

        {/* Tech Stack */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Powered by{" "}
            <span className="font-semibold text-primary">Zama FHEVM</span> •
            Built with{" "}
            <span className="font-semibold">Next.js & Ethers.js</span>
          </p>
        </div>
      </div>
    </div>
  );
}
