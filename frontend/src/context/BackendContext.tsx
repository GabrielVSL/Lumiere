import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { checkBackendHealth, FASTAPI_HEALTH_URL } from '../services/api';

export type BackendStatus = 'waking' | 'ready' | 'error';

interface BackendContextType {
  status: BackendStatus;
  isColdBoot: boolean;
  elapsedSeconds: number;
  retryWakeup: () => void;
}

const BackendContext = createContext<BackendContextType | undefined>(undefined);

export function BackendProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<BackendStatus>('waking');
  const [isColdBoot, setIsColdBoot] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [attemptCycle, setAttemptCycle] = useState<number>(0);

  const cycleRef = useRef<number>(0);

  const retryWakeup = useCallback(() => {
    setStatus('waking');
    setIsColdBoot(true);
    setElapsedSeconds(0);
    setAttemptCycle((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const currentCycle = ++cycleRef.current;
    let isMounted = true;
    const startTime = Date.now();

    const isLocalBackend =
      FASTAPI_HEALTH_URL.includes('localhost') || FASTAPI_HEALTH_URL.includes('127.0.0.1');

    // Evita piscar a tela de cold boot se o servidor já estiver acordado (< 1.2s)
    const coldBootTimer = setTimeout(() => {
      if (isMounted && cycleRef.current === currentCycle) {
        setIsColdBoot(true);
      }
    }, 1200);

    const tickInterval = setInterval(() => {
      if (!isMounted || cycleRef.current !== currentCycle) return;
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    const wakeUp = async () => {
      // Em produção (Render), tenta até ~105s para acomodar o cold boot completo
      const maxAttempts = isLocalBackend ? 3 : 6;
      const attemptTimeout = isLocalBackend ? 3500 : 18000;
      const retryDelay = isLocalBackend ? 1200 : 2500;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (!isMounted || cycleRef.current !== currentCycle) return;

        const isUp = await checkBackendHealth(attemptTimeout);
        if (!isMounted || cycleRef.current !== currentCycle) return;

        if (isUp) {
          clearTimeout(coldBootTimer);
          clearInterval(tickInterval);
          setStatus('ready');
          return;
        }

        // Se a primeira tentativa falhou (ex: 502/503 enquanto o container sobe), sinaliza cold boot
        setIsColdBoot(true);

        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }

      if (!isMounted || cycleRef.current !== currentCycle) return;
      clearTimeout(coldBootTimer);
      clearInterval(tickInterval);
      setStatus('error');
    };

    wakeUp();

    return () => {
      isMounted = false;
      clearTimeout(coldBootTimer);
      clearInterval(tickInterval);
    };
  }, [attemptCycle]);

  return (
    <BackendContext.Provider value={{ status, isColdBoot, elapsedSeconds, retryWakeup }}>
      {children}
    </BackendContext.Provider>
  );
}

export function useBackend() {
  const ctx = useContext(BackendContext);
  if (!ctx) {
    throw new Error('useBackend deve ser usado dentro de um BackendProvider');
  }
  return ctx;
}
