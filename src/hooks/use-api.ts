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
  const { autoFetch = true, onError } = options;
  const { currentUser, loading: authLoading } = useAuth();
  const [data, setDataState] = useState<T>(initialValue);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<Error | null>(null);

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
    } catch (err) {
      const error = err as Error;
      setError(error);
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  }, [key, initialValue, onError]);

  useEffect(() => {
    // Only fetch if autoFetch is true, auth is not loading, and a user is logged in.
    if (autoFetch && !authLoading && currentUser) {
      fetchData();
    }
  }, [fetchData, autoFetch, authLoading, currentUser]);

  const setData = useCallback((valueOrFn: T | ((current: T) => T)) => {
    setDataState(prevData => {
      const newData = typeof valueOrFn === 'function' 
        ? (valueOrFn as (current: T) => T)(prevData) 
        : valueOrFn;
      return newData;
    });
  }, []);

  return [data, setData, loading, error, fetchData];
}

// Specialized hooks for specific data types
export function useUsers() {
  return useApi<any[]>('users', []);
}

export function useAthletes() {
  return useApi<any[]>('athletes', []);
}

export function useResults() {
  return useApi<any[]>('results', []);
}

export function useEvents() {
  return useApi<any[]>('events', []);
}

export function useAccessRequests() {
  return useApi<any[]>('access-requests', []);
}

export function useMessages() {
  return useApi<any[]>('messages', []);
}

export function usePermissions() {
  return useApi<any[]>('permissions', []);
}

export function useRoles() {
  return useApi<any[]>('roles', []);
}

export function useApprovalRequests() {
  return useApi<any[]>('approval-requests', []);
}

export function useAgeCategories() {
  return useApi<any[]>('age-categories', []);
}

export function useProbes() {
  return useApi<any[]>('coach-probes', []);
}

export function useUserPermissions() {
  return useApi<any[]>('user-permissions', []);
}
