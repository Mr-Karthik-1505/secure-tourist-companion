import { useRole, UserRole } from '@/contexts/RoleContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, User, CheckCircle, Building2, LogOut } from 'lucide-react';

const roleConfig: Record<UserRole, { label: string; icon: React.ElementType; color: string }> = {
  tourist: { label: 'Tourist', icon: User, color: 'bg-blue-500' },
  verifier: { label: 'Verifier', icon: CheckCircle, color: 'bg-amber-500' },
  authority: { label: 'Authority', icon: Building2, color: 'bg-primary' },
  admin: { label: 'Admin', icon: Shield, color: 'bg-destructive' },
};

export function RoleSwitcher() {
  const { currentRole, isAuthenticated, signOut } = useRole();
  const config = roleConfig[currentRole];
  const Icon = config.icon;

  if (!isAuthenticated) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="gap-1.5 py-1">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">{config.label}</span>
      </Badge>
      <Button variant="ghost" size="sm" onClick={signOut} className="h-8 text-xs gap-1.5">
        <LogOut className="w-3.5 h-3.5" />
        Sign Out
      </Button>
    </div>
  );
}
