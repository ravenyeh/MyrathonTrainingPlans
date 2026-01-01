'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Timestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { generatePlan } from '@/lib/planGenerator';
import { RaceDistance } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select } from '@/components/ui';
import { getDistanceLabel } from '@/lib/utils';

type Step = 'race' | 'ability' | 'review';

export default function NewPlanPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('race');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [raceName, setRaceName] = useState('');
  const [raceDate, setRaceDate] = useState('');
  const [raceDistance, setRaceDistance] = useState<RaceDistance>('half');
  const [targetTime, setTargetTime] = useState('');
  const [raceCity, setRaceCity] = useState('');

  // Use profile data for ability
  const [recentRaceDistance, setRecentRaceDistance] = useState<RaceDistance | ''>('');
  const [recentRaceTime, setRecentRaceTime] = useState('');

  const steps: { key: Step; label: string }[] = [
    { key: 'race', label: '賽事資訊' },
    { key: 'ability', label: '能力設定' },
    { key: 'review', label: '確認計劃' },
  ];

  const handleNext = () => {
    if (currentStep === 'race') {
      if (!raceName || !raceDate || !raceDistance) {
        setError('請填寫所有必填欄位');
        return;
      }
      setError('');
      setCurrentStep('ability');
    } else if (currentStep === 'ability') {
      setCurrentStep('review');
    }
  };

  const handleBack = () => {
    if (currentStep === 'ability') {
      setCurrentStep('race');
    } else if (currentStep === 'review') {
      setCurrentStep('ability');
    }
  };

  const handleCreatePlan = async () => {
    if (!user || !userData || !db) return;

    setLoading(true);
    setError('');

    try {
      const raceDateObj = new Date(raceDate);

      // Generate the plan
      const { weeks, trainingParams } = generatePlan({
        raceDate: raceDateObj,
        raceDistance,
        targetTime: targetTime || undefined,
        currentMileage: userData.ability.weeklyMileage || 20,
        daysPerWeek: userData.availability.daysPerWeek || 4,
        hoursPerSession: userData.availability.hoursPerSession || 1,
        recentRaceTime: recentRaceTime || userData.ability.recent5K || undefined,
        recentRaceDistance: (recentRaceDistance as RaceDistance) || '5K',
        runningAge: userData.ability.runningAge || 12,
      });

      // Save to Firestore
      const planData = {
        userId: user.uid,
        createdAt: Timestamp.now(),
        status: 'active',
        race: {
          name: raceName,
          date: Timestamp.fromDate(raceDateObj),
          distance: raceDistance,
          targetTime: targetTime || null,
          city: raceCity || null,
        },
        trainingParams,
        weeks,
      };

      const docRef = await addDoc(collection(db, 'plans'), planData);
      router.push(`/plan/${docRef.id}`);
    } catch (err) {
      console.error('Error creating plan:', err);
      setError('建立計劃時發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 56); // Minimum 8 weeks
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
        建立新訓練計劃
      </h1>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-medium ${
                  currentStep === step.key
                    ? 'bg-blue-600 text-white'
                    : steps.findIndex((s) => s.key === currentStep) > index
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {steps.findIndex((s) => s.key === currentStep) > index ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  currentStep === step.key
                    ? 'text-blue-600'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className="w-12 sm:w-24 h-0.5 mx-2 sm:mx-4 bg-slate-200 dark:bg-slate-700" />
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Step Content */}
      {currentStep === 'race' && (
        <Card>
          <CardHeader>
            <CardTitle>賽事資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="賽事名稱 *"
              placeholder="例：2024 台北馬拉松"
              value={raceName}
              onChange={(e) => setRaceName(e.target.value)}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="比賽日期 *"
                type="date"
                min={getMinDate()}
                value={raceDate}
                onChange={(e) => setRaceDate(e.target.value)}
                helperText="至少需要 8 週準備時間"
              />

              <Select
                label="比賽距離 *"
                value={raceDistance}
                onChange={(e) => setRaceDistance(e.target.value as RaceDistance)}
                options={[
                  { value: '5K', label: '5 公里' },
                  { value: '10K', label: '10 公里' },
                  { value: 'half', label: '半程馬拉松 (21.1K)' },
                  { value: 'full', label: '全程馬拉松 (42.2K)' },
                ]}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="目標完賽時間"
                placeholder="例：4:00:00"
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
                helperText="留空表示只求完賽"
              />

              <Input
                label="賽事地點"
                placeholder="例：台北市"
                value={raceCity}
                onChange={(e) => setRaceCity(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'ability' && (
        <Card>
          <CardHeader>
            <CardTitle>能力設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-slate-600 dark:text-slate-400">
              提供你的近期比賽成績，系統會計算出適合你的訓練配速。
              如果沒有近期成績，我們會根據你的個人資料來估算。
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <Select
                label="近期比賽距離"
                value={recentRaceDistance}
                onChange={(e) => setRecentRaceDistance(e.target.value as RaceDistance | '')}
                options={[
                  { value: '', label: '-- 選擇距離 --' },
                  { value: '5K', label: '5 公里' },
                  { value: '10K', label: '10 公里' },
                  { value: 'half', label: '半程馬拉松' },
                  { value: 'full', label: '全程馬拉松' },
                ]}
              />

              <Input
                label="完賽時間"
                placeholder="例：25:30 或 1:55:00"
                value={recentRaceTime}
                onChange={(e) => setRecentRaceTime(e.target.value)}
                helperText="格式：分:秒 或 時:分:秒"
              />
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                你的個人資料
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 dark:text-blue-300">週跑量：</span>
                  <span className="text-blue-900 dark:text-blue-100">
                    {userData?.ability.weeklyMileage || 0} km
                  </span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">訓練天數：</span>
                  <span className="text-blue-900 dark:text-blue-100">
                    {userData?.availability.daysPerWeek || 4} 天/週
                  </span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">跑齡：</span>
                  <span className="text-blue-900 dark:text-blue-100">
                    {userData?.ability.runningAge || 0} 個月
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'review' && (
        <Card>
          <CardHeader>
            <CardTitle>確認計劃</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                  賽事資訊
                </h4>
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {raceName}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    {getDistanceLabel(raceDistance)}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    {new Date(raceDate).toLocaleDateString('zh-TW', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  {raceCity && (
                    <p className="text-slate-600 dark:text-slate-400">{raceCity}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                  訓練設定
                </h4>
                <div className="space-y-2 text-slate-600 dark:text-slate-400">
                  <p>
                    週跑量：{userData?.ability.weeklyMileage || 20} km
                  </p>
                  <p>
                    每週訓練：{userData?.availability.daysPerWeek || 4} 天
                  </p>
                  {targetTime && (
                    <p>目標時間：{targetTime}</p>
                  )}
                  {recentRaceDistance && recentRaceTime && (
                    <p>
                      參考成績：{getDistanceLabel(recentRaceDistance)} {recentRaceTime}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                點擊「建立計劃」後，系統將根據你的設定自動生成完整的週期化訓練計劃。
                計劃會包含從現在到比賽日的所有訓練課表。
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={currentStep === 'race'}
        >
          上一步
        </Button>

        {currentStep === 'review' ? (
          <Button onClick={handleCreatePlan} isLoading={loading}>
            建立計劃
          </Button>
        ) : (
          <Button onClick={handleNext}>
            下一步
          </Button>
        )}
      </div>
    </div>
  );
}
