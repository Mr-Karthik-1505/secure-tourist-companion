// API Response types matching backend contract

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// KYC Upload
export interface KYCUploadRequest {
  file: File;
  userAddress: string;
  encryptMode?: 'client' | 'server';
  meta?: {
    name?: string;
    idType?: string;
    source?: string;
  };
}

export interface KYCUploadResponse {
  cid: string;
  dataHash: string;
  txHash: string;
  timestamp: number;
}

// KYC Revoke
export interface KYCRevokeRequest {
  userAddress: string;
  reason?: string;
}

export interface KYCRevokeResponse {
  txHash: string;
}

// KYC Get
export interface KYCRecord {
  dataHash: string;
  cid: string;
  timestamp: number;
  revoked: boolean;
}

// KYC Unpin
export interface KYCUnpinRequest {
  cid: string;
}

export interface KYCUnpinResponse {
  success: boolean;
  unpinnedAt: number;
}

// Admin
export interface VerifierInfo {
  address: string;
  grantedAt: number;
  grantedBy: string;
}

export interface GrantVerifierRequest {
  address: string;
}

export interface RevokeVerifierRequest {
  address: string;
}

// Health
export interface HealthResponse {
  status: 'ok' | 'error';
  services: {
    ipfs: 'ok' | 'error';
    blockchain: 'ok' | 'error';
  };
}

// ZK Proof
export interface ZKVerifyRequest {
  proof: string;
  publicInputs: string[];
}

export interface ZKVerifyResponse {
  verified: boolean;
  timestamp: number;
}
