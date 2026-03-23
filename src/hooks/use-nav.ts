'use client';

/**
 * Fully client-side hook for filtering navigation items based on RBAC
 *
 * Without Clerk, all items are shown. When Clerk is enabled, it uses
 * Clerk's client-side hooks to check permissions, roles, and organization.
 *
 * Note: For actual security (API routes, server actions), always use server-side checks.
 * This is only for UI visibility.
 */

import { useMemo } from 'react';
import type { NavItem } from '@/types';

/**
 * Hook to filter navigation items based on RBAC (fully client-side)
 * Without Clerk auth, returns all items (no RBAC filtering).
 *
 * @param items - Array of navigation items to filter
 * @returns Filtered items
 */
export function useFilteredNavItems(items: NavItem[]) {
  const filteredItems = useMemo(() => {
    return items.map((item) => ({ ...item }));
  }, [items]);

  return filteredItems;
}
