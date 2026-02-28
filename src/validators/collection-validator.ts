import { z } from 'zod';

export const collectionRowSchema = z.object({
  title: z.string().min(1, 'title est requis'),
  handle: z.string().optional(),
  description_html: z.string().optional(),
  type: z.enum(['smart', 'custom'], { message: 'type doit être "smart" ou "custom"' }),
  sort_order: z.string().optional(),
  image_src: z.string().url().or(z.literal('')).optional(),
  image_alt: z.string().optional(),
  rule_column: z.string().optional(),
  rule_relation: z.string().optional(),
  rule_condition: z.string().optional(),
  rules_disjunctive: z.enum(['true', 'false', '']).optional(),
  product_handles: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  metafield_namespace: z.string().optional(),
  metafield_key: z.string().optional(),
  metafield_value: z.string().optional(),
  metafield_type: z.string().optional(),
});

export type ValidatedCollectionRow = z.infer<typeof collectionRowSchema>;

export function validateCollectionRows(
  rows: Record<string, string>[],
): { valid: ValidatedCollectionRow[]; errors: { row: number; message: string }[] } {
  const valid: ValidatedCollectionRow[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const result = collectionRowSchema.safeParse(rows[i]);
    if (result.success) {
      valid.push(result.data);
    } else {
      const messages = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      errors.push({ row: i + 2, message: messages.join('; ') });
    }
  }

  return { valid, errors };
}
