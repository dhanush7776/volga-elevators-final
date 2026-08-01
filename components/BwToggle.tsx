'use client';

import { Contrast } from 'lucide-react';
import { useBwMode } from '@/lib/bw-context';

export function BwToggle() {
  const { bwMode, toggleBwMode } = useBwMode();

  return (
    <button
      onClick={toggleBwMode}
      className="btn-ghost"
      aria-label="Toggle black and white background"
      title={bwMode ? 'Restore original background' : 'Switch to black & white background'}
    >
      <Contrast size={16} />
    </button>
  );
}
