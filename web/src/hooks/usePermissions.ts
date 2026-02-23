import { useMemo } from "react";

const AUTH_TOKEN_KEY = "erp_assistant_token";

interface PermissionsState {
  roles: string[];
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

export function usePermissions(): PermissionsState {
  const decoded = useMemo(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return { roles: [] as string[], permissions: [] as string[] };

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return {
        roles: (payload.roles as string[]) || [],
        permissions: (payload.permissions as string[]) || [],
      };
    } catch {
      return { roles: [] as string[], permissions: [] as string[] };
    }
  }, []);

  const hasPermission = (permission: string): boolean =>
    decoded.permissions.includes(permission);

  const hasRole = (role: string): boolean => decoded.roles.includes(role);

  const hasAnyRole = (roles: string[]): boolean =>
    roles.some((role) => decoded.roles.includes(role));

  const hasAllPermissions = (permissions: string[]): boolean =>
    permissions.every((perm) => decoded.permissions.includes(perm));

  return {
    roles: decoded.roles,
    permissions: decoded.permissions,
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAllPermissions,
  };
}
