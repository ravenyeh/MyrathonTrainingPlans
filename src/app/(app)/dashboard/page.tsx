'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { getLocalPlans, getActivePlanId } from '@/lib/localStorage';
import { Plan, Workout } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { getPhaseLabel, getDistanceLabel, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const { user, userData } = useAuth();
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivePlan() {
      // If logged in, fetch from Firestore
      if (user && db) {
        try {
          const plansRef = collection(db, 'plans');
          const q = query(
            plansRef,
            where('userId', '==', user.uid),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc'),
            limit(1)
          );

          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const planDoc = snapshot.docs[0];
            setActivePlan({ id: planDoc.id, ...planDoc.data() } as Plan);
          }
        } catch (error) {
          console.error('Error fetching plan:', error);
        }
      } else {
        // Load from localStorage for non-logged in users
        const localPlans = getLocalPlans();
        const activePlanId = getActivePlanId();

        if (activePlanId) {
          const plan = localPlans.find(p => p.id === activePlanId);
          if (plan) {
            setActivePlan(plan);
          }
        } else if (localPlans.length > 0) {
          // Use the most recent plan
          setActivePlan(localPlans[localPlans.length - 1]);
        }
      }

      setLoading(false);
    }

    fetchActivePlan();
  }, [user]);

  const getCurrentWeek = () => {
    if (!activePlan) return null;

    const now = new Date();
    return activePlan.weeks.find(week => {
      const workoutDate = week.workouts[0]?.date;
      const weekStart = typeof workoutDate?.toDate === 'function'
        ? workoutDate.toDate()
        : new Date(workoutDate as unknown as string);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      return now >= weekStart && now < weekEnd;
    });
  };

  const getUpcomingWorkouts = (): Workout[] => {
    if (!activePlan) return [];

    const now = new Date();
    const upcoming: Workout[] = [];

    for (const week of activePlan.weeks) {
      for (const workout of week.workouts) {
        const workoutDate = typeof workout.date?.toDate === 'function'
          ? workout.date.toDate()
          : new Date(workout.date as unknown as string);
        if (workoutDate >= now && !workout.completed && upcoming.length < 5) {
          upcoming.push(workout);
        }
      }
    }

    return upcoming;
  };

  const formatWorkoutDate = (date: Workout['date']) => {
    const dateObj = typeof date?.toDate === 'function'
      ? date.toDate()
      : new Date(date as unknown as string);
    return formatDate(dateObj);
  };

  const currentWeek = getCurrentWeek();
  const upcomingWorkouts = getUpcomingWorkouts();

  // Default ability values for non-logged in users
  const weeklyMileage = userData?.ability?.weeklyMileage || 30;
  const daysPerWeek = userData?.availability?.daysPerWeek || 4;
  const runningAge = userData?.ability?.runningAge || 12;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-lavender-100 dark:bg-slate-700 rounded w-1/4" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-64 bg-lavender-100 dark:bg-slate-700 rounded-xl" />
            <div className="h-64 bg-lavender-100 dark:bg-slate-700 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-700 dark:text-white">
          {user ? `歡迎回來，${userData?.displayName || 'Runner'}！` : '馬拉松訓練計劃'}
        </h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">
          {user ? '準備好今天的訓練了嗎？' : '建立你的個人化訓練計劃'}
        </p>
      </div>

      {activePlan ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Active Plan Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>進行中的計劃</CardTitle>
                  <Link href={`/plan/${activePlan.id}`}>
                    <Button variant="outline" size="sm">
                      查看完整計劃
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-white">
                    {activePlan.race.name}
                  </h3>
                  <p className="text-gray-500 dark:text-slate-400">
                    {getDistanceLabel(activePlan.race.distance)} · {formatWorkoutDate(activePlan.race.date)}
                  </p>
                </div>

                {/* Training Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-rose-50 dark:bg-slate-900 rounded-xl">
                    <p className="text-2xl font-bold text-rose-500">
                      {activePlan.trainingParams.vdot}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">VDOT</p>
                  </div>
                  <div className="text-center p-4 bg-mint-50 dark:bg-slate-900 rounded-xl">
                    <p className="text-2xl font-bold text-mint-600">
                      {currentWeek?.weekNumber || '-'}/{activePlan.trainingParams.totalWeeks}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">訓練週數</p>
                  </div>
                  <div className="text-center p-4 bg-lavender-50 dark:bg-slate-900 rounded-xl">
                    <p className="text-2xl font-bold text-lavender-600">
                      {currentWeek?.totalMileage || '-'} km
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">本週跑量</p>
                  </div>
                </div>

                {/* Current Phase */}
                {currentWeek && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-gray-500 dark:text-slate-400">目前階段：</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium phase-${currentWeek.phase}`}>
                      {getPhaseLabel(currentWeek.phase)}
                    </span>
                  </div>
                )}

                {/* Paces */}
                <div className="border-t border-rose-100 dark:border-slate-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-slate-300 mb-3">
                    訓練配速
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
                    <div className="p-2 bg-mint-50 dark:bg-mint-900/20 rounded-lg">
                      <span className="text-mint-700 dark:text-mint-300 font-medium">E配速</span>
                      <p className="text-gray-700 dark:text-white">{activePlan.trainingParams.paces.easy}</p>
                    </div>
                    <div className="p-2 bg-sky-50 dark:bg-sky-900/20 rounded-lg">
                      <span className="text-sky-700 dark:text-sky-300 font-medium">M配速</span>
                      <p className="text-gray-700 dark:text-white">{activePlan.trainingParams.paces.marathon}</p>
                    </div>
                    <div className="p-2 bg-peach-50 dark:bg-peach-900/20 rounded-lg">
                      <span className="text-peach-700 dark:text-peach-300 font-medium">T配速</span>
                      <p className="text-gray-700 dark:text-white">{activePlan.trainingParams.paces.threshold}</p>
                    </div>
                    <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                      <span className="text-rose-600 dark:text-rose-300 font-medium">I配速</span>
                      <p className="text-gray-700 dark:text-white">{activePlan.trainingParams.paces.interval}</p>
                    </div>
                    <div className="p-2 bg-lavender-50 dark:bg-lavender-900/20 rounded-lg">
                      <span className="text-lavender-700 dark:text-lavender-300 font-medium">R配速</span>
                      <p className="text-gray-700 dark:text-white">{activePlan.trainingParams.paces.repetition}</p>
                    </div>
                  </div>
                </div>

                {/* Integration buttons for logged out users */}
                {!user && (
                  <div className="border-t border-rose-100 dark:border-slate-700 pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-slate-300 mb-3">
                      匯出與同步
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <Link href="/login?redirect=/dashboard&action=google-calendar">
                        <Button variant="outline" size="sm">
                          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.5 4H18V3a1 1 0 0 0-2 0v1H8V3a1 1 0 0 0-2 0v1H4.5C3.12 4 2 5.12 2 6.5v13C2 20.88 3.12 22 4.5 22h15c1.38 0 2.5-1.12 2.5-2.5v-13C22 5.12 20.88 4 19.5 4zm0 16h-15a.5.5 0 0 1-.5-.5V9h16v10.5a.5.5 0 0 1-.5.5z"/>
                          </svg>
                          匯出 Google Calendar
                        </Button>
                      </Link>
                      <Link href="/login?redirect=/dashboard&action=garmin">
                        <Button variant="outline" size="sm">
                          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                          </svg>
                          連接 Garmin Connect
                        </Button>
                      </Link>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      登入後即可同步訓練計劃到其他平台
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Workouts */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>近期訓練</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingWorkouts.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingWorkouts.map((workout, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-xl border workout-${workout.type}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-700 dark:text-white">
                            {workout.title}
                          </span>
                          {workout.distance && (
                            <span className="text-sm text-gray-500 dark:text-slate-400">
                              {workout.distance} km
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                          {formatWorkoutDate(workout.date)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-slate-400 text-center py-4">
                    沒有近期訓練
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* No Active Plan */
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-rose-400 dark:text-rose-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-700 dark:text-white mb-2">
              開始你的第一個訓練計劃
            </h2>
            <p className="text-gray-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
              設定你的目標賽事，我們會為你生成專屬的訓練計劃
              {!user && '。不需要註冊即可使用！'}
            </p>
            <Link href="/plan/new">
              <Button size="lg">
                建立新計劃
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats - only show for logged in users with profile data */}
      {user && userData && (
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">週跑量目標</p>
                <p className="text-xl font-bold text-gray-700 dark:text-white">
                  {weeklyMileage} km
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-mint-100 dark:bg-mint-900 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-mint-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">每週訓練天數</p>
                <p className="text-xl font-bold text-gray-700 dark:text-white">
                  {daysPerWeek} 天
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-lavender-100 dark:bg-lavender-900 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-lavender-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">跑齡</p>
                <p className="text-xl font-bold text-gray-700 dark:text-white">
                  {Math.floor(runningAge / 12)} 年 {runningAge % 12} 月
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <Link href="/profile" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 bg-peach-100 dark:bg-peach-900 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-peach-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">編輯個人資料</p>
                <p className="text-sm font-medium text-rose-400">更新能力設定 →</p>
              </div>
            </Link>
          </Card>
        </div>
      )}
    </div>
  );
}
