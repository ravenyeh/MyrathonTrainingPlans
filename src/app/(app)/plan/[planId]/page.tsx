'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getLocalPlan, saveLocalPlan, deleteLocalPlan, clearActivePlanId } from '@/lib/localStorage';
import { Plan, Week, Workout } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, Button, Modal } from '@/components/ui';
import { getPhaseLabel, getDistanceLabel, formatDate, getDayName } from '@/lib/utils';
import GarminExportModal from '@/components/GarminExportModal';

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.planId as string;
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState<{ week: Week; workout: Workout } | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showGarminModal, setShowGarminModal] = useState(false);

  useEffect(() => {
    if (!planId) {
      setLoading(false);
      return;
    }

    // Load from localStorage
    const localPlan = getLocalPlan(planId);
    if (localPlan) {
      setPlan(localPlan);
    }
    setLoading(false);
  }, [planId]);

  const formatWorkoutDate = (date: Workout['date']) => {
    if (!date) return '';
    const dateObj = typeof date?.toDate === 'function'
      ? date.toDate()
      : new Date(date as unknown as string);
    return formatDate(dateObj);
  };

  const formatRaceDate = (date: Plan['race']['date']) => {
    if (!date) return '';
    const dateObj = typeof date?.toDate === 'function'
      ? date.toDate()
      : new Date(date as unknown as string);
    return formatDate(dateObj);
  };

  const handleToggleComplete = (weekNumber: number, dayOfWeek: number) => {
    if (!plan) return;

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

    const updatedPlan = { ...plan, weeks: updatedWeeks };
    saveLocalPlan(updatedPlan);
    setPlan(updatedPlan);
  };

  const getCurrentWeekIndex = () => {
    if (!plan) return 0;

    const now = new Date();
    for (let i = 0; i < plan.weeks.length; i++) {
      const week = plan.weeks[i];
      const workoutDate = week.workouts[0]?.date;
      const weekStart = typeof workoutDate?.toDate === 'function'
        ? workoutDate.toDate()
        : new Date(workoutDate as unknown as string);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      if (now >= weekStart && now < weekEnd) {
        return i;
      }
    }
    return 0;
  };

  const handleDeletePlan = () => {
    if (!plan) return;

    setDeleting(true);
    deleteLocalPlan(planId);
    clearActivePlanId();
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-lavender-100 dark:bg-slate-700 rounded w-1/3" />
          <div className="h-64 bg-lavender-100 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-gray-500 dark:text-slate-400 mb-4">找不到此計劃</p>
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
            <h1 className="text-3xl font-bold text-gray-700 dark:text-white">
              {plan.race.name}
            </h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1">
              {getDistanceLabel(plan.race.distance)} · {formatRaceDate(plan.race.date)}
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
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowGarminModal(true)}
            >
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              匯出 Garmin
            </Button>
            <Link href="/plan/new">
              <Button variant="outline" size="sm">
                建立新計劃
              </Button>
            </Link>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
            >
              刪除計劃
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-gray-500 dark:text-slate-400">VDOT</p>
            <p className="text-2xl font-bold text-rose-500">{plan.trainingParams.vdot}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500 dark:text-slate-400">總週數</p>
            <p className="text-2xl font-bold text-mint-600">{plan.trainingParams.totalWeeks}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500 dark:text-slate-400">最高週跑量</p>
            <p className="text-2xl font-bold text-lavender-600">{plan.trainingParams.peakMileage} km</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500 dark:text-slate-400">目標配速</p>
            <p className="text-2xl font-bold text-peach-600">{plan.trainingParams.paces.marathon}</p>
          </Card>
        </div>

        {/* Info message */}
        <div className="mt-4 p-4 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg">
          <p className="text-sm text-sky-800 dark:text-sky-200">
            此計劃儲存在你的瀏覽器中。使用右上角「匯出 Garmin」按鈕可以直接將訓練匯入 Garmin Connect。
          </p>
        </div>
      </div>

      {/* Training Weeks */}
      <div className="space-y-6">
        {plan.weeks.map((week, weekIndex) => (
          <Card
            key={week.weekNumber}
            className={weekIndex === currentWeekIndex ? 'ring-2 ring-rose-400' : ''}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>第 {week.weekNumber} 週</CardTitle>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium phase-${week.phase}`}>
                    {getPhaseLabel(week.phase)}
                  </span>
                  {weekIndex === currentWeekIndex && (
                    <span className="px-2 py-1 bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300 text-xs rounded-full">
                      本週
                    </span>
                  )}
                </div>
                <span className="text-gray-500 dark:text-slate-400">
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
                    <div className="text-xs text-gray-400 dark:text-slate-400 mb-1">
                      {getDayName(workout.dayOfWeek)}
                    </div>
                    <div className="font-medium text-sm text-gray-700 dark:text-white mb-1 truncate">
                      {workout.title}
                    </div>
                    {workout.distance ? (
                      <div className="text-xs text-gray-500 dark:text-slate-400">
                        {workout.distance} km
                      </div>
                    ) : null}
                    {workout.completed && (
                      <div className="mt-1">
                        <svg
                          className="w-4 h-4 text-mint-500"
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
                <p className="text-gray-500 dark:text-slate-400">
                  第 {selectedWorkout.week.weekNumber} 週 · {getDayName(selectedWorkout.workout.dayOfWeek)}
                </p>
                <p className="text-sm text-gray-400">
                  {formatWorkoutDate(selectedWorkout.workout.date)}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium phase-${selectedWorkout.week.phase}`}>
                {getPhaseLabel(selectedWorkout.week.phase)}
              </span>
            </div>

            <div className="p-4 bg-lavender-50 dark:bg-slate-900 rounded-lg">
              <p className="text-gray-600 dark:text-slate-300">
                {selectedWorkout.workout.description}
              </p>
            </div>

            {selectedWorkout.workout.distance && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">距離</p>
                  <p className="text-lg font-semibold text-gray-700 dark:text-white">{selectedWorkout.workout.distance} km</p>
                </div>
                {selectedWorkout.workout.targetPace && (
                  <div>
                    <p className="text-sm text-gray-400">目標配速</p>
                    <p className="text-lg font-semibold text-gray-700 dark:text-white">{selectedWorkout.workout.targetPace}</p>
                  </div>
                )}
              </div>
            )}

            {selectedWorkout.workout.segments && (
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">
                  訓練結構
                </p>
                <div className="space-y-2">
                  {selectedWorkout.workout.segments.map((segment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-rose-50 dark:bg-slate-800 rounded"
                    >
                      <span className="text-sm text-gray-700 dark:text-white">
                        {segment.type === 'warmup' && '熱身'}
                        {segment.type === 'main' && '主課表'}
                        {segment.type === 'cooldown' && '緩和'}
                        {segment.type === 'recovery' && '恢復'}
                        {segment.repeat && ` x${segment.repeat}`}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-slate-400">
                        {segment.distance && `${segment.distance}km`}
                        {segment.pace && ` @ ${segment.pace}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t border-rose-100 dark:border-slate-700">
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="確認刪除計劃"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-slate-300">
            確定要刪除「{plan.race.name}」嗎？此操作無法復原。
          </p>
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              取消
            </Button>
            <Button
              variant="danger"
              onClick={handleDeletePlan}
              isLoading={deleting}
            >
              確認刪除
            </Button>
          </div>
        </div>
      </Modal>

      {/* Garmin Export Modal */}
      <GarminExportModal
        isOpen={showGarminModal}
        onClose={() => setShowGarminModal(false)}
        plan={plan}
      />
    </div>
  );
}
