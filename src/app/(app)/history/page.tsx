'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Plan } from '@/types';
import { Card, CardContent, Button } from '@/components/ui';
import { getDistanceLabel, formatDate } from '@/lib/utils';

export default function HistoryPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      if (!user || !db) return;

      try {
        const plansRef = collection(db, 'plans');
        const q = query(
          plansRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const plansList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Plan[];

        setPlans(plansList);
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPlans();
  }, [user]);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { text: string; class: string }> = {
      active: { text: '進行中', class: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
      completed: { text: '已完成', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
      abandoned: { text: '已放棄', class: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    };
    return labels[status] || labels.active;
  };

  const calculateProgress = (plan: Plan) => {
    const totalWorkouts = plan.weeks.reduce((sum, week) => sum + week.workouts.filter(w => w.type !== 'rest').length, 0);
    const completedWorkouts = plan.weeks.reduce(
      (sum, week) => sum + week.workouts.filter((w) => w.completed).length,
      0
    );
    return totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          訓練計劃歷史
        </h1>
        <Link href="/plan/new">
          <Button>建立新計劃</Button>
        </Link>
      </div>

      {plans.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              尚無訓練計劃
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              建立你的第一個訓練計劃，開始追蹤你的進度
            </p>
            <Link href="/plan/new">
              <Button>建立新計劃</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => {
            const status = getStatusLabel(plan.status);
            const progress = calculateProgress(plan);

            return (
              <Link key={plan.id} href={`/plan/${plan.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                          {plan.race.name}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                          {getDistanceLabel(plan.race.distance)} · {formatDate(plan.race.date.toDate())}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.class}`}>
                        {status.text}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-slate-500">VDOT</p>
                        <p className="font-semibold">{plan.trainingParams.vdot}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">週數</p>
                        <p className="font-semibold">{plan.trainingParams.totalWeeks} 週</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">完成度</p>
                        <p className="font-semibold">{progress}%</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
