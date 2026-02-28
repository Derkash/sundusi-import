import { z } from 'zod';

export const productRowSchema = z.object({
  handle: z.string().min(1, 'handle est requis'),
  title: z.string().optional(),
  description_html: z.string().optional(),
  vendor: z.string().optional(),
  product_type: z.string().optional(),
  tags: z.string().optional(),
  status: z
    .enum(['active', 'draft', 'archived', ''])
    .optional()
    .transform((v) => v || undefined),
  option1_name: z.string().optional(),
  option1_value: z.string().optional(),
  option2_name: z.string().optional(),
  option2_value: z.string().optional(),
  option3_name: z.string().optional(),
  option3_value: z.string().optional(),
  variant_sku: z.string().optional(),
  variant_price: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(parseFloat(v)), 'variant_price doit être un nombre'),
  variant_compare_at_price: z
    .string()
    .optional()
    .refine(
      (v) => !v || !isNaN(parseFloat(v)),
      'variant_compare_at_price doit être un nombre',
    ),
  variant_barcode: z.string().optional(),
  variant_weight: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(parseFloat(v)), 'variant_weight doit être un nombre'),
  variant_weight_unit: z.enum(['g', 'kg', 'oz', 'lb', '']).optional(),
  variant_inventory_qty: z
    .string()
    .optional()
    .refine(
      (v) => !v || !isNaN(parseInt(v)),
      'variant_inventory_qty doit être un entier',
    ),
  variant_inventory_policy: z.string().optional(),
  image_src: z.string().url('image_src doit être une URL valide').or(z.literal('')).optional(),
  image_alt: z.string().optional(),
  metafield_namespace: z.string().optional(),
  metafield_key: z.string().optional(),
  metafield_value: z.string().optional(),
  metafield_type: z.string().optional(),
});

export type ValidatedProductRow = z.infer<typeof productRowSchema>;

export function validateProductRows(
  rows: Record<string, string>[],
): { valid: ValidatedProductRow[]; errors: { row: number; message: string }[] } {
  const valid: ValidatedProductRow[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const result = productRowSchema.safeParse(rows[i]);
    if (result.success) {
      valid.push(result.data);
    } else {
      const messages = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      errors.push({ row: i + 2, message: messages.join('; ') });
    }
  }

  return { valid, errors };
}
