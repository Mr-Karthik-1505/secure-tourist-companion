// KYC API Service - connects to external backend

import { apiRequest } from './client';
import { API_CONFIG } from './config';
import type {
  KYCUploadRequest,
  KYCUploadResponse,
  KYCRevokeRequest,
  KYCRevokeResponse,
  KYCRecord,
  KYCUnpinRequest,
  KYCUnpinResponse,
  ApiResponse,
} from './types';

/**
 * Upload KYC document and record on-chain
 * POST /api/kyc/upload (multipart/form-data)
 */
export async function uploadKYC(
  request: KYCUploadRequest
): Promise<ApiResponse<KYCUploadResponse>> {
  const formData = new FormData();
  formData.append('file', request.file);
  formData.append('userAddress', request.userAddress);
  
  if (request.encryptMode) {
    formData.append('encryptMode', request.encryptMode);
  }
  
  if (request.meta) {
    formData.append('meta', JSON.stringify(request.meta));
  }
  
  return apiRequest<KYCUploadResponse>(API_CONFIG.ENDPOINTS.KYC_UPLOAD, {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
}

/**
 * Revoke KYC on-chain
 * POST /api/kyc/revoke
 */
export async function revokeKYC(
  request: KYCRevokeRequest
): Promise<ApiResponse<KYCRevokeResponse>> {
  return apiRequest<KYCRevokeResponse>(API_CONFIG.ENDPOINTS.KYC_REVOKE, {
    method: 'POST',
    body: request,
  });
}

/**
 * Get KYC record by user address
 * GET /api/kyc/:userAddress
 */
export async function getKYC(
  userAddress: string
): Promise<ApiResponse<KYCRecord>> {
  return apiRequest<KYCRecord>(`${API_CONFIG.ENDPOINTS.KYC_GET}/${userAddress}`);
}

/**
 * Unpin IPFS content (admin only)
 * POST /api/kyc/unpin
 */
export async function unpinKYC(
  request: KYCUnpinRequest
): Promise<ApiResponse<KYCUnpinResponse>> {
  return apiRequest<KYCUnpinResponse>(API_CONFIG.ENDPOINTS.KYC_UNPIN, {
    method: 'POST',
    body: request,
  });
}
