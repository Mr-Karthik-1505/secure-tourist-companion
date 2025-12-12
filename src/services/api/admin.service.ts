// Admin API Service - connects to external backend

import { apiRequest } from './client';
import { API_CONFIG } from './config';
import type {
  VerifierInfo,
  GrantVerifierRequest,
  RevokeVerifierRequest,
  HealthResponse,
  ZKVerifyRequest,
  ZKVerifyResponse,
  ApiResponse,
} from './types';

/**
 * Get list of verifiers
 * GET /api/admin/verifier
 */
export async function getVerifiers(): Promise<ApiResponse<VerifierInfo[]>> {
  return apiRequest<VerifierInfo[]>(API_CONFIG.ENDPOINTS.ADMIN_VERIFIERS);
}

/**
 * Grant verifier role to address
 * POST /api/admin/grant-verifier
 */
export async function grantVerifier(
  request: GrantVerifierRequest
): Promise<ApiResponse<{ txHash: string }>> {
  return apiRequest<{ txHash: string }>(API_CONFIG.ENDPOINTS.ADMIN_GRANT_VERIFIER, {
    method: 'POST',
    body: request,
  });
}

/**
 * Revoke verifier role from address
 * POST /api/admin/revoke-verifier
 */
export async function revokeVerifier(
  request: RevokeVerifierRequest
): Promise<ApiResponse<{ txHash: string }>> {
  return apiRequest<{ txHash: string }>(API_CONFIG.ENDPOINTS.ADMIN_REVOKE_VERIFIER, {
    method: 'POST',
    body: request,
  });
}

/**
 * Health check
 * GET /api/health
 */
export async function checkHealth(): Promise<ApiResponse<HealthResponse>> {
  return apiRequest<HealthResponse>(API_CONFIG.ENDPOINTS.HEALTH);
}

/**
 * Verify ZK proof (demo endpoint)
 * POST /api/zk/verify
 */
export async function verifyZKProof(
  request: ZKVerifyRequest
): Promise<ApiResponse<ZKVerifyResponse>> {
  return apiRequest<ZKVerifyResponse>(API_CONFIG.ENDPOINTS.ZK_VERIFY, {
    method: 'POST',
    body: request,
  });
}
