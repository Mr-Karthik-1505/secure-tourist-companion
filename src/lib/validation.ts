import { z } from 'zod';

// Registration form validation
export const registrationStep1Schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s.\-']+$/, "Name contains invalid characters"),
  passport: z.string().trim().min(1, "Passport/Aadhaar is required").max(20, "ID number too long")
    .regex(/^[A-Z0-9]+$/i, "Invalid ID format"),
  country: z.string().min(1, "Country is required"),
});

export const registrationStep2Schema = z.object({
  arrivalDate: z.string().min(1, "Arrival date is required"),
  departureDate: z.string().min(1, "Departure date is required"),
  accommodation: z.string().max(200, "Accommodation name too long").optional(),
  emergencyName: z.string().trim().min(1, "Emergency contact name is required").max(100, "Name too long"),
  emergencyPhone: z.string().trim().min(1, "Emergency contact phone is required")
    .regex(/^\+?[0-9\s\-()]{7,20}$/, "Invalid phone number format"),
  emergencyRelation: z.string().max(50, "Relationship too long").optional(),
}).refine(data => {
  if (data.arrivalDate && data.departureDate) {
    return new Date(data.departureDate) > new Date(data.arrivalDate);
  }
  return true;
}, { message: "Departure date must be after arrival date", path: ["departureDate"] });

// KYC Dashboard validation
export const ethereumAddressSchema = z.string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format");

// File validation
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'application/json'];

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large. Maximum size is 10MB.` };
  }
  if (!ALLOWED_FILE_TYPES.includes(file.type) && !file.name.match(/\.(pdf|json)$/i)) {
    return { valid: false, error: 'Only PDF and JSON files are allowed.' };
  }
  return { valid: true };
}

// Search query sanitization
export function sanitizeSearchQuery(query: string): string {
  return query.replace(/[<>'";&]/g, '').trim().slice(0, 200);
}
