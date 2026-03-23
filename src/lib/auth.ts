// ============================================================================
// Vedi EHR — Auth Utilities (Refine-free)
// Simple JWT auth for doctor portal (Phase 0)
// Swap to Keycloak OIDC/PKCE in Phase 1 by replacing this file
// ============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types';

// ── Mock credentials (development) ──────────────────────────────────────────

const MOCK_USER: User = {
  id: 'doc-001',
  email: 'doctor@vedi.health',
  first_name: 'Dr. Sarah',
  last_name: 'Chen',
  role: 'doctor',
  avatar: undefined
};

const MOCK_CREDENTIALS = {
  email: 'doctor@vedi.health',
  password: 'doctor123'
};

// ── Pure auth functions ─────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  if (
    email === MOCK_CREDENTIALS.email &&
    password === MOCK_CREDENTIALS.password
  ) {
    const mockToken = btoa(
      JSON.stringify({
        sub: MOCK_USER.id,
        email,
        role: MOCK_USER.role,
        exp: Date.now() + 86400000
      })
    );
    localStorage.setItem('access_token', mockToken);
    localStorage.setItem('user', JSON.stringify(MOCK_USER));
    return { success: true };
  }

  return {
    success: false,
    error: 'Invalid email or password. Use doctor@vedi.health / doctor123'
  };
}

export function logout(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}

export function checkAuth(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('access_token');
}

export interface UserIdentity {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export function getIdentity(): UserIdentity | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    const user: User = JSON.parse(userStr);
    return {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      avatar: user.avatar,
      email: user.email ?? '',
      role: user.role ?? 'doctor'
    };
  } catch {
    return null;
  }
}

// ── useAuth hook ────────────────────────────────────────────────────────────

export function useAuth() {
  const router = useRouter();
  const [identity, setIdentity] = useState<UserIdentity | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authed = checkAuth();
    setIsAuthenticated(authed);
    if (authed) {
      setIdentity(getIdentity());
    }
    setIsLoading(false);
  }, []);

  const doLogin = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      const result = await login(email, password);
      if (result.success) {
        setIsAuthenticated(true);
        setIdentity(getIdentity());
        router.push('/dashboard/overview');
      }
      return result;
    },
    [router]
  );

  const doLogout = useCallback(() => {
    logout();
    setIsAuthenticated(false);
    setIdentity(null);
    router.push('/login');
  }, [router]);

  return {
    identity,
    isAuthenticated,
    isLoading,
    login: doLogin,
    logout: doLogout
  };
}
