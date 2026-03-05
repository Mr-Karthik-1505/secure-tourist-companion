import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
    canViewDigitalId: true, canReceiveAlerts: true, canEmergencyAccess: true,
    canUploadKyc: false, canRevokeKyc: false, canManageGeofence: false,
    canRespondIncidents: false, canViewAuditLogs: false, canAccessControlRoom: false, canSystemConfig: false,
  },
  verifier: {
    canViewDigitalId: true, canReceiveAlerts: true, canEmergencyAccess: true,
    canUploadKyc: true, canRevokeKyc: true, canManageGeofence: false,
    canRespondIncidents: false, canViewAuditLogs: false, canAccessControlRoom: false, canSystemConfig: false,
  },
  authority: {
    canViewDigitalId: true, canReceiveAlerts: true, canEmergencyAccess: true,
    canUploadKyc: false, canRevokeKyc: false, canManageGeofence: true,
    canRespondIncidents: true, canViewAuditLogs: false, canAccessControlRoom: true, canSystemConfig: false,
  },
  admin: {
    canViewDigitalId: true, canReceiveAlerts: true, canEmergencyAccess: true,
    canUploadKyc: true, canRevokeKyc: true, canManageGeofence: true,
    canRespondIncidents: true, canViewAuditLogs: true, canAccessControlRoom: true, canSystemConfig: true,
  },
};

interface RoleContextType {
  currentRole: UserRole;
  permissions: RolePermissions;
  hasPermission: (permission: keyof RolePermissions) => boolean;
  isRole: (role: UserRole) => boolean;
  isAtLeast: (role: UserRole) => boolean;
  isAuthenticated: boolean;
  userId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const roleHierarchy: UserRole[] = ['tourist', 'verifier', 'authority', 'admin'];

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>('tourist');
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch role from database
  const fetchUserRole = useCallback(async (uid: string) => {
    try {
      const { data, error } = await supabase.rpc('get_user_role', { _user_id: uid });
      if (!error && data) {
        setCurrentRole(data as UserRole);
      } else {
        setCurrentRole('tourist'); // Default fallback
      }
    } catch {
      setCurrentRole('tourist');
    }
  }, []);

  useEffect(() => {
    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        setIsAuthenticated(true);
        // Use setTimeout to avoid Supabase deadlock
        setTimeout(() => fetchUserRole(session.user.id), 0);
      } else {
        setUserId(null);
        setIsAuthenticated(false);
        setCurrentRole('tourist');
      }
      setLoading(false);
    });

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        setIsAuthenticated(true);
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserRole]);

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

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <RoleContext.Provider
      value={{ currentRole, permissions, hasPermission, isRole, isAtLeast, isAuthenticated, userId, loading, signOut }}
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
