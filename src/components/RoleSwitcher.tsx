import { useRole, UserRole } from '@/contexts/RoleContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield, User, CheckCircle, Building2 } from 'lucide-react';

const roleConfig: Record<UserRole, { label: string; icon: React.ElementType; color: string }> = {
  tourist: { label: 'Tourist', icon: User, color: 'bg-blue-500' },
  verifier: { label: 'Verifier', icon: CheckCircle, color: 'bg-amber-500' },
  authority: { label: 'Authority', icon: Building2, color: 'bg-primary' },
  admin: { label: 'Admin', icon: Shield, color: 'bg-destructive' },
};

export function RoleSwitcher() {
  const { currentRole, setRole } = useRole();
  const config = roleConfig[currentRole];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="gap-1.5 py-1">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">{config.label}</span>
      </Badge>
      <Select value={currentRole} onValueChange={(value) => setRole(value as UserRole)}>
        <SelectTrigger 
          className="w-[130px] h-8 text-xs" 
          aria-label="Switch user role"
        >
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(roleConfig).map(([role, { label, icon: RoleIcon }]) => (
            <SelectItem key={role} value={role} className="text-xs">
              <div className="flex items-center gap-2">
                <RoleIcon className="w-3.5 h-3.5" />
                {label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
