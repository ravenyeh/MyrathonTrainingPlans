import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPace(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function parsePace(pace: string): number {
  const parts = pace.split(':');
  if (parts.length !== 2) return 0;
  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  return minutes * 60 + seconds;
}

export function parseTime(time: string): number {
  const parts = time.split(':').map(p => parseInt(p, 10));
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.round(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
  });
}

export function getDayName(dayOfWeek: number): string {
  const days = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
  return days[dayOfWeek % 7];
}

export function getDistanceLabel(distance: string): string {
  const labels: Record<string, string> = {
    '5K': '5 公里',
    '10K': '10 公里',
    'half': '半程馬拉松',
    'full': '全程馬拉松',
  };
  return labels[distance] || distance;
}

export function getPhaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    base: '基礎期',
    build: '強化期',
    peak: '比賽期',
    taper: '減量期',
  };
  return labels[phase] || phase;
}

export function getWorkoutTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    easy: '輕鬆跑',
    long: '長距離',
    tempo: '節奏跑',
    interval: '間歇訓練',
    recovery: '恢復跑',
    rest: '休息日',
    race: '比賽',
  };
  return labels[type] || type;
}
