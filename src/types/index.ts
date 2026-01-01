import { Timestamp } from 'firebase/firestore';

// User types
export interface UserAbility {
  recent5K?: string;
  recent10K?: string;
  recentHalf?: string;
  recentFull?: string;
  weeklyMileage: number;
  runningAge: number;
}

export interface UserAvailability {
  daysPerWeek: number;
  hoursPerSession: number;
  preferredTime: 'morning' | 'noon' | 'evening' | 'flexible';
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: Timestamp;
  ability: UserAbility;
  availability: UserAvailability;
}

// Plan types
export type RaceDistance = '5K' | '10K' | 'half' | 'full';
export type PlanStatus = 'active' | 'completed' | 'abandoned';
export type Phase = 'base' | 'build' | 'peak' | 'taper';
export type WorkoutType = 'easy' | 'long' | 'tempo' | 'interval' | 'recovery' | 'rest' | 'race';
export type SegmentType = 'warmup' | 'main' | 'cooldown' | 'recovery';

export interface Paces {
  easy: string;
  marathon: string;
  threshold: string;
  interval: string;
  repetition: string;
}

export interface TrainingParams {
  vdot: number;
  totalWeeks: number;
  peakMileage: number;
  paces: Paces;
}

export interface Race {
  name: string;
  date: Timestamp;
  distance: RaceDistance;
  targetTime?: string;
  city?: string;
}

export interface Segment {
  type: SegmentType;
  distance?: number;
  duration?: number;
  pace?: string;
  repeat?: number;
}

export interface ActualData {
  distance: number;
  duration: number;
  avgPace: string;
  avgHR?: number;
  notes?: string;
}

export interface Workout {
  dayOfWeek: number;
  date: Timestamp;
  type: WorkoutType;
  title: string;
  description: string;
  distance?: number;
  duration?: number;
  targetPace?: string;
  segments?: Segment[];
  completed: boolean;
  completedAt?: Timestamp;
  actualData?: ActualData;
}

export interface Week {
  weekNumber: number;
  phase: Phase;
  phaseWeek: number;
  totalMileage: number;
  workouts: Workout[];
}

export interface Plan {
  id: string;
  userId: string;
  createdAt: Timestamp;
  status: PlanStatus;
  race: Race;
  trainingParams: TrainingParams;
  weeks: Week[];
}

// Form types for creating a new plan
export interface NewPlanFormData {
  raceName: string;
  raceDate: string;
  raceDistance: RaceDistance;
  targetTime?: string;
  raceCity?: string;
}
