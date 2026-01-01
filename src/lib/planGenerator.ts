import { Timestamp } from 'firebase/firestore';
import { Week, Workout, Phase, Paces, RaceDistance, WorkoutType } from '@/types';
import { getPaces, calculateVDOT, estimateVDOTFromMileage } from './vdot';

interface PlanConfig {
  raceDate: Date;
  raceDistance: RaceDistance;
  targetTime?: string;
  currentMileage: number;
  daysPerWeek: number;
  hoursPerSession: number;
  recentRaceTime?: string;
  recentRaceDistance?: RaceDistance;
  runningAge: number;
}

interface PhaseAllocation {
  phase: Phase;
  weeks: number;
}

// Allocate weeks to each training phase
function allocatePhases(totalWeeks: number): PhaseAllocation[] {
  // Phase distribution: Base 30%, Build 40%, Peak 20%, Taper 10%
  const taper = Math.max(2, Math.round(totalWeeks * 0.1));
  const peak = Math.max(2, Math.round(totalWeeks * 0.2));
  const build = Math.max(3, Math.round(totalWeeks * 0.4));
  const base = totalWeeks - taper - peak - build;

  return [
    { phase: 'base', weeks: Math.max(2, base) },
    { phase: 'build', weeks: build },
    { phase: 'peak', weeks: peak },
    { phase: 'taper', weeks: taper },
  ];
}

// Calculate weekly mileage progression
function calculateMileageProgression(
  currentMileage: number,
  peakMileage: number,
  phases: PhaseAllocation[]
): number[] {
  const mileages: number[] = [];

  for (const { phase, weeks } of phases) {
    for (let w = 0; w < weeks; w++) {
      let mileage: number;

      switch (phase) {
        case 'base':
          // Gradual increase from current to 70% of peak
          mileage = currentMileage + ((peakMileage * 0.7 - currentMileage) * (w + 1)) / weeks;
          break;
        case 'build':
          // Increase to peak with recovery weeks
          const buildProgress = (w + 1) / weeks;
          const isRecoveryWeek = (w + 1) % 4 === 0;
          mileage = peakMileage * 0.7 + (peakMileage * 0.3 * buildProgress);
          if (isRecoveryWeek) mileage *= 0.75;
          break;
        case 'peak':
          // Maintain high mileage with slight reduction
          const isPeakRecovery = (w + 1) % 3 === 0;
          mileage = peakMileage * (isPeakRecovery ? 0.8 : 0.95);
          break;
        case 'taper':
          // Reduce mileage significantly
          const taperProgress = (w + 1) / weeks;
          mileage = peakMileage * (0.7 - 0.4 * taperProgress);
          break;
        default:
          mileage = currentMileage;
      }

      mileages.push(Math.round(mileage));
    }
  }

  return mileages;
}

// Generate workouts for a single week
function generateWeekWorkouts(
  phase: Phase,
  weeklyMileage: number,
  daysPerWeek: number,
  paces: Paces,
  weekStartDate: Date,
  raceDistance: RaceDistance,
  isRaceWeek: boolean
): Workout[] {
  const workouts: Workout[] = [];

  // Determine workout types based on phase
  const workoutSchedule = getWorkoutSchedule(phase, daysPerWeek, isRaceWeek);

  // Distribute mileage
  const mileageDistribution = distributeMileage(weeklyMileage, workoutSchedule);

  for (let day = 0; day < 7; day++) {
    const workoutDate = new Date(weekStartDate);
    workoutDate.setDate(workoutDate.getDate() + day);

    const workoutType = workoutSchedule[day];
    const distance = mileageDistribution[day];

    const workout = createWorkout(
      day + 1,
      workoutDate,
      workoutType,
      distance,
      paces,
      raceDistance
    );

    workouts.push(workout);
  }

  return workouts;
}

