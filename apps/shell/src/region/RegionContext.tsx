import React, { createContext, useContext, useMemo, useState } from 'react';
import type { RegionalConfiguration, RegionCode } from '@platform/contracts';
import { getRegionalConfiguration } from './regions';

interface RegionContextValue {
  config: RegionalConfiguration;
  setRegion: (region: RegionCode) => void;
}

const RegionContext = createContext<RegionContextValue | undefined>(undefined);

export function RegionProvider({ children, onRegionChange }: React.PropsWithChildren<{
  onRegionChange?: (region: RegionCode) => void;
}>) {
  const [region, setRegionState] = useState<RegionCode>('SG');

  const value = useMemo<RegionContextValue>(
    () => ({
      config: getRegionalConfiguration(region),
      setRegion: (next: RegionCode) => {
        setRegionState(next);
        onRegionChange?.(next);
      }
    }),
    [region] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}

export function useRegion(): RegionContextValue {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error('useRegion must be used within RegionProvider');
  return ctx;
}
