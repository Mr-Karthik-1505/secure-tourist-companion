// KYC API Hook - handles KYC operations with loading/error states

import { useState, useCallback } from 'react';
import { uploadKYC, revokeKYC, getKYC } from '@/services/api';
import type { KYCUploadResponse, KYCRevokeResponse, KYCRecord } from '@/services/api/types';
import { useToast } from '@/hooks/use-toast';

interface UseKYCReturn {
  loading: boolean;
  error: string | null;
  upload: (userAddress: string, file: File, encryptMode?: 'client' | 'server') => Promise<KYCUploadResponse | null>;
  revoke: (userAddress: string, reason?: string) => Promise<KYCRevokeResponse | null>;
  fetchRecord: (userAddress: string) => Promise<KYCRecord | null>;
}

export function useKYC(): UseKYCReturn {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (
    userAddress: string,
    file: File,
    encryptMode: 'client' | 'server' = 'server'
  ): Promise<KYCUploadResponse | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await uploadKYC({
        userAddress,
        file,
        encryptMode,
      });
      
      if (response.success && response.data) {
        toast({
          title: "KYC Uploaded",
          description: `CID: ${response.data.cid.slice(0, 16)}...`,
        });
        return response.data;
      } else {
        const errMsg = 'Upload failed. Please try again.';
        setError(errMsg);
        toast({
          title: "Upload Failed",
          description: errMsg,
          variant: "destructive",
        });
        return null;
      }
    } catch (err) {
      const errMsg = 'An error occurred during upload. Please try again.';
      console.error('[KYC] Upload error:', err);
      setError(errMsg);
      toast({
        title: "Upload Error",
        description: errMsg,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const revoke = useCallback(async (
    userAddress: string,
    reason?: string
  ): Promise<KYCRevokeResponse | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await revokeKYC({ userAddress, reason });
      
      if (response.success && response.data) {
        toast({
          title: "KYC Revoked",
          description: `Transaction: ${response.data.txHash.slice(0, 16)}...`,
        });
        return response.data;
      } else {
        const errMsg = 'Revoke failed. Please try again.';
        setError(errMsg);
        toast({
          title: "Revoke Failed",
          description: errMsg,
          variant: "destructive",
        });
        return null;
      }
    } catch (err) {
      const errMsg = 'An error occurred during revocation. Please try again.';
      console.error('[KYC] Revoke error:', err);
      setError(errMsg);
      toast({
        title: "Revoke Error",
        description: errMsg,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchRecord = useCallback(async (
    userAddress: string
  ): Promise<KYCRecord | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getKYC(userAddress);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        const errMsg = 'Failed to fetch record. Please try again.';
        setError(errMsg);
        return null;
      }
    } catch (err) {
      const errMsg = 'An error occurred while fetching the record.';
      console.error('[KYC] Fetch error:', err);
      setError(errMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    upload,
    revoke,
    fetchRecord,
  };
}
