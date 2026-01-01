'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select } from '@/components/ui';
import { UserAbility, UserAvailability } from '@/types';

export default function ProfilePage() {
  const { userData, updateUserData } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [ability, setAbility] = useState<UserAbility>({
    recent5K: userData?.ability?.recent5K || '',
    recent10K: userData?.ability?.recent10K || '',
    recentHalf: userData?.ability?.recentHalf || '',
    recentFull: userData?.ability?.recentFull || '',
    weeklyMileage: userData?.ability?.weeklyMileage || 0,
    runningAge: userData?.ability?.runningAge || 0,
  });

  const [availability, setAvailability] = useState<UserAvailability>({
    daysPerWeek: userData?.availability?.daysPerWeek || 4,
    hoursPerSession: userData?.availability?.hoursPerSession || 1,
    preferredTime: userData?.availability?.preferredTime || 'flexible',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await updateUserData({ ability, availability });
      setMessage({ type: 'success', text: '資料已成功更新！' });
    } catch {
      setMessage({ type: 'error', text: '更新失敗，請稍後再試。' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
        個人資料設定
      </h1>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Running Ability */}
        <Card>
          <CardHeader>
            <CardTitle>跑步能力</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              填寫你的近期比賽成績，系統會用來計算你的 VDOT 值和訓練配速。
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="近期 5K 成績"
                placeholder="例：25:30"
                value={ability.recent5K}
                onChange={(e) => setAbility({ ...ability, recent5K: e.target.value })}
                helperText="格式：分:秒"
              />
              <Input
                label="近期 10K 成績"
                placeholder="例：52:00"
                value={ability.recent10K}
                onChange={(e) => setAbility({ ...ability, recent10K: e.target.value })}
                helperText="格式：分:秒"
              />
              <Input
                label="近期半馬成績"
                placeholder="例：1:55:00"
                value={ability.recentHalf}
                onChange={(e) => setAbility({ ...ability, recentHalf: e.target.value })}
                helperText="格式：時:分:秒"
              />
              <Input
                label="近期全馬成績"
                placeholder="例：4:00:00"
                value={ability.recentFull}
                onChange={(e) => setAbility({ ...ability, recentFull: e.target.value })}
                helperText="格式：時:分:秒"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <Input
                label="目前週跑量 (公里)"
                type="number"
                min="0"
                max="200"
                value={ability.weeklyMileage}
                onChange={(e) => setAbility({ ...ability, weeklyMileage: parseInt(e.target.value) || 0 })}
                helperText="每週平均跑步公里數"
              />
              <Input
                label="跑齡 (月)"
                type="number"
                min="0"
                max="600"
                value={ability.runningAge}
                onChange={(e) => setAbility({ ...ability, runningAge: parseInt(e.target.value) || 0 })}
                helperText="開始規律跑步至今的月數"
              />
            </div>
          </CardContent>
        </Card>

        {/* Availability */}
        <Card>
          <CardHeader>
            <CardTitle>時間安排</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              設定你的可用訓練時間，系統會據此安排適合你的訓練計劃。
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <Select
                label="每週可練天數"
                value={availability.daysPerWeek.toString()}
                onChange={(e) => setAvailability({ ...availability, daysPerWeek: parseInt(e.target.value) })}
                options={[
                  { value: '3', label: '3 天' },
                  { value: '4', label: '4 天' },
                  { value: '5', label: '5 天' },
                  { value: '6', label: '6 天' },
                  { value: '7', label: '7 天' },
                ]}
              />
              <Select
                label="每次可用時間"
                value={availability.hoursPerSession.toString()}
                onChange={(e) => setAvailability({ ...availability, hoursPerSession: parseFloat(e.target.value) })}
                options={[
                  { value: '0.5', label: '30 分鐘' },
                  { value: '1', label: '1 小時' },
                  { value: '1.5', label: '1.5 小時' },
                  { value: '2', label: '2 小時' },
                  { value: '2.5', label: '2.5 小時' },
                  { value: '3', label: '3 小時以上' },
                ]}
              />
              <Select
                label="偏好訓練時段"
                value={availability.preferredTime}
                onChange={(e) => setAvailability({ ...availability, preferredTime: e.target.value as UserAvailability['preferredTime'] })}
                options={[
                  { value: 'morning', label: '早晨' },
                  { value: 'noon', label: '中午' },
                  { value: 'evening', label: '晚間' },
                  { value: 'flexible', label: '彈性' },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>帳號資訊</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  顯示名稱
                </label>
                <p className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white">
                  {userData?.displayName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  電子郵件
                </label>
                <p className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white">
                  {userData?.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" isLoading={saving} size="lg">
            儲存變更
          </Button>
        </div>
      </form>
    </div>
  );
}