// Get workout schedule based on phase and available days
function getWorkoutSchedule(phase: Phase, daysPerWeek: number, isRaceWeek: boolean): WorkoutType[] {
  // Default schedule: rest days filled based on available days
  const schedule: WorkoutType[] = ['rest', 'rest', 'rest', 'rest', 'rest', 'rest', 'rest'];

  if (isRaceWeek) {
    // Race week: light training, race on Sunday
    schedule[0] = 'easy';
    schedule[2] = 'recovery';
    schedule[4] = 'recovery';
    schedule[6] = 'race';
    return schedule;
  }

  // Assign workout days based on phase
  switch (phase) {
    case 'base':
      // Focus on easy runs and long run
      if (daysPerWeek >= 3) {
        schedule[1] = 'easy';     // Tuesday
        schedule[3] = 'easy';     // Thursday
        schedule[6] = 'long';     // Sunday
      }
      if (daysPerWeek >= 4) {
        schedule[5] = 'easy';     // Saturday
      }
      if (daysPerWeek >= 5) {
        schedule[2] = 'easy';     // Wednesday
      }
      break;

    case 'build':
      // Add tempo work
      if (daysPerWeek >= 3) {
        schedule[1] = 'tempo';    // Tuesday
        schedule[3] = 'easy';     // Thursday
        schedule[6] = 'long';     // Sunday
      }
      if (daysPerWeek >= 4) {
        schedule[5] = 'easy';     // Saturday
      }
      if (daysPerWeek >= 5) {
        schedule[2] = 'recovery'; // Wednesday
      }
      if (daysPerWeek >= 6) {
        schedule[4] = 'easy';     // Friday
      }
      break;

    case 'peak':
      // Add interval work
      if (daysPerWeek >= 3) {
        schedule[1] = 'interval'; // Tuesday
        schedule[4] = 'tempo';    // Friday
        schedule[6] = 'long';     // Sunday
      }
      if (daysPerWeek >= 4) {
        schedule[3] = 'easy';     // Thursday
      }
      if (daysPerWeek >= 5) {
        schedule[2] = 'recovery'; // Wednesday
      }
      if (daysPerWeek >= 6) {
        schedule[5] = 'easy';     // Saturday
      }
      break;

    case 'taper':
      // Reduce volume but maintain some intensity
      if (daysPerWeek >= 3) {
        schedule[1] = 'easy';     // Tuesday
        schedule[4] = 'tempo';    // Friday (short)
        schedule[6] = 'easy';     // Sunday (shorter long run)
      }
      if (daysPerWeek >= 4) {
        schedule[3] = 'recovery'; // Thursday
      }
      break;
  }

  return schedule;
}

// Distribute mileage across workout days
function distributeMileage(weeklyMileage: number, schedule: WorkoutType[]): number[] {
  const distribution: number[] = [0, 0, 0, 0, 0, 0, 0];

  // Count active days and calculate shares
  const longRunShare = 0.28;  // Long run gets 28% of weekly mileage
  const qualityShare = 0.15;  // Quality sessions get 15%
  let remainingMileage = weeklyMileage;

  // First, assign long run
  const longRunDay = schedule.indexOf('long');
  if (longRunDay !== -1) {
    distribution[longRunDay] = Math.round(weeklyMileage * longRunShare);
    remainingMileage -= distribution[longRunDay];
  }

  // Assign quality workouts (tempo, interval)
  schedule.forEach((type, day) => {
    if (type === 'tempo' || type === 'interval') {
      distribution[day] = Math.round(weeklyMileage * qualityShare);
      remainingMileage -= distribution[day];
    }
  });

  // Count easy and recovery runs
  const easyDays = schedule.filter(t => t === 'easy' || t === 'recovery').length;

  // Distribute remaining mileage to easy/recovery runs
  if (easyDays > 0) {
    const perDayMileage = Math.round(remainingMileage / easyDays);
    schedule.forEach((type, day) => {
      if (type === 'easy') {
        distribution[day] = perDayMileage;
      } else if (type === 'recovery') {
        distribution[day] = Math.round(perDayMileage * 0.6);
      }
    });
  }

  // Race day gets minimal distance (the race distance will be separate)
  const raceDay = schedule.indexOf('race');
  if (raceDay !== -1) {
    distribution[raceDay] = 0;
  }

  return distribution;
}

// Create a single workout
function createWorkout(
  dayOfWeek: number,
  date: Date,
  type: WorkoutType,
  distance: number,
  paces: Paces,
  raceDistance: RaceDistance
): Workout {
  const workoutDetails = getWorkoutDetails(type, distance, paces, raceDistance);

  return {
    dayOfWeek,
    date: Timestamp.fromDate(date),
    type,
    title: workoutDetails.title,
    description: workoutDetails.description,
    distance: distance > 0 ? distance : undefined,
    duration: workoutDetails.duration,
    targetPace: workoutDetails.targetPace,
    segments: workoutDetails.segments,
    completed: false,
  };
}

