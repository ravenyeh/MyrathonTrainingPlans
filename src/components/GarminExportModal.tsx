'use client';

import { useState } from 'react';
import { Modal, Button, Input } from '@/components/ui';
import { Plan } from '@/types';
import { convertToGarminWorkout, formatGarminDate } from '@/lib/garmin';
import { trackGarminImport } from '@/lib/analytics';

interface GarminExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan;
}

interface ExportResult {
  workoutName: string;
  success: boolean;
  scheduled: boolean;
  error?: string;
}

export default function GarminExportModal({ isOpen, onClose, plan }: GarminExportModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [results, setResults] = useState<ExportResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleExport = async () => {
    if (!email || !password) {
      setError('請輸入 Garmin 帳號和密碼');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);
    setResults([]);

    try {
      // Collect all workouts from the plan
      const workoutsToExport: Array<{
        workout: Record<string, unknown>;
        scheduledDate: string;
      }> = [];

      for (const week of plan.weeks) {
        for (const workout of week.workouts) {
          if (workout.type === 'rest') continue; // Skip rest days

          const garminWorkout = convertToGarminWorkout(workout, plan.trainingParams.paces);
          const workoutDate = typeof workout.date?.toDate === 'function'
            ? workout.date.toDate()
            : new Date(workout.date as unknown as string);

          workoutsToExport.push({
            workout: garminWorkout,
            scheduledDate: formatGarminDate(workoutDate),
          });
        }
      }

      setProgress({ current: 0, total: workoutsToExport.length });

      // Call the import API
      const response = await fetch('/api/garmin/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          workouts: workoutsToExport,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '匯入失敗');
      }

      setResults(data.results || []);
      setProgress({ current: data.summary?.imported || 0, total: workoutsToExport.length });

      if (data.success) {
        setSuccess(true);
        // Track analytics (anonymous)
        trackGarminImport({
          workoutCount: workoutsToExport.length,
          successCount: data.summary?.imported || 0,
          scheduledCount: data.summary?.scheduled || 0,
        });
      } else {
        setError(data.error || '部分訓練匯入失敗');
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || '匯入時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setError('');
    setSuccess(false);
    setResults([]);
    setProgress({ current: 0, total: 0 });
    onClose();
  };

  // Count workouts (excluding rest days)
  const totalWorkouts = plan.weeks.reduce((count, week) => {
    return count + week.workouts.filter(w => w.type !== 'rest').length;
  }, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="匯出到 Garmin Connect"
      size="lg"
    >
      <div className="space-y-4">
        {!success ? (
          <>
            <div className="p-4 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg">
              <p className="text-sm text-sky-800 dark:text-sky-200">
                將會匯出 <strong>{totalWorkouts}</strong> 個訓練到你的 Garmin Connect 帳號，
                並自動排程到對應的日期。
              </p>
            </div>

            {error && (
              <div className="p-4 bg-peach-50 dark:bg-peach-900/20 border border-peach-200 dark:border-peach-800 rounded-lg">
                <p className="text-sm text-peach-600 dark:text-peach-400">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <Input
                label="Garmin 帳號（電子郵件）"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={loading}
              />

              <Input
                label="Garmin 密碼"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <div className="p-3 bg-lemon-50 dark:bg-lemon-900/20 border border-lemon-200 dark:border-lemon-800 rounded-lg">
              <p className="text-xs text-lemon-800 dark:text-lemon-200">
                你的帳號密碼僅用於此次匯入，不會被儲存。
                如果遇到驗證碼問題，請先在瀏覽器登入 connect.garmin.com 後再試。
              </p>
            </div>

            {loading && progress.total > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>匯入進度</span>
                  <span>{progress.current} / {progress.total}</span>
                </div>
                <div className="w-full bg-lavender-100 rounded-full h-2">
                  <div
                    className="bg-rose-400 h-2 rounded-full transition-all"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4 border-t border-rose-100 dark:border-slate-700">
              <Button variant="ghost" onClick={handleClose} disabled={loading}>
                取消
              </Button>
              <Button onClick={handleExport} isLoading={loading}>
                開始匯出
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-mint-100 dark:bg-mint-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-mint-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-white mb-2">
                匯出完成！
              </h3>
              <p className="text-gray-500 dark:text-slate-400">
                成功匯入 {progress.current} 個訓練到 Garmin Connect
              </p>
            </div>

            {results.length > 0 && (
              <div className="max-h-48 overflow-y-auto border border-rose-100 dark:border-slate-700 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-lavender-50 dark:bg-slate-800 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2">訓練</th>
                      <th className="text-center px-3 py-2">狀態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.slice(0, 20).map((result, index) => (
                      <tr key={index} className="border-t border-rose-50 dark:border-slate-700">
                        <td className="px-3 py-2 text-gray-700 dark:text-slate-300">
                          {result.workoutName}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {result.success ? (
                            <span className="text-mint-600">
                              {result.scheduled ? '已排程' : '已匯入'}
                            </span>
                          ) : (
                            <span className="text-peach-600">失敗</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {results.length > 20 && (
                  <p className="text-center text-sm text-gray-400 py-2">
                    還有 {results.length - 20} 個訓練...
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-center pt-4">
              <Button onClick={handleClose}>
                完成
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
