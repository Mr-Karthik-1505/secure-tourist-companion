import { useBackendStatus } from '@/hooks/useBackendStatus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Server, Database, Cloud } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function BackendStatus() {
  const { connected, ipfs, blockchain, loading, error, checkStatus, baseUrl } = useBackendStatus();

  const getStatusColor = (status: 'ok' | 'error' | 'unknown') => {
    switch (status) {
      case 'ok':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 text-sm">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 cursor-help">
              <Server className="w-4 h-4" />
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs space-y-1">
              <p className="font-medium">Backend: {connected ? 'Connected' : 'Disconnected'}</p>
              <p className="text-muted-foreground">{baseUrl}</p>
              {error && <p className="text-red-400">{error}</p>}
            </div>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 cursor-help">
              <Cloud className="w-4 h-4" />
              <span className={`w-2 h-2 rounded-full ${getStatusColor(ipfs)}`} />
            </div>
          </TooltipTrigger>
          <TooltipContent>IPFS: {ipfs}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 cursor-help">
              <Database className="w-4 h-4" />
              <span className={`w-2 h-2 rounded-full ${getStatusColor(blockchain)}`} />
            </div>
          </TooltipTrigger>
          <TooltipContent>Blockchain: {blockchain}</TooltipContent>
        </Tooltip>

        <Button
          variant="ghost"
          size="sm"
          onClick={checkStatus}
          disabled={loading}
          className="h-6 w-6 p-0"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </TooltipProvider>
  );
}
