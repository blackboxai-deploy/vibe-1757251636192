'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/login');
      } else {
        // Redirect based on user role
        if (user.role === 'admin') {
          router.push('/dashboard/admin');
        } else {
          router.push('/dashboard/user');
        }
      }
    }
  }, [user, loading, router]);

  // Show loading state
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  );
}