"use client";

/**
 * ZenChain Dashboard
 * Main interface after wallet connection
 */

import { useWallet } from '@/hooks/wallet/useWallet';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { DiaryForm } from '@/components/diary/DiaryForm';
import { DiaryList } from '@/components/diary/DiaryList';
import { Statistics } from '@/components/diary/Statistics';
import { useFhevm } from '@/app/providers';
import { useZenChainDiary } from '@/hooks/useZenChainDiary';

interface DiaryEntry {
  id: string;
  timestamp: number;
  moodScore?: number;
  stressScore?: number;
  sleepQuality?: number;
  moodTags?: string[];
  diaryText?: string;
  isPublic: boolean;
  isEncrypted: boolean;
}

export default function DashboardPage() {
  const { isConnected, isInitialized, account, chainId, disconnect, signer } = useWallet();
  const router = useRouter();
  const { instance: fhevmInstance, isLoading: fhevmLoading } = useFhevm();
  const zenChainDiary = useZenChainDiary({
    fhevmInstance,
    signer,
    account,
    chainId,
  });
  
  const [activeTab, setActiveTab] = useState<'new' | 'entries' | 'stats'>('new');
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [decryptingId, setDecryptingId] = useState<string | null>(null);
  
  // Use message from hook
  const message = zenChainDiary.message;
  const isSubmitting = zenChainDiary.isSubmitting;

  // Wait for wallet to initialize, then check connection
  useEffect(() => {
    if (isInitialized && !isConnected) {
      console.log("[Dashboard] Not connected after initialization, redirecting to home");
      router.push('/');
    }
  }, [isInitialized, isConnected, router]);

  // Load user entries on mount and when refresh is triggered
  useEffect(() => {
    if (isConnected && zenChainDiary.isDeployed) {
      const loadEntries = async () => {
        try {
          console.log('[Dashboard] Loading entries...');
          const fetchedEntries = await zenChainDiary.getUserEntries();
          setEntries(fetchedEntries);
          console.log('[Dashboard] Loaded', fetchedEntries.length, 'entries');
        } catch (error) {
          console.error('[Dashboard] Failed to load entries:', error);
        }
      };
      
      loadEntries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, isConnected, zenChainDiary.isDeployed]); // Reload when refresh is triggered or connection/deployment changes

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Checking connection...</p>
        </div>
      </div>
    );
  }

  // Show loading if somehow not connected (shouldn't happen due to redirect)
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Redirecting...</p>
      </div>
    );
  }

  const handleSubmitEntry = async (data: {
    moodScore: number;
    stressScore: number;
    sleepQuality: number;
    moodTags: number;
    diaryText: string;
    isPublic: boolean;
  }) => {
    try {
      // Use real FHEVM contract submission
      await zenChainDiary.submitEntry(data);
      
      // Trigger refresh of entries
      setRefreshTrigger(prev => prev + 1);
      
      // Switch to entries tab
      setActiveTab('entries');
    } catch (error: any) {
      console.error('[Dashboard] Submit error:', error);
      // Error message is handled by useZenChainDiary
    }
  };

  const handleDecryptEntry = async (entryId: string) => {
    if (!fhevmInstance || !signer || !account || !zenChainDiary.contractAddress) {
      console.error('[Dashboard] Missing dependencies for decryption');
      return;
    }

    setDecryptingId(entryId);
    console.log('[Dashboard] Decrypting entry:', entryId);
    
    try {
      // Find the entry
      const entry = entries.find(e => e.id === entryId);
      if (!entry || !entry.isEncrypted) {
        console.warn('[Dashboard] Entry not found or already decrypted');
        return;
      }

      // Import decryption utilities
      const { loadOrGenerateDecryptionSignature } = await import('@/fhevm/decryption');
      
      // Get or generate decryption signature
      const signature = await loadOrGenerateDecryptionSignature(
        fhevmInstance,
        [zenChainDiary.contractAddress],
        signer,
        chainId!
      );

      if (!signature) {
        console.error('[Dashboard] Failed to get decryption signature');
        return;
      }

      // Decrypt each field
      console.log('[Dashboard] Decrypting fields...');
      
      // Import contract utilities
      const { ethers } = await import('ethers');
      const { ZenChainDiaryABI } = await import('@/abi/ZenChainDiaryABI');
      
      // Create contract instance
      const contract = new ethers.Contract(
        zenChainDiary.contractAddress,
        ZenChainDiaryABI.abi,
        signer
      );
      
      // Get encrypted handles using individual getter methods (workaround for Mock env limitation)
      console.log('[Dashboard] Fetching encrypted handles from contract...');
      const moodHandle = await contract.getEntryMoodScore(entry.id);
      const stressHandle = await contract.getEntryStressScore(entry.id);
      const sleepHandle = await contract.getEntrySleepQuality(entry.id);
      const tagsHandle = await contract.getEntryMoodTags(entry.id);
      const textHandle = await contract.getEntryTextHash(entry.id);
      
      console.log('[Dashboard] Handles:', {
        mood: moodHandle,
        stress: stressHandle,
        sleep: sleepHandle,
        tags: tagsHandle,
        text: textHandle,
      });
      
      // Prepare handles for batch decryption
      const handles = [
        { handle: String(moodHandle), contractAddress: zenChainDiary.contractAddress },
        { handle: String(stressHandle), contractAddress: zenChainDiary.contractAddress },
        { handle: String(sleepHandle), contractAddress: zenChainDiary.contractAddress },
        { handle: String(tagsHandle), contractAddress: zenChainDiary.contractAddress },
        { handle: String(textHandle), contractAddress: zenChainDiary.contractAddress },
      ];

      console.log('[Dashboard] Calling userDecrypt...');
      const decryptedValues = await fhevmInstance.userDecrypt(
        handles,
        signature.privateKey,
        signature.publicKey,
        signature.signature,
        signature.contractAddresses,
        signature.userAddress,
        signature.startTimestamp,
        signature.durationDays
      );

      // Extract decrypted values
      console.log('[Dashboard] Decrypted values:', decryptedValues);
      const decryptedMood = Number(decryptedValues[String(moodHandle)]);
      const decryptedStress = Number(decryptedValues[String(stressHandle)]);
      const decryptedSleep = Number(decryptedValues[String(sleepHandle)]);
      const decryptedTagsBitmask = Number(decryptedValues[String(tagsHandle)]);
      const decryptedTextBigInt = BigInt(decryptedValues[String(textHandle)]);
      
      // Convert bigint back to string
      const textBytes = new Uint8Array(32);
      for (let i = 31; i >= 0; i--) {
        textBytes[i] = Number((decryptedTextBigInt >> BigInt(8 * (31 - i))) & 0xFFn);
      }
      const decryptedText = new TextDecoder().decode(textBytes).replace(/\0/g, ''); // Remove null bytes

      // Decode tags from bitmask
      const MOOD_TAGS = [
        'Anxious', 'Calm', 'Happy', 'Tired', 'Sad', 'Excited', 
        'Depressed', 'Relaxed', 'Angry', 'Grateful', 'Lonely', 'Fulfilled'
      ];
      const decryptedTags = MOOD_TAGS.filter((_, index) => (decryptedTagsBitmask >> index) & 1);

      // Update entry in state
      setEntries(prev => prev.map(e => 
        e.id === entryId 
          ? {
              ...e,
              moodScore: decryptedMood,
              stressScore: decryptedStress,
              sleepQuality: decryptedSleep,
              moodTags: decryptedTags,
              diaryText: decryptedText,
              isEncrypted: false,
            }
          : e
      ));

      console.log('[Dashboard] Decryption successful!');
    } catch (error: any) {
      console.error('[Dashboard] Decryption failed:', error);
      alert(`Decryption failed: ${error.message || error.toString()}`);
    } finally {
      setDecryptingId(null);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-4xl font-bold mb-2">🧘 ZenChain Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your mental health journal, encrypted on-chain
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">
              {account?.slice(0, 6)}...{account?.slice(-4)}
            </p>
            <p className="text-xs text-gray-400 mb-2">Chain: {chainId}</p>
            <button
              onClick={disconnect}
              className="text-sm text-red-500 hover:text-red-700 underline"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* FHEVM Loading Banner */}
        {fhevmLoading && (
          <div className="card-neumorphic p-4 mb-6 bg-blue-50 border-blue-200">
            <p className="text-sm font-medium">🔐 Initializing FHEVM encryption...</p>
          </div>
        )}

        {/* Contract Not Deployed Warning */}
        {!fhevmLoading && !zenChainDiary.isDeployed && (
          <div className="card-neumorphic p-4 mb-6 bg-yellow-50 border-yellow-200">
            <p className="text-sm font-medium">
              ⚠️ Contract not deployed on this network (Chain {chainId}). 
              Please deploy ZenChainDiary or switch to localhost.
            </p>
          </div>
        )}

        {/* Message Banner */}
        {message && (
          <div className={`card-neumorphic p-4 mb-6 ${
            message.startsWith('✅') ? 'bg-green-50 border-green-200' : 
            message.startsWith('❌') ? 'bg-red-50 border-red-200' : 
            'bg-blue-50 border-blue-200'
          }`}>
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card-neumorphic p-6 text-center">
            <div className="text-4xl font-bold text-blue-600">{entries.length}</div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Total Entries</p>
          </div>
          <div className="card-neumorphic p-6 text-center">
            <div className="text-4xl font-bold text-green-600">
              {(() => {
                const decryptedEntries = entries.filter(e => !e.isEncrypted && typeof e.moodScore === 'number');
                if (decryptedEntries.length === 0) return '--';
                const avg = decryptedEntries.reduce((sum, e) => sum + (e.moodScore || 0), 0) / decryptedEntries.length;
                return Math.round(avg * 10) / 10;
              })()}
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Avg Mood</p>
          </div>
          <div className="card-neumorphic p-6 text-center">
            <div className="text-4xl font-bold text-purple-600">
              {(() => {
                if (entries.length === 0) return '--';
                const oldestEntry = entries[entries.length - 1];
                if (!oldestEntry || !oldestEntry.timestamp) return '--';
                const days = Math.ceil((Date.now() - oldestEntry.timestamp * 1000) / (1000 * 60 * 60 * 24));
                return days;
              })()}
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Days Tracked</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'new'
                ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:shadow-md'
            }`}
          >
            📝 New Entry
          </button>
          <button
            onClick={() => setActiveTab('entries')}
            className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'entries'
                ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:shadow-md'
            }`}
          >
            📚 My Entries ({entries.length})
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'stats'
                ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:shadow-md'
            }`}
          >
            📊 Statistics
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'new' && (
            <div className="card-neumorphic p-6">
              <h2 className="text-2xl font-semibold mb-6">Create New Entry</h2>
              <DiaryForm onSubmit={handleSubmitEntry} isSubmitting={isSubmitting} />
            </div>
          )}

          {activeTab === 'entries' && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">My Diary Entries</h2>
              <DiaryList 
                entries={entries} 
                onDecrypt={handleDecryptEntry}
                isDecrypting={!!decryptingId}
                decryptingId={decryptingId}
              />
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Statistics & Insights</h2>
              <Statistics entries={entries} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
