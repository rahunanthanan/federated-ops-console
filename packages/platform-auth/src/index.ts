import type { AuthClient, AuthenticatedUser, RegionCode } from '@platform/contracts';

/**
 * Mock AuthClient used for local dev. A real implementation would wrap an
 * SSO/identity-provider token exchange and never expose raw tokens to
 * remote consumers - only the resolved AuthenticatedUser.
 */
const MOCK_USER: AuthenticatedUser = {
  id: 'usr-001',
  displayName: 'Regional Admin (Demo)',
  roles: ['regional-admin', 'supervisor'],
  authorisedRegions: ['SG', 'MY', 'HK']
};

const PERMISSION_MATRIX: Record<string, ReadonlyArray<AuthenticatedUser['roles'][number]>> = {
  'request.approve': ['supervisor', 'regional-admin'],
  'request.create': ['agent', 'supervisor', 'regional-admin'],
  'admin.configure': ['regional-admin'],
  'audit.read': ['auditor', 'regional-admin']
};

export function createMockAuthClient(user: AuthenticatedUser = MOCK_USER): AuthClient {
  return {
    async getUser() {
      return user;
    },
    hasPermission(permission: string, region: RegionCode) {
      if (!user.authorisedRegions.includes(region)) return false;
      const allowedRoles = PERMISSION_MATRIX[permission];
      if (!allowedRoles) return false;
      return user.roles.some((role) => allowedRoles.includes(role));
    },
    async signOut() {
      // no-op in mock; real client would revoke session + clear SSO cookies
    }
  };
}

export type { AuthClient, AuthenticatedUser } from '@platform/contracts';
