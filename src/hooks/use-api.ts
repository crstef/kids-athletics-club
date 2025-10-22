import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

type DataLoader<T> = () => Promise<T>;
type DataSetter<T> = (data: T) => Promise<T>;
type DataDeleter = (id: string) => Promise<void>;

interface UseApiOptions<T> {
  autoFetch?: boolean;
  onError?: (error: Error) => void;
}

export function useApi<T>(
  key: string,
  initialValue: T,
  options: UseApiOptions<T> = {}
): [T, (valueOrFn: T | ((current: T) => T)) => void, boolean, Error | null, () => Promise<void>] {
  const { autoFetch = false, onError } = options; // Changed default to false
  const { currentUser, loading: authLoading } = useAuth();
  const [data, setDataState] = useState<T>(initialValue);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<Error | null>(null);
  const [hasFetched, setHasFetched] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let result: any;
      
      switch (key) {
        case 'users':
          result = await apiClient.getUsers();
          break;
        case 'athletes':
          result = await apiClient.getAthletes();
          break;
        case 'results':
          result = await apiClient.getResults();
          break;
        case 'events':
          result = await apiClient.getEvents();
          break;
        case 'access-requests':
          result = await apiClient.getAccessRequests();
          break;
        case 'messages':
          result = await apiClient.getMessages();
          break;
        case 'permissions':
          result = await apiClient.getPermissions();
          break;
        case 'roles':
          result = await apiClient.getRoles();
          break;
        case 'approval-requests':
          result = await apiClient.getApprovalRequests();
          break;
        case 'age-categories':
          result = await apiClient.getAgeCategories();
          break;
        case 'coach-probes':
          result = await apiClient.getProbes();
          break;
        case 'user-permissions':
          result = await apiClient.getUserPermissions();
          break;
        default:
          result = initialValue;
      }
      
      setDataState(result);
      setHasFetched(true);
    } catch (err) {
      const error = err as Error;
      setError(error);
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  }, [key, initialValue, onError]);

  useEffect(() => {
    // Only fetch if autoFetch is true, auth is not loading, user is logged in, and we haven't fetched yet
    if (autoFetch && !authLoading && currentUser && !hasFetched) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, authLoading, currentUser, hasFetched]);

  const setData = useCallback((valueOrFn: T | ((current: T) => T)) => {
    setDataState(prevData => {
      const newData = typeof valueOrFn === 'function' 
        ? (valueOrFn as (current: T) => T)(prevData) 
        : valueOrFn;
      return newData;
    });
  }, []);

  const forceRefetch = useCallback(() => {
    // Just call fetchData directly - it will update hasFetched after fetch completes
    return fetchData();
  }, [fetchData]);

  return [data, setData, loading, error, forceRefetch];
}

// Specialized hooks for specific data types
// Note: autoFetch is now false by default, so data must be fetched manually by calling the returned refetch function
// CRITICAL: Only autoFetch for absolutely essential data to avoid ERR_INSUFFICIENT_RESOURCES
export function useUsers() {
  return useApi<any[]>('users', []); // Lazy load - only when needed
}

export function useAthletes() {
  return useApi<any[]>('athletes', []); // Lazy load with delay after login
}

export function useResults() {
  return useApi<any[]>('results', []); // Lazy load with delay after login
}

export function useEvents() {
  return useApi<any[]>('events', []); // Lazy load - only when tab clicked
}

export function useAccessRequests() {
  return useApi<any[]>('access-requests', []); // Lazy load - only when tab clicked
}

export function useMessages() {
  return useApi<any[]>('messages', []); // Lazy load - only when tab clicked
}

export function usePermissions() {
  return useApi<any[]>('permissions', []); // Lazy load - only when permissions panel opened
}

export function useRoles() {
  return useApi<any[]>('roles', []); // Lazy load - only when permissions panel opened
}

export function useApprovalRequests() {
  return useApi<any[]>('approval-requests', []); // Lazy load - only when tab clicked
}

export function useAgeCategories() {
  return useApi<any[]>('age-categories', []); // Lazy load - only when add athlete dialog opened
}

export function useUserPermissions() {
  return useApi<any[]>('user-permissions', []); // Lazy load - only when permissions panel opened
}
