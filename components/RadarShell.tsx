'use client';

import type { ReactNode } from 'react';
import { RadarProvider, useRadar } from '@/lib/useRadar';

export function RadarShell({ children }: { children: ReactNode }) {
  return <RadarProvider value={useRadar()}>{children}</RadarProvider>;
}
