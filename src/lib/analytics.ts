import { doc, setDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Anonymous usage tracking
export async function trackPlanGeneration(planData: {
  distance: string;
  targetTime?: string;
  startDate: string;
  endDate: string;
  weeklyDays: number;
}) {
  if (!db) return;

  try {
    // Increment global plan counter
    const statsRef = doc(db, 'stats', 'global');
    await setDoc(statsRef, {
      planCount: increment(1),
      lastUpdated: serverTimestamp(),
    }, { merge: true });

    // Log plan generation details (anonymous)
    const plansRef = collection(db, 'generatedPlans');
    await addDoc(plansRef, {
      ...planData,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to track plan generation:', error);
  }
}

export async function trackGarminImport(importData: {
  workoutCount: number;
  successCount: number;
  scheduledCount: number;
}) {
  if (!db) return;

  try {
    // Increment global Garmin import counter
    const statsRef = doc(db, 'stats', 'global');
    await setDoc(statsRef, {
      garminImportCount: increment(1),
      garminWorkoutCount: increment(importData.workoutCount),
      garminSuccessCount: increment(importData.successCount),
      lastUpdated: serverTimestamp(),
    }, { merge: true });

    // Log import details (anonymous)
    const importsRef = collection(db, 'garminImports');
    await addDoc(importsRef, {
      ...importData,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to track Garmin import:', error);
  }
}
