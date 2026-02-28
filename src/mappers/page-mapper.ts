import type { ValidatedPageRow } from '../validators/page-validator.js';
import type { PageCreateInput, MetafieldInput } from '../types/shopify.js';

export function mapPageRows(rows: ValidatedPageRow[]): PageCreateInput[] {
  return rows.map((row) => {
    const metafields: MetafieldInput[] = [];
    if (row.metafield_namespace && row.metafield_key && row.metafield_value && row.metafield_type) {
      metafields.push({
        namespace: row.metafield_namespace,
        key: row.metafield_key,
        value: row.metafield_value,
        type: row.metafield_type,
      });
    }

    return {
      title: row.title,
      ...(row.handle && { handle: row.handle }),
      ...(row.body_html && { body: row.body_html }),
      ...(row.is_published && { isPublished: row.is_published === 'true' }),
      ...(row.template_suffix && { templateSuffix: row.template_suffix }),
      ...(metafields.length > 0 && { metafields }),
    };
  });
}
