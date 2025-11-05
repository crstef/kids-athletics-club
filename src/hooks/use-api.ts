import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

const EMPTY_ARRAY: any[] = [];

interface UseApiOptions {
  autoFetch?: boolean;
  onError?: (error: Error) => void;
  requiredPermissions?: string | string[];
  skipIfUnauthorized?: boolean;
}

export function useApi<T>(
  key: string,
  initialValue: T,
  options: UseApiOptions = {}
): [
  T,
  (valueOrFn: T | ((current: T) => T)) => void,
  boolean,
  Error | null,
  () => Promise<void>,
  boolean
] {
  const {
    autoFetch = false,
    onError,
    requiredPermissions,
    skipIfUnauthorized = true
  } = options;

  const { currentUser, loading: authLoading, hasPermission } = useAuth();
  const initialValueRef = useRef(initialValue);
  const [data, setDataState] = useState<T>(initialValueRef.current);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<Error | null>(null);
  const [hasFetched, setHasFetched] = useState<boolean>(false);

  const requiredPermissionsSerialized = useMemo(() => {
    if (!requiredPermissions) return null;
    const normalized = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];
    try {
      return JSON.stringify(normalized);
    } catch {
      return null;
    }
  }, [requiredPermissions]);

  const requiredPermissionList = useMemo(() => {
    if (!requiredPermissionsSerialized) return null;
    try {
      return JSON.parse(requiredPermissionsSerialized) as string[];
    } catch {
      return null;
    }
  }, [requiredPermissionsSerialized]);

  const hasRequiredPermission = useMemo(() => {
    if (!requiredPermissionList || requiredPermissionList.length === 0) {
      return true;
    }

    if (!currentUser) {
      return false;
    }

    return requiredPermissionList.some((permission) => hasPermission(permission));
  }, [requiredPermissionList, currentUser, hasPermission]);

  const fetchData = useCallback(async () => {
    if (requiredPermissionList && !hasRequiredPermission) {
      if (skipIfUnauthorized) {
        setLoading(prev => (prev ? false : prev));
        setError(prev => (prev ? null : prev));
        setHasFetched(prev => (prev ? false : prev));
        setDataState(prev => (Object.is(prev, initialValueRef.current) ? prev : initialValueRef.current));
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      let result: any;

      switch (key) {
        case "users":
          result = await apiClient.getUsers();
          break;
        case "athletes":
          result = await apiClient.getAthletes();
          break;
        case "results":
          result = await apiClient.getResults();
          break;
        case "events":
        case "coach-probes":
          result = await apiClient.getEvents();
          break;
        case "access-requests":
          result = await apiClient.getAccessRequests();
          break;
        case "messages":
          result = await apiClient.getMessages();
          break;
        case "permissions":
          result = await apiClient.getPermissions();
          break;
        case "roles":
          result = await apiClient.getRoles();
          break;
        case "approval-requests":
          result = await apiClient.getApprovalRequests();
          break;
        case "age-categories":
          result = await apiClient.getAgeCategories();
          break;
        case "user-permissions":
          result = await apiClient.getUserPermissions();
          break;
        default:
          result = initialValueRef.current;
      }

      setDataState(result);
      setHasFetched(true);
    } catch (err) {
      const error = err as Error;
      setError(error);
      if (onError) onError(error);
      setHasFetched(true);
    } finally {
      setLoading(false);
    }
  }, [key, onError, hasRequiredPermission, requiredPermissionList, skipIfUnauthorized]);

  useEffect(() => {
    if (autoFetch && !authLoading && currentUser && !hasFetched && hasRequiredPermission) {
      fetchData();
    }
  }, [autoFetch, authLoading, currentUser, hasFetched, hasRequiredPermission, fetchData]);

  useEffect(() => {
    if (!authLoading && currentUser && requiredPermissionList && !hasRequiredPermission) {
      setDataState(prev => (Object.is(prev, initialValueRef.current) ? prev : initialValueRef.current));
      setHasFetched(prev => (prev ? false : prev));
      setLoading(prev => (prev ? false : prev));
      setError(prev => (prev ? null : prev));
    }
  }, [authLoading, currentUser, hasRequiredPermission, requiredPermissionList]);

  const setData = useCallback((valueOrFn: T | ((current: T) => T)) => {
    setDataState(prevData => {
      const newData =
        typeof valueOrFn === "function"
          ? (valueOrFn as (current: T) => T)(prevData)
          : valueOrFn;
      return newData;
    });
  }, []);

  const forceRefetch = useCallback(async () => {
    if (requiredPermissionList && !hasRequiredPermission) {
      if (skipIfUnauthorized) {
        setHasFetched(false);
        setLoading(false);
        setError(null);
        setDataState(initialValueRef.current);
        return Promise.resolve();
      }
    }

    setHasFetched(false);
    await new Promise(resolve => setTimeout(resolve, 0));
    return fetchData();
  }, [fetchData, hasRequiredPermission, requiredPermissionList, skipIfUnauthorized]);

  return [data, setData, loading, error, forceRefetch, hasFetched] as const;
}

