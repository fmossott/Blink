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
  const timerRef = useRef<number | null>(null);

  // Synchronize time left when settings change, but only if we are in work mode
  useEffect(() => {
    if (mode === 'work') {
       setTimeLeft(workDurationMs);
    }
  }, [workDurationMs]);

  const sendNotification = useCallback((title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/vite.svg' });
    }
  }, []);

  useEffect(() => {
    if (!permissionGranted) return;

    if (isIdle) {
      // Reset and pause timer when idle
      setMode('work');
      setTimeLeft(workDurationMs);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          // Timer ended
          if (mode === 'work') {
            sendNotification('Time to Blink!', 'Look away from the screen and blink your eyes for 20 seconds.');
            setMode('blink');
            return blinkDurationMs;
          } else {
            sendNotification('Back to Work!', 'Your eyes are rested. You can look back at the screen now.');
            setMode('work');
            return workDurationMs;
          }
        }
        return prev - 1000;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isIdle, mode, workDurationMs, blinkDurationMs, permissionGranted, sendNotification]);

  const resetTimer = useCallback(() => {
    setMode('work');
    setTimeLeft(workDurationMs);
  }, [workDurationMs]);

  return { timeLeft, mode, resetTimer };
}
