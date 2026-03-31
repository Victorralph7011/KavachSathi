import { z } from 'zod';

/**
 * KavachSathi Submission Schema
 * Zod validation for the 3-step Policy Center Registration
 */

// ─── Step 1: Persona ──────────────────────────────────────────
export const PersonaSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s.'-]+$/, 'Name can only contain letters, spaces, dots, hyphens'),
  
  platform: z.enum(['zomato', 'swiggy', 'uber'], {
    errorMap: () => ({ message: 'Select a platform' }),
  }),
  
  workerId: z
    .string()
    .min(4, 'Worker ID must be at least 4 characters')
    .max(20, 'Worker ID too long'),
  
  aadhaar: z
    .string()
    .length(12, 'Aadhaar must be exactly 12 digits')
    .regex(/^\d{12}$/, 'Aadhaar must contain only digits'),
});

// ─── Step 2: Risk Validation ──────────────────────────────────
export const RiskValidationSchema = z.object({
  latitude: z.number({ required_error: 'GPS location required' }),
  longitude: z.number({ required_error: 'GPS location required' }),
  baseState: z.string().min(1, 'State detection required'),
  riskGrade: z.enum(['A', 'B', 'C']),
  riskScore: z.number().min(0).max(1),
  riskFactors: z.object({
    environmental: z.number(),
    personal: z.number(),
    market: z.number(),
  }),
});

// ─── Step 3: Issuance ─────────────────────────────────────────
export const IssuanceSchema = z.object({
  termType: z.enum(['weekly', 'per-mile'], {
    errorMap: () => ({ message: 'Select a term type' }),
  }),
  premiumAmount: z.number().positive(),
  consentGiven: z
    .boolean()
    .refine((v) => v === true, {
      message: 'You must consent to the policy terms under DPDP Act',
    }),
});

// ─── Combined Full Submission ─────────────────────────────────
export const FullSubmissionSchema = PersonaSchema
  .merge(RiskValidationSchema)
  .merge(IssuanceSchema);

/**
 * Default form values for initialization
 */
export const DEFAULT_VALUES = {
  // Step 1
  fullName: '',
  platform: undefined,
  workerId: '',
  aadhaar: '',
  // Step 2
  latitude: undefined,
  longitude: undefined,
  baseState: '',
  riskGrade: undefined,
  riskScore: undefined,
  riskFactors: undefined,
  // Step 3
  termType: 'weekly',
  premiumAmount: 0,
  consentGiven: false,
};
