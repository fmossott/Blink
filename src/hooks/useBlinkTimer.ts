import { useState, useEffect, useRef, useCallback } from 'react';

type Mode = 'work' | 'blink' | 'paused';

export function useBlinkTimer(
  isIdle: boolean,
  workDurationMs: number,
  blinkDurationMs: number,
  permissionGranted: boolean
) {
  const [timeLeft, setTimeLeft] = useState(workDurationMs);
  const [mode, setMode] = useState<Mode>('work');
  const endTimeRef = useRef<number | null>(null);

  // Synchronize time left when settings change, but only if we are in work mode
  useEffect(() => {
    if (mode === 'work') {
       setTimeLeft(workDurationMs);
       if (endTimeRef.current !== null) {
         endTimeRef.current = Date.now() + workDurationMs;
       }
    }
  }, [workDurationMs, mode]);

  const sendNotification = useCallback((title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/vite.svg', silent: false });
    }
  }, []);

  useEffect(() => {
    if (!permissionGranted) return;

    if (isIdle) {
      // Reset and pause timer when idle
      setMode('work');
      setTimeLeft(workDurationMs);
      endTimeRef.current = null;
      return;
    }

    // Initialize endTime if not set
    if (endTimeRef.current === null) {
      endTimeRef.current = Date.now() + (mode === 'work' ? workDurationMs : blinkDurationMs);
    }

    const interval = window.setInterval(() => {
      if (endTimeRef.current === null) return;

      const remaining = endTimeRef.current - Date.now();

      if (remaining <= 1000) {
        // Timer ended (using 1000ms threshold to handle background throttling jumps)
        if (mode === 'work') {
          sendNotification('Time to Blink!', 'Look away from the screen and blink your eyes for 20 seconds.');
          setMode('blink');
          endTimeRef.current = Date.now() + blinkDurationMs;
          setTimeLeft(blinkDurationMs);
        } else {
          sendNotification('Back to Work!', 'Your eyes are rested. You can look back at the screen now.');
          setMode('work');
          endTimeRef.current = Date.now() + workDurationMs;
          setTimeLeft(workDurationMs);
        }
      } else {
        setTimeLeft(remaining);
      }
    }, 500); // 500ms interval for smoother rendering

    return () => {
      clearInterval(interval);
    };
  }, [isIdle, mode, workDurationMs, blinkDurationMs, permissionGranted, sendNotification]);

  const resetTimer = useCallback(() => {
    setMode('work');
    setTimeLeft(workDurationMs);
    if (endTimeRef.current !== null) {
      endTimeRef.current = Date.now() + workDurationMs;
    }
  }, [workDurationMs]);

  return { timeLeft, mode, resetTimer };
}
