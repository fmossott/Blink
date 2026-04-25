import { useState, useEffect, useCallback } from 'react';

export function useIdleDetection() {
  const [isIdle, setIsIdle] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('IdleDetector' in window) {
      setIsSupported(true);
      // Check existing permission silently if possible, but usually requires request
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('IdleDetector' in window)) {
      setPermissionGranted(true); // Fallback mode
      return true;
    }
    
    try {
      const state = await window.IdleDetector.requestPermission();
      if (state === 'granted') {
        setPermissionGranted(true);
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  }, []);

  useEffect(() => {
    let detector: any = null;
    let abortController = new AbortController();

    const setupIdleDetector = async () => {
      if ('IdleDetector' in window && permissionGranted) {
        try {
          detector = new window.IdleDetector();
          detector.addEventListener('change', () => {
            const userState = detector.userState;
            const screenState = detector.screenState;
            
            // User is considered idle if they are idle or screen is locked
            if (userState === 'idle' || screenState === 'locked') {
              setIsIdle(true);
            } else {
              setIsIdle(false);
            }
          });

          await detector.start({
            threshold: 60000, // 1 minute threshold for testing, we can adjust this
            signal: abortController.signal,
          });
        } catch (err) {
          console.error('IdleDetector start failed:', err);
        }
      }
    };

    if (permissionGranted && isSupported) {
      setupIdleDetector();
    }

    return () => {
      abortController.abort();
    };
  }, [permissionGranted, isSupported]);

  // Fallback for browsers without IdleDetector (Firefox, Safari)
  useEffect(() => {
    if (isSupported && permissionGranted) return; // Don't use fallback if native is working

    let timeoutId: number;
    const idleThreshold = 60000; // 1 minute

    const handleActivity = () => {
      if (isIdle) setIsIdle(false);
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => setIsIdle(true), idleThreshold);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsIdle(true);
      } else {
        handleActivity();
      }
    };

    if (permissionGranted || !isSupported) {
       window.addEventListener('mousemove', handleActivity);
       window.addEventListener('keydown', handleActivity);
       window.addEventListener('click', handleActivity);
       document.addEventListener('visibilitychange', handleVisibilityChange);
       handleActivity(); // Init
    }

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearTimeout(timeoutId);
    };
  }, [isIdle, isSupported, permissionGranted]);

  return { isIdle, requestPermission, permissionGranted, isSupported };
}
