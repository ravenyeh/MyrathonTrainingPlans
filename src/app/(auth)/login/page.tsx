'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (err) {
      const error = err as { code?: string; message?: string };
      setError(getErrorMessage(error.code || '', error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (err) {
      const error = err as { code?: string; message?: string };
      setError(getErrorMessage(error.code || '', error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 to-lavender-50 dark:bg-slate-900 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link href="/" className="flex items-center justify-center gap-2 mb-6">
            <svg
              className="w-8 h-8 text-rose-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span className="text-xl font-bold text-gray-700 dark:text-white">
              Marathon Planner
            </span>
          </Link>
          <CardTitle className="text-center">登入帳號</CardTitle>
          <p className="text-center text-sm text-gray-500 mt-2">
            登入後可同步計劃至雲端
          </p>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-peach-50 dark:bg-peach-900/20 border border-peach-200 dark:border-peach-800 rounded-lg">
              <p className="text-sm text-peach-600 dark:text-peach-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="電子郵件"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />

            <Input
              label="密碼"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              className="w-full"
              isLoading={loading}
            >
              登入
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-rose-100 dark:border-slate-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-800 text-gray-400">
                  或
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full mt-4"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              使用 Google 登入
            </Button>
          </div>

          <div className="mt-6 space-y-2">
            <p className="text-center text-sm text-gray-500 dark:text-slate-400">
              還沒有帳號？{' '}
              <Link href="/register" className="text-rose-500 hover:text-rose-600 font-medium">
                立即註冊
              </Link>
            </p>
            <p className="text-center text-sm text-gray-400 dark:text-slate-500">
              <Link href="/dashboard" className="hover:text-gray-600">
                或繼續使用不登入 →
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getErrorMessage(code: string, message?: string): string {
  const messages: Record<string, string> = {
    // Email/Password errors
    'auth/invalid-email': '無效的電子郵件格式',
    'auth/user-disabled': '此帳號已被停用',
    'auth/user-not-found': '找不到此帳號',
    'auth/wrong-password': '密碼錯誤',
    'auth/invalid-credential': '帳號或密碼錯誤',
    'auth/too-many-requests': '登入嘗試次數過多，請稍後再試',
    // Google Auth errors
    'auth/popup-closed-by-user': '登入視窗已關閉，請重試',
    'auth/popup-blocked': '彈出視窗被封鎖，請允許彈出視窗',
    'auth/cancelled-popup-request': '登入已取消',
    'auth/account-exists-with-different-credential': '此電子郵件已使用其他方式註冊',
    'auth/auth-domain-config-required': 'Firebase 設定錯誤，請聯繫管理員',
    'auth/operation-not-allowed': 'Google 登入未啟用，請聯繫管理員',
    'auth/unauthorized-domain': '此網域未授權使用 Google 登入',
    // Firebase not configured
    'Firebase not configured': 'Firebase 尚未設定，請先設定環境變數',
  };

  // Check if it's a Firebase not configured error
  if (message?.includes('Firebase not configured')) {
    return 'Firebase 尚未設定。請在 Firebase Console 中設定專案，並將設定加入環境變數。';
  }

  return messages[code] || `登入時發生錯誤：${code || message || '未知錯誤'}`;
}
