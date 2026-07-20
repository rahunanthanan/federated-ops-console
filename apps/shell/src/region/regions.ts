import type { RegionalConfiguration, RegionCode } from '@platform/contracts';
import { SUPPORTED_REGIONS } from '@platform/contracts';

export { SUPPORTED_REGIONS };

/**
 * Static seed data standing in for a runtime-loaded, schema-validated config
 * service. In production this would be fetched per-region from a config
 * endpoint and validated with Zod before being applied - never hard-coded
 * like this. Kept inline here to keep the MVP self-contained.
 */
const REGIONAL_CONFIG: Record<RegionCode, RegionalConfiguration> = {
  SG: {
    region: 'SG',
    locale: 'en-SG',
    currency: 'SGD',
    timeZone: 'Asia/Singapore',
    apiBaseUrl: 'https://api.sg.daas.example',
    regulatoryNoticeKey: 'notice.sg.mas',
    features: { advancedApproval: true, bulkOperations: true, analyticsDashboard: true },
    approvalThreshold: 50000,
    configVersion: '2026.07.1'
  },
  MY: {
    region: 'MY',
    locale: 'en-MY',
    currency: 'MYR',
    timeZone: 'Asia/Kuala_Lumpur',
    apiBaseUrl: 'https://api.my.daas.example',
    regulatoryNoticeKey: 'notice.my.bnm',
    features: { advancedApproval: true, bulkOperations: false, analyticsDashboard: true },
    approvalThreshold: 150000,
    configVersion: '2026.07.1'
  },
  HK: {
    region: 'HK',
    locale: 'en-HK',
    currency: 'HKD',
    timeZone: 'Asia/Hong_Kong',
    apiBaseUrl: 'https://api.hk.daas.example',
    regulatoryNoticeKey: 'notice.hk.hkma',
    features: { advancedApproval: false, bulkOperations: true, analyticsDashboard: false },
    approvalThreshold: 300000,
    configVersion: '2026.07.1'
  }
};

export function getRegionalConfiguration(region: RegionCode): RegionalConfiguration {
  return REGIONAL_CONFIG[region];
}
