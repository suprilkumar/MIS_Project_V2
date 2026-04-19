'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const roleRoutes = {
  superadmin: ['/admin', '/centres', '/courses', '/categories', '/students', '/reports'],
  coreadmin: ['/centres', '/courses', '/students', '/reports'],
  centreadmin: ['/students', '/reports'],
  operator: ['/students', '/enrollments'],
  user: ['/dashboard']
};

export function useRoleRedirect() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      if (pathname !== '/login' && pathname !== '/register') {
        router.push('/login');
      }
      return;
    }

    const userRole = user.role;
    const allowedRoutes = roleRoutes[userRole] || roleRoutes.user;
    
    // Check if current route is allowed
    const isAllowed = allowedRoutes.some(route => pathname.startsWith(route));
    
    if (!isAllowed && pathname !== '/dashboard') {
      router.push('/dashboard');
    }
  }, [user, isLoading, pathname, router]);
}