import { useState, useCallback } from 'react';
import type { ApiError, QueryParams, PaginatedResponse } from '../types';
import { getErrorMessage } from '../utils';
import type { AxiosResponse } from 'axios';

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: unknown[]) => Promise<T | undefined>;
  reset: () => void;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

export function useApi<T>(
  apiCall: (...args: unknown[]) => Promise<AxiosResponse<T>>,
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | undefined> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const response = await apiCall(...args);
        setState({ data: response.data, isLoading: false, error: null });
        return response.data;
      } catch (err) {
        const message = getErrorMessage(err);
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
        throw err;
      }
    },
    [apiCall],
  );

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  const setData: React.Dispatch<React.SetStateAction<T | null>> = useCallback(
    (updater) => {
      setState((prev) => ({
        ...prev,
        data: typeof updater === 'function'
          ? (updater as (prev: T | null) => T | null)(prev.data)
          : updater,
      }));
    },
    [],
  );

  return { ...state, execute, reset, setData };
}

/* ── Paginated API Hook ──────────────────────────────────────── */
interface UsePaginatedReturn<T> {
  data: PaginatedResponse<T> | null;
  items: T[];
  isLoading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  params: QueryParams;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSearch: (search: string) => void;
  setFilters: (filters: Partial<QueryParams>) => void;
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  refresh: () => Promise<void>;
}

export function usePaginatedApi<T>(
  apiCall: (params: QueryParams) => Promise<AxiosResponse<PaginatedResponse<T>>>,
  initialParams: QueryParams = {},
): UsePaginatedReturn<T> {
  const [data, setData] = useState<PaginatedResponse<T> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<QueryParams>({
    page: 1,
    page_size: 10,
    ...initialParams,
  });

  const fetchData = useCallback(
    async (queryParams: QueryParams) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiCall(queryParams);
        setData(response.data);
      } catch (err) {
        setError(getErrorMessage(err as ApiError));
      } finally {
        setIsLoading(false);
      }
    },
    [apiCall],
  );

  const refresh = useCallback(async () => {
    await fetchData(params);
  }, [fetchData, params]);

  const updateParams = useCallback(
    (newParams: Partial<QueryParams>) => {
      setParams((prev) => {
        const updated = { ...prev, ...newParams };
        fetchData(updated);
        return updated;
      });
    },
    [fetchData],
  );

  const setPage = useCallback((page: number) => updateParams({ page }), [updateParams]);
  const setPageSize = useCallback((page_size: number) => updateParams({ page_size, page: 1 }), [updateParams]);
  const setSearch = useCallback((search: string) => updateParams({ search, page: 1 }), [updateParams]);
  const setFilters = useCallback(
    (filters: Partial<QueryParams>) => updateParams({ ...filters, page: 1 }),
    [updateParams],
  );
  const setSorting = useCallback(
    (sort_by: string, sort_order: 'asc' | 'desc') => updateParams({ sort_by, sort_order }),
    [updateParams],
  );

  return {
    data,
    items: data?.items ?? [],
    isLoading,
    error,
    page: data?.page ?? 1,
    pageSize: params.page_size ?? 10,
    total: data?.total ?? 0,
    totalPages: data?.total_pages ?? 0,
    params,
    setPage,
    setPageSize,
    setSearch,
    setFilters,
    setSorting,
    refresh,
  };
}
