import { Workout } from '@/types';

// Garmin Step Types
const STEP_TYPES = {
  WARMUP: 1,
  COOLDOWN: 2,
  INTERVAL: 3,
  RECOVERY: 4,
  REST: 5,
  REPEAT: 6,
};

// Garmin End Condition Types
const END_CONDITION_TYPES = {
  LAP_BUTTON: 1,
  TIME: 2,
  DISTANCE: 3,
  ITERATIONS: 7,
};

// Garmin Target Types
const TARGET_TYPES = {
  NO_TARGET: 1,
  POWER: 2,
  CADENCE: 3,
  HEART_RATE: 4,
  SPEED: 5,
  PACE: 6,
};

// Convert pace string (e.g., "5:30") to meters per second
function paceToMetersPerSecond(paceStr: string): number {
  if (!paceStr) return 0;

  const parts = paceStr.split(':');
  if (parts.length !== 2) return 0;

  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  const totalSeconds = minutes * 60 + seconds;

  // pace is min/km, convert to m/s
  // 1 km = 1000m, pace = seconds per km
  // speed = 1000m / totalSeconds
  return totalSeconds > 0 ? 1000 / totalSeconds : 0;
}

// Create a Garmin workout step
function createStep(
  type: number,
  description: string,
  distanceMeters?: number,
  durationSeconds?: number,
  targetPace?: string
): Record<string, unknown> {
  const step: Record<string, unknown> = {
    type: 'ExecutableStepDTO',
    stepId: null,
    stepOrder: 1,
    stepType: {
      stepTypeId: type,
      stepTypeKey: getStepTypeKey(type),
    },
    childStepId: null,
    description: description,
    endCondition: {
      conditionTypeId: distanceMeters ? END_CONDITION_TYPES.DISTANCE :
                       durationSeconds ? END_CONDITION_TYPES.TIME :
                       END_CONDITION_TYPES.LAP_BUTTON,
      conditionTypeKey: distanceMeters ? 'distance' :
                        durationSeconds ? 'time' :
                        'lap.button',
    },
    endConditionValue: distanceMeters || durationSeconds || null,
    preferredEndConditionUnit: distanceMeters ? { unitKey: 'kilometer' } :
                               durationSeconds ? { unitKey: 'second' } : null,
  };

  if (targetPace) {
    const paceMs = paceToMetersPerSecond(targetPace);
    // Add 10% variance for pace range
    const lowPace = paceMs * 0.95;
    const highPace = paceMs * 1.05;

    step.targetType = {
      workoutTargetTypeId: TARGET_TYPES.PACE,
      workoutTargetTypeKey: 'pace.zone',
    };
    step.targetValueOne = lowPace;
    step.targetValueTwo = highPace;
  } else {
    step.targetType = {
      workoutTargetTypeId: TARGET_TYPES.NO_TARGET,
      workoutTargetTypeKey: 'no.target',
    };
    step.targetValueOne = null;
    step.targetValueTwo = null;
  }

  return step;
}

function getStepTypeKey(type: number): string {
  switch (type) {
    case STEP_TYPES.WARMUP: return 'warmup';
    case STEP_TYPES.COOLDOWN: return 'cooldown';
    case STEP_TYPES.INTERVAL: return 'interval';
    case STEP_TYPES.RECOVERY: return 'recovery';
    case STEP_TYPES.REST: return 'rest';
    case STEP_TYPES.REPEAT: return 'repeat';
    default: return 'interval';
  }
}

