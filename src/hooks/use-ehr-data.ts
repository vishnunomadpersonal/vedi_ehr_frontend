// ============================================================================
// Vedi EHR — Data Hooks (Refine-free replacements)
// Drop-in hooks for useList, useShow, useCreate, useUpdate, useDelete
// ============================================================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '@/lib/ehr-api';
import type { ListParams } from '@/lib/ehr-api';

// ── useEhrList ───────────────────────────────────────────────────────────────

interface UseListOptions {
  resource: string;
  pagination?: { currentPage?: number; pageSize?: number };
  filters?: ListParams['filters'];
  sorters?: ListParams['sorters'];
  enabled?: boolean;
}

interface UseListResult<T> {
  /** Compat with Refine: result.data is the items array */
  result: { data: T[]; total: number } | undefined;
  /** Query-like status */
  query: {
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => void;
  };
}

export function useEhrList<T = Record<string, unknown>>(
  options: UseListOptions
): UseListResult<T> {
  const { resource, pagination, filters, sorters, enabled = true } = options;
  const [data, setData] = useState<{ data: T[]; total: number } | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!enabled || !api.hasBackend(resource)) {
      setIsLoading(false);
      setData({ data: [], total: 0 });
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.getList<T>(resource, {
        page: pagination?.currentPage,
        pageSize: pagination?.pageSize,
        filters,
        sorters
      });
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setData({ data: [], total: 0 });
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    resource,
    pagination?.currentPage,
    pagination?.pageSize,
    JSON.stringify(filters),
    JSON.stringify(sorters),
    enabled
  ]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  return {
    result: data,
    query: {
      isLoading,
      isError: !!error,
      error,
      refetch: fetchData
    }
  };
}

// ── useEhrShow ───────────────────────────────────────────────────────────────

interface UseShowOptions {
  resource: string;
  id: string | number;
  queryOptions?: { enabled?: boolean };
}

interface UseShowResult<T> {
  query: {
    data: { data: T } | undefined;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => void;
  };
}

export function useEhrShow<T = Record<string, unknown>>(
  options: UseShowOptions
): UseShowResult<T> {
  const { resource, id, queryOptions } = options;
  const enabled = queryOptions?.enabled !== false && !!id;
  const [data, setData] = useState<T | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!enabled || !api.hasBackend(resource)) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.getOne<T>(resource, id);
      if (mountedRef.current) setData(result);
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [resource, id, enabled]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  return {
    query: {
      data: data ? { data } : undefined,
      isLoading,
      isError: !!error,
      error,
      refetch: fetchData
    }
  };
}

// ── useEhrCreate ─────────────────────────────────────────────────────────────

interface MutationCallbacks<T = unknown> {
  onSuccess?: (data: { data: T }) => void;
  onError?: (err: Error) => void;
}

interface UseCreateResult<T> {
  mutate: (
    params: { resource: string; values: Record<string, unknown> },
    callbacks?: MutationCallbacks<T>
  ) => void;
  mutation: { isPending: boolean };
}

export function useEhrCreate<
  T = Record<string, unknown>
>(): UseCreateResult<T> {
  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(
    async (
      params: { resource: string; values: Record<string, unknown> },
      callbacks?: MutationCallbacks<T>
    ) => {
      setIsPending(true);
      try {
        const data = await api.create<T>(params.resource, params.values);
        callbacks?.onSuccess?.({ data });
      } catch (err) {
        callbacks?.onError?.(
          err instanceof Error ? err : new Error(String(err))
        );
      } finally {
        setIsPending(false);
      }
    },
    []
  );

  return { mutate, mutation: { isPending } };
}

// ── useEhrUpdate ─────────────────────────────────────────────────────────────

interface UseUpdateResult<T = Record<string, unknown>> {
  mutate: (
    params: {
      resource: string;
      id: string | number;
      values: Record<string, unknown>;
    },
    callbacks?: MutationCallbacks<T>
  ) => void;
  mutation: { isPending: boolean };
}

export function useEhrUpdate<
  T = Record<string, unknown>
>(): UseUpdateResult<T> {
  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(
    async (
      params: {
        resource: string;
        id: string | number;
        values: Record<string, unknown>;
      },
      callbacks?: MutationCallbacks<T>
    ) => {
      setIsPending(true);
      try {
        const data = await api.update<T>(
          params.resource,
          params.id,
          params.values
        );
        callbacks?.onSuccess?.({ data });
      } catch (err) {
        callbacks?.onError?.(
          err instanceof Error ? err : new Error(String(err))
        );
      } finally {
        setIsPending(false);
      }
    },
    []
  );

  return { mutate, mutation: { isPending } };
}

// ── useEhrDelete ─────────────────────────────────────────────────────────────

interface UseDeleteResult {
  mutate: (
    params: { resource: string; id: string | number },
    callbacks?: MutationCallbacks<{ id: string | number }>
  ) => void;
  mutation: { isPending: boolean };
}

export function useEhrDelete(): UseDeleteResult {
  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(
    async (
      params: { resource: string; id: string | number },
      callbacks?: MutationCallbacks<{ id: string | number }>
    ) => {
      setIsPending(true);
      try {
        await api.deleteOne(params.resource, params.id);
        callbacks?.onSuccess?.({ data: { id: params.id } });
      } catch (err) {
        callbacks?.onError?.(
          err instanceof Error ? err : new Error(String(err))
        );
      } finally {
        setIsPending(false);
      }
    },
    []
  );

  return { mutate, mutation: { isPending } };
}