// Get workout details based on type
function getWorkoutDetails(
  type: WorkoutType,
  distance: number,
  paces: Paces,
  _raceDistance: RaceDistance
) {
  switch (type) {
    case 'easy':
      return {
        title: '輕鬆跑',
        description: `以輕鬆的配速跑 ${distance} 公里，保持可以對話的強度。`,
        targetPace: paces.easy,
        duration: Math.round(distance * 6.5),
        segments: undefined,
      };

    case 'long':
      return {
        title: '長距離跑',
        description: `本週的長距離訓練，${distance} 公里。前半段保持輕鬆，後半段可稍微提速。`,
        targetPace: paces.easy,
        duration: Math.round(distance * 6.5),
        segments: undefined,
      };

    case 'tempo':
      const tempoDistance = Math.min(Math.round(distance * 0.6), 8);
      return {
        title: '節奏跑',
        description: `節奏跑訓練：熱身 + ${tempoDistance}公里節奏跑 + 緩和`,
        targetPace: paces.threshold,
        duration: Math.round(distance * 5.5),
        segments: [
          { type: 'warmup' as const, distance: 2, pace: paces.easy },
          { type: 'main' as const, distance: tempoDistance, pace: paces.threshold },
          { type: 'cooldown' as const, distance: 2, pace: paces.easy },
        ],
      };

    case 'interval':
      const reps = Math.min(Math.floor(distance / 2), 6);
      return {
        title: '間歇訓練',
        description: `間歇訓練：熱身 + ${reps}x1000m 間歇 + 緩和`,
        targetPace: paces.interval,
        duration: Math.round(distance * 5),
        segments: [
          { type: 'warmup' as const, distance: 2, pace: paces.easy },
          { type: 'main' as const, distance: 1, pace: paces.interval, repeat: reps },
          { type: 'recovery' as const, distance: 0.4, pace: paces.easy, repeat: reps },
          { type: 'cooldown' as const, distance: 2, pace: paces.easy },
        ],
      };

    case 'recovery':
      return {
        title: '恢復跑',
        description: `輕鬆的恢復跑，${distance} 公里。保持非常輕鬆的配速。`,
        targetPace: `${paces.easy.split('-')[1] || paces.easy}+`,
        duration: Math.round(distance * 7),
        segments: undefined,
      };

    case 'rest':
      return {
        title: '休息日',
        description: '完全休息或進行交叉訓練（游泳、騎車、瑜珈等）。',
        targetPace: undefined,
        duration: undefined,
        segments: undefined,
      };

    case 'race':
      return {
        title: '比賽日',
        description: `比賽日！按照計劃配速完成比賽。相信你的訓練！`,
        targetPace: paces.marathon,
        duration: undefined,
        segments: undefined,
      };

    default:
      return {
        title: '訓練',
        description: '',
        targetPace: undefined,
        duration: undefined,
        segments: undefined,
      };
  }
}

// Calculate peak mileage based on race distance and current fitness
function calculatePeakMileage(raceDistance: RaceDistance, currentMileage: number): number {
  const minimumPeakMileage: Record<RaceDistance, number> = {
    '5K': 30,
    '10K': 40,
    'half': 50,
    'full': 60,
  };

  const idealPeakMileage: Record<RaceDistance, number> = {
    '5K': 50,
    '10K': 60,
    'half': 70,
    'full': 80,
  };

  const minimum = minimumPeakMileage[raceDistance];
  const ideal = idealPeakMileage[raceDistance];

  // Peak mileage should be at least 1.5x current, but not more than ideal
  const calculated = Math.max(minimum, Math.min(currentMileage * 1.5, ideal));

  return Math.round(calculated);
}

// Main function to generate a complete training plan
export function generatePlan(config: PlanConfig): {
  weeks: Week[];
  trainingParams: {
    vdot: number;
    totalWeeks: number;
    peakMileage: number;
    paces: Paces;
  };
} {
  // Calculate total training weeks
  const today = new Date();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const totalWeeks = Math.max(8, Math.floor((config.raceDate.getTime() - today.getTime()) / msPerWeek));

  // Calculate VDOT
  let vdot: number;
  if (config.recentRaceTime && config.recentRaceDistance) {
    vdot = calculateVDOT(config.recentRaceDistance, config.recentRaceTime);
  } else {
    vdot = estimateVDOTFromMileage(config.currentMileage, config.runningAge);
  }

  // Get training paces
  const paces = getPaces(vdot);

  // Calculate peak mileage
  const peakMileage = calculatePeakMileage(config.raceDistance, config.currentMileage);

  // Allocate training phases
  const phases = allocatePhases(totalWeeks);

  // Calculate mileage progression
  const mileageProgression = calculateMileageProgression(config.currentMileage, peakMileage, phases);

  // Generate weeks
  const weeks: Week[] = [];
  let weekNumber = 1;
  let phaseWeek = 1;
  let currentPhaseIndex = 0;
  let weeksInCurrentPhase = 0;

  // Find the Monday of the current week
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - startDate.getDay() + 1);

  for (let i = 0; i < totalWeeks; i++) {
    const currentPhase = phases[currentPhaseIndex];
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(weekStartDate.getDate() + i * 7);

    const isRaceWeek = i === totalWeeks - 1;

    const workouts = generateWeekWorkouts(
      currentPhase.phase,
      mileageProgression[i],
      config.daysPerWeek,
      paces,
      weekStartDate,
      config.raceDistance,
      isRaceWeek
    );

    weeks.push({
      weekNumber,
      phase: currentPhase.phase,
      phaseWeek,
      totalMileage: mileageProgression[i],
      workouts,
    });

    weekNumber++;
    phaseWeek++;
    weeksInCurrentPhase++;

    // Move to next phase if needed
    if (weeksInCurrentPhase >= currentPhase.weeks && currentPhaseIndex < phases.length - 1) {
      currentPhaseIndex++;
      phaseWeek = 1;
      weeksInCurrentPhase = 0;
    }
  }

  return {
    weeks,
    trainingParams: {
      vdot,
      totalWeeks,
      peakMileage,
      paces,
    },
  };
}
