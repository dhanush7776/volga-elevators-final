'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface BwContextType {
  bwMode: boolean;
  toggleBwMode: () => void;
}

const BwContext = createContext<BwContextType | undefined>(undefined);

export function BwProvider({ children }: { children: ReactNode }) {
  const [bwMode, setBwMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('volga-bw-mode');
    const initial = stored === 'true';
    setBwMode(initial);
    document.documentElement.classList.toggle('bw-mode', initial);
  }, []);

  const toggleBwMode = () => {
    const next = !bwMode;
    setBwMode(next);
    document.documentElement.classList.toggle('bw-mode', next);
    localStorage.setItem('volga-bw-mode', String(next));
  };

  return (
    <BwContext.Provider value={{ bwMode, toggleBwMode }}>
      {children}
    </BwContext.Provider>
  );
}

export function useBwMode() {
  const ctx = useContext(BwContext);
  if (!ctx) throw new Error('useBwMode must be used within a BwProvider');
  return ctx;
}
