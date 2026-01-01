'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const { user, userData, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/dashboard', label: '儀表板' },
    { href: '/plan/new', label: '建立計劃' },
  ];

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-rose-100 dark:border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center gap-2">
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
          </div>

          {/* Desktop Navigation - Always visible */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-lavender-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
                )}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                href="/history"
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === '/history'
                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-lavender-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
                )}
              >
                歷史紀錄
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="hidden md:flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
                >
                  <div className="w-8 h-8 rounded-full bg-lavender-100 dark:bg-lavender-900 flex items-center justify-center">
                    <span className="text-sm font-medium text-lavender-700 dark:text-lavender-300">
                      {userData?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    {userData?.displayName || 'User'}
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                  className="hidden md:inline-flex"
                >
                  登出
                </Button>
              </>
            ) : (
              <Link href="/login" className="hidden md:block">
                <Button variant="ghost" size="sm">
                  登入
                </Button>
              </Link>
            )}

            {/* Mobile menu button - Always visible */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Always available */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-rose-100 dark:border-slate-800">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-lavender-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
                )}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href="/history"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'block px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname === '/history'
                      ? 'bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-lavender-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
                  )}
                >
                  歷史紀錄
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-lavender-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                >
                  個人資料
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-peach-600 hover:bg-peach-50 dark:hover:bg-peach-900/20"
                >
                  登出
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-lavender-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
              >
                登入（同步資料用）
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
