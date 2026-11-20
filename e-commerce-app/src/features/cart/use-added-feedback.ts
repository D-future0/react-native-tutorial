import { useCallback, useEffect, useRef, useState } from 'react';

export function useAddedFeedback(duration = 1800) {
  const [isAdded, setIsAdded] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAdded = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }

    setIsAdded(true);
    timeout.current = setTimeout(() => {
      setIsAdded(false);
      timeout.current = null;
    }, duration);
  }, [duration]);

  useEffect(
    () => () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    },
    [],
  );

  return { isAdded, showAdded };
}
