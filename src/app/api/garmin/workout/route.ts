import { NextRequest, NextResponse } from 'next/server';
import { sessions } from '@/lib/garminSessions';

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: '請先登入 Garmin Connect' },
        { status: 401 }
      );
    }

    const session = sessions.get(sessionId);

    if (!session) {
      return NextResponse.json(
        { success: false, error: '登入已過期，請重新登入' },
        { status: 401 }
      );
    }

    const { workout, scheduledDate } = await request.json();

    if (!workout) {
      return NextResponse.json(
        { success: false, error: '請提供訓練資料' },
        { status: 400 }
      );
    }

    const GC = session.gc;

    let createdWorkout: Record<string, unknown> | null = null;

    try {
      // Try the standard addWorkout method
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createdWorkout = await GC.addWorkout(workout as any) as unknown as Record<string, unknown>;
    } catch (e) {
      const error = e as Error;
      console.log('addWorkout failed, trying alternative:', error.message);

      // Try alternative method
      const workoutPayload = {
        ...workout,
        workoutId: null,
        ownerId: null,
      };

      try {
        // Use the client directly if available
        if (GC.client && typeof GC.client.post === 'function') {
          const response = await GC.client.post(
            'https://connect.garmin.com/workout-service/workout',
            workoutPayload
          ) as { data: Record<string, unknown> };
          createdWorkout = response.data;
        } else {
          throw new Error('無法建立訓練，請稍後再試');
        }
      } catch (altError) {
        console.error('Alternative workout creation failed:', altError);
        throw new Error('無法建立訓練，請稍後再試');
      }
    }

    // Schedule workout if date is provided
    let scheduled = false;
    let scheduleError: string | null = null;

    if (scheduledDate && createdWorkout && createdWorkout.workoutId) {
      try {
        await GC.scheduleWorkout(
          { workoutId: createdWorkout.workoutId as string },
          new Date(scheduledDate)
        );
        scheduled = true;
        console.log('Workout scheduled successfully:', createdWorkout.workoutId, 'to', scheduledDate);
      } catch (e) {
        const error = e as Error;
        console.log('Schedule workout failed:', error.message);
        scheduleError = error.message;
      }
    }

    return NextResponse.json({
      success: true,
      message: scheduled
        ? '訓練已成功匯入並排程到 Garmin Connect'
        : '訓練已匯入 Garmin Connect' + (scheduleError ? '，但排程失敗' : ''),
      workout: {
        workoutId: createdWorkout?.workoutId,
        workoutName: workout.workoutName,
        scheduled: scheduled,
        scheduledDate: scheduled ? scheduledDate : null,
      },
    });
  } catch (error) {
    console.error('Workout creation error:', error);

    return NextResponse.json(
      { success: false, error: (error as Error).message || '建立訓練失敗，請稍後再試' },
      { status: 500 }
    );
  }
}
