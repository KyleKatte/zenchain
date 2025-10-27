"use client";

/**
 * Diary Entry List
 * Display user's diary entries (encrypted on-chain, decrypted for display)
 */

import React from 'react';

interface DiaryEntry {
  id: string;
  timestamp: number;
  moodScore?: number;
  stressScore?: number;
  sleepQuality?: number;
  moodTags?: string[];
  diaryText?: string;
  isPublic: boolean;
  isEncrypted: boolean; // true if not yet decrypted
}

interface DiaryListProps {
  entries: DiaryEntry[];
  onDecrypt?: (entryId: string) => Promise<void>;
  isDecrypting?: boolean;
  decryptingId?: string | null;
}

export function DiaryList({ entries, onDecrypt, isDecrypting, decryptingId }: DiaryListProps) {
  if (entries.length === 0) {
    return (
      <div className="card-neumorphic p-12 text-center">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-xl font-semibold mb-2">No entries yet</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Start your mental health journey by creating your first diary entry
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => {
        const isThisDecrypting = decryptingId === entry.id;
        return (
          <div key={entry.id} className="card-neumorphic p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-500">
                  {new Date(entry.timestamp * 1000).toLocaleString()}
                </p>
                {entry.isPublic && (
                  <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    📊 Shared
                  </span>
                )}
              </div>
              {entry.isEncrypted && onDecrypt && (
                <button
                  onClick={() => onDecrypt(entry.id)}
                  disabled={isDecrypting}
                  className="btn-neumorphic px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isThisDecrypting ? '🔄 Decrypting...' : '🔓 Decrypt'}
                </button>
              )}
            </div>

          {entry.isEncrypted ? (
            <div className="text-gray-400 italic">
              🔒 Entry is encrypted. Click &quot;Decrypt&quot; to view.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Scores */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Mood</p>
                  <p className="text-2xl font-semibold">{entry.moodScore}/10</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Stress</p>
                  <p className="text-2xl font-semibold">{entry.stressScore}/10</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Sleep</p>
                  <p className="text-2xl font-semibold">{entry.sleepQuality}/10</p>
                </div>
              </div>

              {/* Mood Tags */}
              {entry.moodTags && entry.moodTags.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {entry.moodTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Diary Text */}
              {entry.diaryText && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {entry.diaryText}
                  </p>
                </div>
              )}
            </div>
          )}
          </div>
        );
      })}
    </div>
  );
}



