'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Plan, Week, Workout } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, Button, Modal } from '@/components/ui';
import { getPhaseLabel, getDistanceLabel, formatDate, getDayName } from '@/lib/utils';

export default function PlanDetailPage() {
  const params = useParams();
  const planId = params.planId as string;
  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState<{ week: Week; workout: Workout } | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  useEffect(() => {
    async function fetchPlan() {
      if (!user || !planId || !db) return;

      try {
        const planDoc = await getDoc(doc(db, 'plans', planId));
        if (planDoc.exists()) {
          setPlan({ id: planDoc.id, ...planDoc.data() } as Plan);
        }
      } catch (error) {
        console.error('Error fetching plan:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPlan();
  }, [user, planId]);

  const handleToggleComplete = async (weekNumber: number, dayOfWeek: number) => {
    if (!plan || !db) return;

    const updatedWeeks = plan.weeks.map((week) => {
      if (week.weekNumber === weekNumber) {
        return {
          ...week,
          workouts: week.workouts.map((workout) => {
            if (workout.dayOfWeek === dayOfWeek) {
              return { ...workout, completed: !workout.completed };
            }
            return workout;
          }),
        };
      }
      return week;
    });

    try {
      await updateDoc(doc(db, 'plans', planId), { weeks: updatedWeeks });
      setPlan({ ...plan, weeks: updatedWeeks });
    } catch (error) {
      console.error('Error updating workout:', error);
    }
  };

  const getCurrentWeekIndex = () => {
    if (!plan) return 0;

    const now = new Date();
    for (let i = 0; i < plan.weeks.length; i++) {
      const week = plan.weeks[i];
      const weekStart = week.workouts[0]?.date?.toDate?.() || new Date();
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      if (now >= weekStart && now < weekEnd) {
        return i;
      }
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-slate-600 dark:text-slate-400 mb-4">找不到此計劃</p>
            <Link href="/dashboard">
              <Button>返回儀表板</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentWeekIndex = getCurrentWeekIndex();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {plan.race.name}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {getDistanceLabel(plan.race.distance)} · {formatDate(plan.race.date.toDate())}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'calendar' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              日曆
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              列表
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">VDOT</p>
            <p className="text-2xl font-bold text-blue-600">{plan.trainingParams.vdot}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">總週數</p>
            <p className="text-2xl font-bold text-green-600">{plan.trainingParams.totalWeeks}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">最高週跑量</p>
            <p className="text-2xl font-bold text-purple-600">{plan.trainingParams.peakMileage} km</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">目標配速</p>
            <p className="text-2xl font-bold text-orange-600">{plan.trainingParams.paces.marathon}</p>
          </Card>
        </div>
      </div>

      {/* Training Weeks */}
      <div className="space-y-6">
        {plan.weeks.map((week, weekIndex) => (
          <Card
            key={week.weekNumber}
            className={weekIndex === currentWeekIndex ? 'ring-2 ring-blue-500' : ''}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>第 {week.weekNumber} 週</CardTitle>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium phase-${week.phase}`}>
                    {getPhaseLabel(week.phase)}
                  </span>
                  {weekIndex === currentWeekIndex && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                      本週
                    </span>
                  )}
                </div>
                <span className="text-slate-600 dark:text-slate-400">
                  {week.totalMileage} km
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {week.workouts.map((workout) => (
                  <div
                    key={workout.dayOfWeek}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md workout-${workout.type} ${
                      workout.completed ? 'opacity-60' : ''
                    }`}
                    onClick={() => setSelectedWorkout({ week, workout })}
                  >
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      {getDayName(workout.dayOfWeek)}
                    </div>
                    <div className="font-medium text-sm text-slate-900 dark:text-white mb-1 truncate">
                      {workout.title}
                    </div>
                    {workout.distance ? (
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {workout.distance} km
                      </div>
                    ) : null}
                    {workout.completed && (
                      <div className="mt-1">
                        <svg
                          className="w-4 h-4 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workout Detail Modal */}
      <Modal
        isOpen={!!selectedWorkout}
        onClose={() => setSelectedWorkout(null)}
        title={selectedWorkout?.workout.title}
        size="lg"
      >
        {selectedWorkout && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400">
                  第 {selectedWorkout.week.weekNumber} 週 · {getDayName(selectedWorkout.workout.dayOfWeek)}
                </p>
                <p className="text-sm text-slate-500">
                  {formatDate(selectedWorkout.workout.date.toDate())}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium phase-${selectedWorkout.week.phase}`}>
                {getPhaseLabel(selectedWorkout.week.phase)}
              </span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <p className="text-slate-700 dark:text-slate-300">
                {selectedWorkout.workout.description}
              </p>
            </div>

            {selectedWorkout.workout.distance && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">距離</p>
                  <p className="text-lg font-semibold">{selectedWorkout.workout.distance} km</p>
                </div>
                {selectedWorkout.workout.targetPace && (
                  <div>
                    <p className="text-sm text-slate-500">目標配速</p>
                    <p className="text-lg font-semibold">{selectedWorkout.workout.targetPace}</p>
                  </div>
                )}
              </div>
            )}

            {selectedWorkout.workout.segments && (
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  訓練結構
                </p>
                <div className="space-y-2">
                  {selectedWorkout.workout.segments.map((segment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded"
                    >
                      <span className="text-sm">
                        {segment.type === 'warmup' && '熱身'}
                        {segment.type === 'main' && '主課表'}
                        {segment.type === 'cooldown' && '緩和'}
                        {segment.type === 'recovery' && '恢復'}
                        {segment.repeat && ` x${segment.repeat}`}
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {segment.distance && `${segment.distance}km`}
                        {segment.pace && ` @ ${segment.pace}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                variant={selectedWorkout.workout.completed ? 'secondary' : 'primary'}
                className="flex-1"
                onClick={() => {
                  handleToggleComplete(
                    selectedWorkout.week.weekNumber,
                    selectedWorkout.workout.dayOfWeek
                  );
                  setSelectedWorkout(null);
                }}
              >
                {selectedWorkout.workout.completed ? '標記為未完成' : '標記為完成'}
              </Button>
              <Button variant="ghost" onClick={() => setSelectedWorkout(null)}>
                關閉
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
