import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Debounced callback hook
 * Usage: const debouncedSave = useDebouncedCallback((data) => api.save(data), 1000);
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>();
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Auto-save hook with status indicator
 * Returns: [debouncedSave, saveStatus]
 * saveStatus: 'idle' | 'pending' | 'saving' | 'saved' | 'error'
 */
export function useAutoSave<T>(
  saveFn: (data: T) => Promise<void>,
  delay: number = 1000
): [(data: T) => void, string] {
  const [status, setStatus] = useState<'idle' | 'pending' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>();

  const debouncedSave = useDebouncedCallback(async (data: T) => {
    setStatus('saving');
    try {
      await saveFn(data);
      setStatus('saved');
      
      // Reset to idle after 2 seconds
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setStatus('error');
      
      // Reset to idle after 3 seconds
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setStatus('idle'), 3000);
    }
  }, delay);

  const triggerSave = useCallback((data: T) => {
    setStatus('pending');
    debouncedSave(data);
  }, [debouncedSave]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return [triggerSave, status];
}
