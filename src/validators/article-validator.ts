import { z } from 'zod';

export const articleRowSchema = z.object({
  blog_title: z.string().min(1, 'blog_title est requis'),
  title: z.string().min(1, 'title est requis'),
  author: z.string().optional(),
  handle: z.string().optional(),
  body_html: z.string().optional(),
  summary: z.string().optional(),
  tags: z.string().optional(),
  image_src: z.string().url().or(z.literal('')).optional(),
  image_alt: z.string().optional(),
  is_published: z.enum(['true', 'false', '']).optional(),
  publish_date: z.string().optional(),
  metafield_namespace: z.string().optional(),
  metafield_key: z.string().optional(),
  metafield_value: z.string().optional(),
  metafield_type: z.string().optional(),
});

export type ValidatedArticleRow = z.infer<typeof articleRowSchema>;

export function validateArticleRows(
  rows: Record<string, string>[],
): { valid: ValidatedArticleRow[]; errors: { row: number; message: string }[] } {
  const valid: ValidatedArticleRow[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const result = articleRowSchema.safeParse(rows[i]);
    if (result.success) {
      valid.push(result.data);
    } else {
      const messages = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      errors.push({ row: i + 2, message: messages.join('; ') });
    }
  }

  return { valid, errors };
}
