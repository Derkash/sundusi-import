import { z } from 'zod';

export const customerRowSchema = z
  .object({
    email: z.string().email('email invalide').or(z.literal('')).optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    phone: z.string().optional(),
    tags: z.string().optional(),
    accepts_email_marketing: z.enum(['true', 'false', '']).optional(),
    accepts_sms_marketing: z.enum(['true', 'false', '']).optional(),
    tax_exempt: z.enum(['true', 'false', '']).optional(),
    address1: z.string().optional(),
    address2: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    province_code: z.string().optional(),
    zip: z.string().optional(),
    country_code: z.string().optional(),
    note: z.string().optional(),
    metafield_namespace: z.string().optional(),
    metafield_key: z.string().optional(),
    metafield_value: z.string().optional(),
    metafield_type: z.string().optional(),
  })
  .refine((data) => data.email || data.phone, {
    message: 'email ou phone est requis',
  });

export type ValidatedCustomerRow = z.infer<typeof customerRowSchema>;

export function validateCustomerRows(
  rows: Record<string, string>[],
): { valid: ValidatedCustomerRow[]; errors: { row: number; message: string }[] } {
  const valid: ValidatedCustomerRow[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const result = customerRowSchema.safeParse(rows[i]);
    if (result.success) {
      valid.push(result.data);
    } else {
      const messages = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      errors.push({ row: i + 2, message: messages.join('; ') });
    }
  }

  return { valid, errors };
}
