"use client";

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { designTokens as tokens } from '@/design-tokens';

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

interface StatisticsProps {
  entries: DiaryEntry[];
}

export function Statistics({ entries }: StatisticsProps) {
  // Filter only decrypted entries for statistics
  const decryptedEntries = useMemo(
    () => entries.filter((e) => !e.isEncrypted && typeof e.moodScore === 'number'),
    [entries]
  );

  // Prepare data for trends chart
  const trendsData = useMemo(() => {
    return decryptedEntries
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((entry) => ({
        date: new Date(entry.timestamp * 1000).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        mood: entry.moodScore || 0,
        stress: entry.stressScore || 0,
        sleep: entry.sleepQuality || 0,
      }));
  }, [decryptedEntries]);

  // Calculate averages
  const averages = useMemo(() => {
    if (decryptedEntries.length === 0) {
      return { mood: 0, stress: 0, sleep: 0 };
    }
    const sum = decryptedEntries.reduce(
      (acc, entry) => ({
        mood: acc.mood + (entry.moodScore || 0),
        stress: acc.stress + (entry.stressScore || 0),
        sleep: acc.sleep + (entry.sleepQuality || 0),
      }),
      { mood: 0, stress: 0, sleep: 0 }
    );
    const count = decryptedEntries.length;
    return {
      mood: Math.round((sum.mood / count) * 10) / 10,
      stress: Math.round((sum.stress / count) * 10) / 10,
      sleep: Math.round((sum.sleep / count) * 10) / 10,
    };
  }, [decryptedEntries]);

  // Prepare tag distribution data
  const tagDistribution = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    decryptedEntries.forEach((entry) => {
      if (Array.isArray(entry.moodTags)) {
        entry.moodTags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    return Object.entries(tagCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [decryptedEntries]);

  // Colors for charts
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (decryptedEntries.length === 0) {
    return (
      <div className="card-neumorphic p-12 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-2xl font-semibold mb-4">No Decrypted Data</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Statistics are only available for decrypted entries.
        </p>
        <p className="text-sm text-gray-500">
          Go to &quot;My Entries&quot; tab and decrypt some entries to see your statistics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-neumorphic p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Average Mood</p>
              <p className="text-3xl font-bold text-blue-600">{averages.mood}/10</p>
            </div>
            <span className="text-4xl">😊</span>
          </div>
          <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
              style={{ width: `${(averages.mood / 10) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="card-neumorphic p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Average Stress</p>
              <p className="text-3xl font-bold text-orange-600">{averages.stress}/10</p>
            </div>
            <span className="text-4xl">😩</span>
          </div>
          <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-orange-600"
              style={{ width: `${(averages.stress / 10) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="card-neumorphic p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Average Sleep</p>
              <p className="text-3xl font-bold text-purple-600">{averages.sleep}/10</p>
            </div>
            <span className="text-4xl">😴</span>
          </div>
          <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-400 to-purple-600"
              style={{ width: `${(averages.sleep / 10) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Trends Chart */}
      {trendsData.length > 0 && (
        <div className="card-neumorphic p-6">
          <h3 className="text-xl font-semibold mb-4">Trends Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis domain={[0, 10]} stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Mood"
                dot={{ fill: '#3B82F6', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="stress"
                stroke="#F59E0B"
                strokeWidth={2}
                name="Stress"
                dot={{ fill: '#F59E0B', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="sleep"
                stroke="#8B5CF6"
                strokeWidth={2}
                name="Sleep"
                dot={{ fill: '#8B5CF6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Average Scores Bar Chart */}
        <div className="card-neumorphic p-6">
          <h3 className="text-xl font-semibold mb-4">Average Scores</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={[
                { name: 'Mood', value: averages.mood, fill: '#3B82F6' },
                { name: 'Stress', value: averages.stress, fill: '#F59E0B' },
                { name: 'Sleep', value: averages.sleep, fill: '#8B5CF6' },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis domain={[0, 10]} stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {[0, 1, 2].map((index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tag Distribution Pie Chart */}
        {tagDistribution.length > 0 && (
          <div className="card-neumorphic p-6">
            <h3 className="text-xl font-semibold mb-4">Mood Tags Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={tagDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tagDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="card-neumorphic p-6">
        <h3 className="text-xl font-semibold mb-4">📝 Insights</h3>
        <div className="space-y-3 text-sm">
          {averages.mood >= 7 && (
            <div className="flex items-start space-x-2">
              <span className="text-green-500 text-lg">✓</span>
              <p>Your average mood is good! Keep up the positive mindset.</p>
            </div>
          )}
          {averages.mood < 5 && (
            <div className="flex items-start space-x-2">
              <span className="text-yellow-500 text-lg">⚠</span>
              <p>
                Your mood seems low recently. Consider reaching out to a mental
                health professional.
              </p>
            </div>
          )}
          {averages.stress >= 7 && (
            <div className="flex items-start space-x-2">
              <span className="text-red-500 text-lg">!</span>
              <p>
                High stress levels detected. Try relaxation techniques or
                physical exercise.
              </p>
            </div>
          )}
          {averages.sleep < 6 && (
            <div className="flex items-start space-x-2">
              <span className="text-blue-500 text-lg">💤</span>
              <p>
                Your sleep quality could be improved. Aim for 7-9 hours of
                quality sleep.
              </p>
            </div>
          )}
          {decryptedEntries.length >= 7 && (
            <div className="flex items-start space-x-2">
              <span className="text-purple-500 text-lg">🎉</span>
              <p>
                Great job maintaining your diary for {decryptedEntries.length}{' '}
                entries! Consistency is key.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

