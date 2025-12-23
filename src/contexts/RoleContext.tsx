import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type UserRole = 'tourist' | 'verifier' | 'authority' | 'admin';

export interface RolePermissions {
  canViewDigitalId: boolean;
  canReceiveAlerts: boolean;
  canEmergencyAccess: boolean;
  canUploadKyc: boolean;
  canRevokeKyc: boolean;
  canManageGeofence: boolean;
  canRespondIncidents: boolean;
  canViewAuditLogs: boolean;
  canAccessControlRoom: boolean;
  canSystemConfig: boolean;
}

const rolePermissions: Record<UserRole, RolePermissions> = {
  tourist: {
    canViewDigitalId: true,
    canReceiveAlerts: true,
    canEmergencyAccess: true,
    canUploadKyc: false,
    canRevokeKyc: false,
    canManageGeofence: false,
    canRespondIncidents: false,
    canViewAuditLogs: false,
    canAccessControlRoom: false,
    canSystemConfig: false,
  },
  verifier: {
    canViewDigitalId: true,
    canReceiveAlerts: true,
    canEmergencyAccess: true,
    canUploadKyc: true,
    canRevokeKyc: true,
    canManageGeofence: false,
    canRespondIncidents: false,
    canViewAuditLogs: false,
    canAccessControlRoom: false,
    canSystemConfig: false,
  },
  authority: {
    canViewDigitalId: true,
    canReceiveAlerts: true,
    canEmergencyAccess: true,
    canUploadKyc: false,
    canRevokeKyc: false,
    canManageGeofence: true,
    canRespondIncidents: true,
    canViewAuditLogs: false,
    canAccessControlRoom: true,
    canSystemConfig: false,
  },
  admin: {
    canViewDigitalId: true,
    canReceiveAlerts: true,
    canEmergencyAccess: true,
    canUploadKyc: true,
    canRevokeKyc: true,
    canManageGeofence: true,
    canRespondIncidents: true,
    canViewAuditLogs: true,
    canAccessControlRoom: true,
    canSystemConfig: true,
  },
};

interface RoleContextType {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  permissions: RolePermissions;
  hasPermission: (permission: keyof RolePermissions) => boolean;
  isRole: (role: UserRole) => boolean;
  isAtLeast: (role: UserRole) => boolean;
}

const roleHierarchy: UserRole[] = ['tourist', 'verifier', 'authority', 'admin'];

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  // Default to tourist role - in real app this would come from authentication
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');

  const permissions = rolePermissions[currentRole];

  const hasPermission = useCallback(
    (permission: keyof RolePermissions) => permissions[permission],
    [permissions]
  );

  const isRole = useCallback(
    (role: UserRole) => currentRole === role,
    [currentRole]
  );

  const isAtLeast = useCallback(
    (role: UserRole) => {
      const currentIndex = roleHierarchy.indexOf(currentRole);
      const requiredIndex = roleHierarchy.indexOf(role);
      return currentIndex >= requiredIndex;
    },
    [currentRole]
  );

  const setRole = useCallback((role: UserRole) => {
    setCurrentRole(role);
    // In production, this would trigger a server-side validation
    console.log(`[MOCK] Role changed to: ${role}`);
  }, []);

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        setRole,
        permissions,
        hasPermission,
        isRole,
        isAtLeast,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}

// Higher-order component for role-based access
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission: keyof RolePermissions
) {
  return function RoleProtectedComponent(props: P) {
    const { hasPermission } = useRole();
    
    if (!hasPermission(requiredPermission)) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access this feature.</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
