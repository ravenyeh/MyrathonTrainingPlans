'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar, Footer } from '@/components/layout';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 to-lavender-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-rose-300 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500 dark:text-slate-400">載入中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-rose-50/30 to-lavender-50/30 dark:bg-slate-900">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
