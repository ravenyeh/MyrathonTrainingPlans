import { NextRequest, NextResponse } from 'next/server';
import { sessions } from '@/lib/garminSessions';

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id');

    if (sessionId && sessions.has(sessionId)) {
      sessions.delete(sessionId);
    }

    return NextResponse.json({
      success: true,
      message: '已登出 Garmin Connect',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: '登出時發生錯誤' },
      { status: 500 }
    );
  }
}
