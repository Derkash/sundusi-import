import { z } from 'zod';

export const pageRowSchema = z.object({
  title: z.string().min(1, 'title est requis'),
  handle: z.string().optional(),
  body_html: z.string().optional(),
  is_published: z.enum(['true', 'false', '']).optional(),
  template_suffix: z.string().optional(),
  metafield_namespace: z.string().optional(),
  metafield_key: z.string().optional(),
  metafield_value: z.string().optional(),
  metafield_type: z.string().optional(),
});

export type ValidatedPageRow = z.infer<typeof pageRowSchema>;

export function validatePageRows(
  rows: Record<string, string>[],
): { valid: ValidatedPageRow[]; errors: { row: number; message: string }[] } {
  const valid: ValidatedPageRow[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const result = pageRowSchema.safeParse(rows[i]);
    if (result.success) {
      valid.push(result.data);
    } else {
      const messages = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      errors.push({ row: i + 2, message: messages.join('; ') });
    }
  }

  return { valid, errors };
}
