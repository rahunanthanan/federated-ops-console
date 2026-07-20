/**
 * Region contract. RegionCode is the single source of truth used across shell,
 * remotes and shared packages - never re-declared locally (multi-region/multi-channel).
 */
export type RegionCode = 'SG' | 'MY' | 'HK';

export const SUPPORTED_REGIONS: readonly RegionCode[] = ['SG', 'MY', 'HK'] as const;

export interface RegionalConfiguration {
  region: RegionCode;
  locale: string;
  currency: string;
  timeZone: string;
  apiBaseUrl: string;
  regulatoryNoticeKey: string;
  features: {
    advancedApproval: boolean;
    bulkOperations: boolean;
    analyticsDashboard: boolean;
  };
  approvalThreshold: number;
  /** Config version travels with diagnostics so a bad rollout is traceable. */
  configVersion: string;
}

export function isRegionCode(value: unknown): value is RegionCode {
  return typeof value === 'string' && (SUPPORTED_REGIONS as readonly string[]).includes(value);
}
