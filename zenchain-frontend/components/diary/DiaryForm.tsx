"use client";

/**
 * Diary Entry Form
 * Submit encrypted mood, stress, sleep data with optional local notes
 */

import React, { useState } from 'react';
import { cn } from '@/utils/cn';

interface DiaryFormProps {
  onSubmit: (data: {
    moodScore: number;
    stressScore: number;
    sleepQuality: number;
    moodTags: number;
    diaryText: string;
    isPublic: boolean;
  }) => Promise<void>;
  isSubmitting: boolean;
}

const moodEmojis = ['😞', '🙁', '😐', '🙂', '😊', '😄', '😁', '🤩', '🥳', '✨'];
const stressEmojis = ['😌', '🧘', '🚶', '🤔', '😬', '😟', '😩', '🤯', '🔥', '💥'];
const sleepEmojis = ['😴', '💤', '🛌', '🌙', '🌟', '✨', '☀️', '⚡', '🚀', '🌌'];

const MOOD_TAGS = [
  { label: 'Anxious', value: 0x01 },
  { label: 'Calm', value: 0x02 },
  { label: 'Happy', value: 0x04 },
  { label: 'Tired', value: 0x08 },
  { label: 'Sad', value: 0x10 },
  { label: 'Excited', value: 0x20 },
  { label: 'Depressed', value: 0x40 },
  { label: 'Relaxed', value: 0x80 },
  { label: 'Angry', value: 0x100 },
  { label: 'Grateful', value: 0x200 },
  { label: 'Lonely', value: 0x400 },
  { label: 'Fulfilled', value: 0x800 },
];

export function DiaryForm({ onSubmit, isSubmitting }: DiaryFormProps) {
  const [moodScore, setMoodScore] = useState(5);
  const [stressScore, setStressScore] = useState(5);
  const [sleepQuality, setSleepQuality] = useState(5);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [diaryText, setDiaryText] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const handleTagToggle = (tagValue: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagValue) ? prev.filter((t) => t !== tagValue) : [...prev, tagValue]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate bitmask from selected tags
    const moodTagsBitmask = selectedTags.reduce((acc, tag) => acc | tag, 0);

    await onSubmit({
      moodScore,
      stressScore,
      sleepQuality,
      moodTags: moodTagsBitmask,
      diaryText,
      isPublic,
    });

    // Reset form
    setMoodScore(5);
    setStressScore(5);
    setSleepQuality(5);
    setSelectedTags([]);
    setDiaryText('');
    setIsPublic(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mood Score */}
      <div className="card-neumorphic p-6">
        <label className="block text-sm font-medium mb-4">
          How are you feeling today? <span className="text-2xl ml-2">{moodEmojis[moodScore - 1]}</span>
        </label>
        <div className="flex items-center space-x-4">
          <span className="text-xs text-gray-500">1</span>
          <input
            type="range"
            min="1"
            max="10"
            value={moodScore}
            onChange={(e) => setMoodScore(parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-gray-500">10</span>
          <span className="text-lg font-semibold w-8 text-center">{moodScore}</span>
        </div>
      </div>

      {/* Stress Score */}
      <div className="card-neumorphic p-6">
        <label className="block text-sm font-medium mb-4">
          Stress level: <span className="text-2xl ml-2">{stressEmojis[stressScore - 1]}</span>
        </label>
        <div className="flex items-center space-x-4">
          <span className="text-xs text-gray-500">1</span>
          <input
            type="range"
            min="1"
            max="10"
            value={stressScore}
            onChange={(e) => setStressScore(parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-gray-500">10</span>
          <span className="text-lg font-semibold w-8 text-center">{stressScore}</span>
        </div>
      </div>

      {/* Sleep Quality */}
      <div className="card-neumorphic p-6">
        <label className="block text-sm font-medium mb-4">
          Sleep quality: <span className="text-2xl ml-2">{sleepEmojis[sleepQuality - 1]}</span>
        </label>
        <div className="flex items-center space-x-4">
          <span className="text-xs text-gray-500">1</span>
          <input
            type="range"
            min="1"
            max="10"
            value={sleepQuality}
            onChange={(e) => setSleepQuality(parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-gray-500">10</span>
          <span className="text-lg font-semibold w-8 text-center">{sleepQuality}</span>
        </div>
      </div>

      {/* Mood Tags */}
      <div className="card-neumorphic p-6">
        <label className="block text-sm font-medium mb-4">
          Mood tags: (Select all that apply)
        </label>
        <div className="flex flex-wrap gap-2">
          {MOOD_TAGS.map((tag) => (
            <button
              key={tag.value}
              type="button"
              onClick={() => handleTagToggle(tag.value)}
              className={cn(
                'px-4 py-2 rounded-full text-sm transition-all',
                selectedTags.includes(tag.value)
                  ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:shadow-md'
              )}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Diary Text (Local Storage Only) */}
      <div className="card-neumorphic p-6">
        <label htmlFor="diaryText" className="block text-sm font-medium mb-2">
          Notes (encrypted and stored on-chain):
        </label>
        <textarea
          id="diaryText"
          rows={5}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Today was a good day..."
          value={diaryText}
          onChange={(e) => setDiaryText(e.target.value)}
          maxLength={5000}
        />
        <p className="text-xs text-gray-500 mt-2">
          {diaryText.length} / 5000 characters
        </p>
      </div>

      {/* Privacy Toggle */}
      <div className="card-neumorphic p-6">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isPublic" className="text-sm font-medium">
            Share anonymously with community (encrypted data only)
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          'w-full btn-neumorphic py-4 text-lg font-semibold',
          isSubmitting && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isSubmitting ? '🔄 Submitting...' : '🔒 Submit Encrypted Entry'}
      </button>
    </form>
  );
}
