import { NextRequest, NextResponse } from 'next/server';
import { GarminConnect } from '@gooin/garmin-connect';
import { sessions, cleanupSessions } from '@/lib/garminSessions';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '請輸入帳號和密碼' },
        { status: 400 }
      );
    }

    // Clean up old sessions
    cleanupSessions();

    // Initialize Garmin Connect
    const GC = new GarminConnect({
      username: email,
      password: password,
    });

    try {
      await GC.login();
    } catch (loginError) {
      const error = loginError as Error;
      console.error('Garmin login error:', error.message);

      if (error.message.includes('CAPTCHA') || error.message.includes('captcha')) {
        return NextResponse.json({
          success: false,
          error: 'Garmin 需要驗證碼，請先在瀏覽器登入 connect.garmin.com 後再試',
        }, { status: 401 });
      }

      if (error.message.includes('credentials') || error.message.includes('password')) {
        return NextResponse.json({
          success: false,
          error: '帳號或密碼錯誤',
        }, { status: 401 });
      }

      return NextResponse.json({
        success: false,
        error: '無法登入 Garmin Connect，請稍後再試',
      }, { status: 500 });
    }

    // Get user profile
    let userProfile: Record<string, unknown> = {};
    try {
      userProfile = await GC.getUserProfile() as unknown as Record<string, unknown>;
    } catch {
      // Profile fetch is optional
    }

    // Generate session ID
    const sessionId = `garmin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store session
    sessions.set(sessionId, {
      gc: GC,
      user: userProfile,
      timestamp: Date.now(),
    });

    return NextResponse.json({
      success: true,
      sessionId,
      user: {
        displayName: userProfile.displayName || email.split('@')[0],
        profileImageUrl: userProfile.profileImageUrlLarge || null,
      },
    });
  } catch (error) {
    console.error('Garmin login error:', error);
    return NextResponse.json(
      { success: false, error: '登入時發生錯誤' },
      { status: 500 }
    );
  }
}
