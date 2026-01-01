import { Paces, RaceDistance } from '@/types';
import { formatPace, parseTime } from './utils';

// VDOT lookup table based on Jack Daniels' Running Formula
// Format: time in seconds -> VDOT value
const vdotTables: Record<RaceDistance, [number, number][]> = {
  '5K': [
    [1800, 30], // 30:00
    [1680, 33], // 28:00
    [1560, 37], // 26:00
    [1440, 41], // 24:00
    [1320, 46], // 22:00
    [1200, 52], // 20:00
    [1080, 60], // 18:00
    [960, 70],  // 16:00
    [840, 85],  // 14:00
  ],
  '10K': [
    [3720, 30], // 62:00
    [3480, 33], // 58:00
    [3240, 37], // 54:00
    [3000, 41], // 50:00
    [2760, 46], // 46:00
    [2520, 52], // 42:00
    [2280, 60], // 38:00
    [2040, 70], // 34:00
    [1800, 85], // 30:00
  ],
  'half': [
    [8100, 30],  // 2:15:00
    [7560, 33],  // 2:06:00
    [7020, 37],  // 1:57:00
    [6480, 41],  // 1:48:00
    [5940, 46],  // 1:39:00
    [5400, 52],  // 1:30:00
    [4860, 60],  // 1:21:00
    [4320, 70],  // 1:12:00
    [3780, 85],  // 1:03:00
  ],
  'full': [
    [17100, 30], // 4:45:00
    [15900, 33], // 4:25:00
    [14700, 37], // 4:05:00
    [13500, 41], // 3:45:00
    [12300, 46], // 3:25:00
    [11100, 52], // 3:05:00
    [9900, 60],  // 2:45:00
    [8700, 70],  // 2:25:00
    [7500, 85],  // 2:05:00
  ],
};

// Pace tables: VDOT -> pace in seconds per km
const paceTables: Record<string, [number, number][]> = {
  easy: [
    [30, 450],  // 7:30
    [35, 408],  // 6:48
    [40, 372],  // 6:12
    [45, 342],  // 5:42
    [50, 318],  // 5:18
    [55, 294],  // 4:54
    [60, 276],  // 4:36
    [65, 258],  // 4:18
    [70, 240],  // 4:00
  ],
  marathon: [
    [30, 408],  // 6:48
    [35, 366],  // 6:06
    [40, 330],  // 5:30
    [45, 300],  // 5:00
    [50, 276],  // 4:36
    [55, 252],  // 4:12
    [60, 234],  // 3:54
    [65, 216],  // 3:36
    [70, 198],  // 3:18
  ],
  threshold: [
    [30, 378],  // 6:18
    [35, 342],  // 5:42
    [40, 312],  // 5:12
    [45, 282],  // 4:42
    [50, 258],  // 4:18
    [55, 234],  // 3:54
    [60, 216],  // 3:36
    [65, 198],  // 3:18
    [70, 180],  // 3:00
  ],
  interval: [
    [30, 348],  // 5:48
    [35, 318],  // 5:18
    [40, 288],  // 4:48
    [45, 258],  // 4:18
    [50, 234],  // 3:54
    [55, 210],  // 3:30
    [60, 192],  // 3:12
    [65, 174],  // 2:54
    [70, 162],  // 2:42
  ],
  repetition: [
    [30, 318],  // 5:18
    [35, 288],  // 4:48
    [40, 264],  // 4:24
    [45, 240],  // 4:00
    [50, 216],  // 3:36
    [55, 192],  // 3:12
    [60, 174],  // 2:54
    [65, 156],  // 2:36
    [70, 144],  // 2:24
  ],
};

// Linear interpolation
function interpolate(x: number, points: [number, number][]): number {
  // Sort points by x value
  const sorted = [...points].sort((a, b) => a[0] - b[0]);

  // Handle edge cases
  if (x <= sorted[0][0]) return sorted[0][1];
  if (x >= sorted[sorted.length - 1][0]) return sorted[sorted.length - 1][1];

  // Find the two points to interpolate between
  for (let i = 0; i < sorted.length - 1; i++) {
    if (x >= sorted[i][0] && x <= sorted[i + 1][0]) {
      const x1 = sorted[i][0];
      const y1 = sorted[i][1];
      const x2 = sorted[i + 1][0];
      const y2 = sorted[i + 1][1];

      return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
    }
  }

  return sorted[0][1];
}

export function calculateVDOT(distance: RaceDistance, time: string): number {
  const timeInSeconds = parseTime(time);
  const table = vdotTables[distance];

  // VDOT increases as time decreases
  const vdot = interpolate(timeInSeconds, table);

  return Math.round(vdot * 10) / 10;
}

export function getPaces(vdot: number): Paces {
  const easyPace = interpolate(vdot, paceTables.easy);
  const marathonPace = interpolate(vdot, paceTables.marathon);
  const thresholdPace = interpolate(vdot, paceTables.threshold);
  const intervalPace = interpolate(vdot, paceTables.interval);
  const repetitionPace = interpolate(vdot, paceTables.repetition);

  // Return paces as range strings
  return {
    easy: `${formatPace(easyPace)}-${formatPace(easyPace + 30)}`,
    marathon: formatPace(marathonPace),
    threshold: formatPace(thresholdPace),
    interval: formatPace(intervalPace),
    repetition: formatPace(repetitionPace),
  };
}

export function predictRaceTime(vdot: number, distance: RaceDistance): string {
  const table = vdotTables[distance];

  // Interpolate to find predicted time
  const vdotToTime = table.map(([time, v]) => [v, time] as [number, number]);
  const predictedSeconds = interpolate(vdot, vdotToTime);

  const hours = Math.floor(predictedSeconds / 3600);
  const minutes = Math.floor((predictedSeconds % 3600) / 60);
  const seconds = Math.round(predictedSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function estimateVDOTFromMileage(weeklyMileage: number, runningAge: number): number {
  // Rough estimate based on training volume and experience
  // This is a simplified heuristic
  let baseVDOT = 30;

  // Add VDOT based on weekly mileage
  if (weeklyMileage >= 80) baseVDOT += 20;
  else if (weeklyMileage >= 60) baseVDOT += 15;
  else if (weeklyMileage >= 40) baseVDOT += 10;
  else if (weeklyMileage >= 20) baseVDOT += 5;

  // Add VDOT based on running age (months)
  if (runningAge >= 60) baseVDOT += 10;
  else if (runningAge >= 36) baseVDOT += 7;
  else if (runningAge >= 12) baseVDOT += 3;

  return Math.min(baseVDOT, 70);
}