export function usePublicCoaches(options: UseApiOptions = {}) {
  const { autoFetch = true, onError } = options;
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<Error | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.getPublicCoaches();
      setData(result);
      setHasFetched(true);
    } catch (err) {
      const error = err as Error;
      setError(error);
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    if (autoFetch && !hasFetched) {
      fetchData();
    }
  }, [autoFetch, hasFetched, fetchData]);

  const forceRefetch = useCallback(async () => {
    setHasFetched(false);
    await new Promise(resolve => setTimeout(resolve, 0));
    await fetchData();
  }, [fetchData]);

  return [data, setData, loading, error, forceRefetch, hasFetched] as const;
}

export function useUsers(options: UseApiOptions = {}) {
  return useApi<any[]>(
    'users',
    EMPTY_ARRAY,
    {
      autoFetch: true,
      requiredPermissions: ['users.view', 'users.view.all'],
      ...options
    }
  );
}

export function useAthletes(options: UseApiOptions = {}) {
  return useApi<any[]>(
    'athletes',
    EMPTY_ARRAY,
    {
      autoFetch: true,
      requiredPermissions: ['athletes.view', 'athletes.view.own'],
      ...options
    }
  );
}

export function useResults(options: UseApiOptions = {}) {
  return useApi<any[]>(
    'results',
    EMPTY_ARRAY,
    {
      autoFetch: true,
      requiredPermissions: ['results.view', 'results.view.own'],
      ...options
    }
  );
}

export function useEvents(options: UseApiOptions = {}) {
  return useApi<any[]>(
    'events',
    EMPTY_ARRAY,
    {
      autoFetch: true,
      requiredPermissions: ['events.view'],
      ...options
    }
  );
}

export function useAccessRequests(options: UseApiOptions = {}) {
  return useApi<any[]>(
    'access-requests',
    EMPTY_ARRAY,
    {
      autoFetch: true,
      requiredPermissions: ['access_requests.view', 'requests.view.all', 'requests.view.own'],
      ...options
    }
  );
}

export function useMessages(options: UseApiOptions = {}) {
  return useApi<any[]>(
    'messages',
    EMPTY_ARRAY,
    {
      autoFetch: true,
      requiredPermissions: ['messages.view'],
      ...options
    }
  );
}

export function usePermissions(options: UseApiOptions = {}) {
  return useApi<any[]>(
    'permissions',
    EMPTY_ARRAY,
    {
      autoFetch: true,
      requiredPermissions: ['permissions.view'],
      ...options
    }
  );
}

export function useRoles(options: UseApiOptions = {}) {
  return useApi<any[]>(
    'roles',
    EMPTY_ARRAY,
    {
      autoFetch: true,
      requiredPermissions: ['roles.view'],
      ...options
    }
  );
}

export function useApprovalRequests(options: UseApiOptions = {}) {
  return useApi<any[]>(
    'approval-requests',
    EMPTY_ARRAY,
    {
      autoFetch: true,
      requiredPermissions: ['approval_requests.view', 'requests.view.all', 'approval_requests.view.own', 'requests.view.own'],
      ...options
    }
  );
}

export function useAgeCategories(options: UseApiOptions = {}) {
  return useApi<any[]>(
    'age-categories',
    EMPTY_ARRAY,
    {
      autoFetch: true,
      requiredPermissions: ['age_categories.view'],
      ...options
    }
  );
}

export function useUserPermissions(options: UseApiOptions = {}) {
  return useApi<any[]>(
    'user-permissions',
    EMPTY_ARRAY,
    {
      autoFetch: true,
      requiredPermissions: ['user_permissions.view'],
      ...options
    }
  );
}
