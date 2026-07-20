import type { RegionCode } from './region';

export type UserRole = 'regional-admin' | 'supervisor' | 'agent' | 'auditor' | 'support';

export interface AuthenticatedUser {
  id: string;
  displayName: string;
  roles: UserRole[];
  authorisedRegions: RegionCode[];
}

export interface AuthClient {
  getUser(): Promise<AuthenticatedUser>;
  hasPermission(permission: string, region: RegionCode): boolean;
  signOut(): Promise<void>;
}
