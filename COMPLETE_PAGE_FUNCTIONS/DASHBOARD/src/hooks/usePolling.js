import { useEffect, useRef } from 'react';

// ============================================================================
// POLLING HOOK
// ============================================================================

export const usePolling = (callback, interval, enabled = true) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => savedCallback.current();
    const id = setInterval(tick, interval);
    tick(); // Call immediately

    return () => clearInterval(id);
  }, [interval, enabled]);
};