// Convert our workout to Garmin format
export function convertToGarminWorkout(workout: Workout, paces: {
  easy: string;
  marathon: string;
  threshold: string;
  interval: string;
  repetition: string;
}): Record<string, unknown> {
  const steps: Record<string, unknown>[] = [];
  let stepOrder = 1;

  // Determine pace based on workout type
  const getTargetPace = (type: string): string | undefined => {
    switch (type) {
      case 'easy':
      case 'recovery':
        return paces.easy;
      case 'long':
        return paces.easy;
      case 'tempo':
        return paces.threshold;
      case 'interval':
        return paces.interval;
      case 'race':
        return paces.marathon;
      default:
        return undefined;
    }
  };

  // If workout has segments, use them
  if (workout.segments && workout.segments.length > 0) {
    for (const segment of workout.segments) {
      let stepType = STEP_TYPES.INTERVAL;
      let pace: string | undefined;

      switch (segment.type) {
        case 'warmup':
          stepType = STEP_TYPES.WARMUP;
          pace = paces.easy;
          break;
        case 'cooldown':
          stepType = STEP_TYPES.COOLDOWN;
          pace = paces.easy;
          break;
        case 'recovery':
          stepType = STEP_TYPES.RECOVERY;
          pace = paces.easy;
          break;
        case 'main':
          stepType = STEP_TYPES.INTERVAL;
          pace = segment.pace || getTargetPace(workout.type);
          break;
        default:
          stepType = STEP_TYPES.INTERVAL;
          pace = segment.pace;
      }

      // Handle repeats
      if (segment.repeat && segment.repeat > 1) {
        const repeatStep: Record<string, unknown> = {
          type: 'RepeatGroupDTO',
          stepId: null,
          stepOrder: stepOrder++,
          stepType: {
            stepTypeId: STEP_TYPES.REPEAT,
            stepTypeKey: 'repeat',
          },
          numberOfIterations: segment.repeat,
          workoutSteps: [],
        };

        // Main interval step
        const intervalStep = createStep(
          STEP_TYPES.INTERVAL,
          segment.distance ? `${segment.distance}km` : '間歇',
          segment.distance ? segment.distance * 1000 : undefined,
          undefined,
          pace
        );
        intervalStep.stepOrder = 1;
        (repeatStep.workoutSteps as Record<string, unknown>[]).push(intervalStep);

        // Recovery step after each interval
        const recoveryStep = createStep(
          STEP_TYPES.RECOVERY,
          '恢復跑',
          undefined,
          90, // 90 seconds recovery
          paces.easy
        );
        recoveryStep.stepOrder = 2;
        (repeatStep.workoutSteps as Record<string, unknown>[]).push(recoveryStep);

        steps.push(repeatStep);
      } else {
        const step = createStep(
          stepType,
          segment.distance ? `${segment.distance}km @ ${pace || 'E配速'}` : segment.type,
          segment.distance ? segment.distance * 1000 : undefined,
          undefined,
          pace
        );
        step.stepOrder = stepOrder++;
        steps.push(step);
      }
    }
  } else {
    // Simple workout without segments
    // Add warmup
    const warmupStep = createStep(
      STEP_TYPES.WARMUP,
      '熱身跑',
      1500, // 1.5km warmup
      undefined,
      paces.easy
    );
    warmupStep.stepOrder = stepOrder++;
    steps.push(warmupStep);

    // Main workout
    if (workout.distance) {
      const mainDistance = Math.max((workout.distance - 3) * 1000, 1000); // Subtract warmup/cooldown
      const mainStep = createStep(
        STEP_TYPES.INTERVAL,
        workout.title,
        mainDistance,
        undefined,
        getTargetPace(workout.type)
      );
      mainStep.stepOrder = stepOrder++;
      steps.push(mainStep);
    }

    // Cooldown
    const cooldownStep = createStep(
      STEP_TYPES.COOLDOWN,
      '緩和跑',
      1500, // 1.5km cooldown
      undefined,
      paces.easy
    );
    cooldownStep.stepOrder = stepOrder++;
    steps.push(cooldownStep);
  }

  // Calculate estimated duration (assuming average pace of 6:00/km)
  const estimatedDuration = workout.distance ? workout.distance * 6 * 60 : 3600;

  return {
    workoutId: null,
    ownerId: null,
    workoutName: workout.title,
    description: workout.description || `${workout.title} - Marathon Training`,
    sportType: {
      sportTypeId: 1,
      sportTypeKey: 'running',
    },
    workoutSegments: [
      {
        segmentOrder: 1,
        sportType: {
          sportTypeId: 1,
          sportTypeKey: 'running',
        },
        workoutSteps: steps,
      },
    ],
    estimatedDurationInSecs: estimatedDuration,
    estimatedDistanceInMeters: workout.distance ? workout.distance * 1000 : null,
  };
}

// Convert date to Garmin format
export function formatGarminDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
