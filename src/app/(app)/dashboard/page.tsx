'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getLocalPlans, getActivePlanId } from '@/lib/localStorage';
import { Plan, Workout } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { getPhaseLabel, getDistanceLabel, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage
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

    setLoading(false);
  }, []);

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
          馬拉松訓練計劃
        </h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">
          建立你的個人化訓練計劃
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
              設定你的目標賽事，我們會為你生成專屬的訓練計劃。不需要註冊即可使用！
            </p>
            <Link href="/plan/new">
              <Button size="lg">
                建立新計劃
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
