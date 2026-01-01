import { NextRequest, NextResponse } from 'next/server';
import { GarminConnect } from '@gooin/garmin-connect';

interface WorkoutImportItem {
  workout: Record<string, unknown>;
  scheduledDate?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, workouts } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '請輸入 Garmin 帳號和密碼' },
        { status: 400 }
      );
    }

    if (!workouts || !Array.isArray(workouts) || workouts.length === 0) {
      return NextResponse.json(
        { success: false, error: '請提供要匯入的訓練資料' },
        { status: 400 }
      );
    }

    // Initialize and login to Garmin Connect
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
          error: 'Garmin 需要驗證碼。請先在瀏覽器中前往 connect.garmin.com 登入一次，完成驗證後再試。',
          requiresCaptcha: true,
        }, { status: 401 });
      }

      if (error.message.includes('credentials') || error.message.includes('password')) {
        return NextResponse.json({
          success: false,
          error: 'Garmin 帳號或密碼錯誤',
        }, { status: 401 });
      }

      if (error.message.includes('blocked') || error.message.includes('rate')) {
        return NextResponse.json({
          success: false,
          error: '請求次數過多，請稍後再試',
        }, { status: 429 });
      }

      return NextResponse.json({
        success: false,
        error: '無法登入 Garmin Connect，請稍後再試',
      }, { status: 500 });
    }

    // Import workouts
    const results: Array<{
      workoutName: string;
      success: boolean;
      workoutId?: string | number;
      scheduled: boolean;
      scheduledDate?: string;
      error?: string;
    }> = [];
    let importedCount = 0;
    let scheduledCount = 0;

    for (const item of workouts as WorkoutImportItem[]) {
      const { workout, scheduledDate } = item;

      try {
        let createdWorkout: Record<string, unknown> | null = null;

        // Try to create workout
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          createdWorkout = await GC.addWorkout(workout as any) as unknown as Record<string, unknown>;
        } catch {
          // Try alternative method
          const workoutPayload = {
            ...workout,
            workoutId: null,
            ownerId: null,
          };

          if (GC.client && typeof GC.client.post === 'function') {
            const response = await GC.client.post(
              'https://connect.garmin.com/workout-service/workout',
              workoutPayload
            ) as { data: Record<string, unknown> };
            createdWorkout = response.data;
          }
        }

        if (!createdWorkout) {
          results.push({
            workoutName: workout.workoutName as string,
            success: false,
            scheduled: false,
            error: '建立失敗',
          });
          continue;
        }

        importedCount++;

        // Schedule if date provided
        let scheduled = false;
        if (scheduledDate && createdWorkout.workoutId) {
          try {
            await GC.scheduleWorkout(
              { workoutId: createdWorkout.workoutId as string },
              new Date(scheduledDate)
            );
            scheduled = true;
            scheduledCount++;
          } catch (scheduleError) {
            console.log('Schedule failed:', (scheduleError as Error).message);
          }
        }

        results.push({
          workoutName: workout.workoutName as string,
          success: true,
          workoutId: createdWorkout.workoutId as string | number,
          scheduled,
          scheduledDate: scheduled ? scheduledDate : undefined,
        });

        // Small delay between imports to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (workoutError) {
        console.error('Workout import error:', workoutError);
        results.push({
          workoutName: workout.workoutName as string,
          success: false,
          scheduled: false,
          error: (workoutError as Error).message,
        });
      }
    }

    return NextResponse.json({
      success: importedCount > 0,
      message: `成功匯入 ${importedCount}/${workouts.length} 個訓練${scheduledCount > 0 ? `，${scheduledCount} 個已排程` : ''}`,
      summary: {
        total: workouts.length,
        imported: importedCount,
        scheduled: scheduledCount,
        failed: workouts.length - importedCount,
      },
      results,
    });
  } catch (error) {
    console.error('Import error:', error);

    return NextResponse.json(
      { success: false, error: '匯入時發生錯誤，請稍後再試' },
      { status: 500 }
    );
  }
}
