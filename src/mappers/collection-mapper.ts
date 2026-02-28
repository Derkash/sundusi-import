import type { ValidatedCollectionRow } from '../validators/collection-validator.js';
import type { CollectionInput, MetafieldInput } from '../types/shopify.js';

export function mapCollectionRows(rows: ValidatedCollectionRow[]): CollectionInput[] {
  // Group rows by handle/title for smart collections with multiple rules
  const groups = new Map<string, ValidatedCollectionRow[]>();
  for (const row of rows) {
    const key = row.handle || row.title;
    const existing = groups.get(key) || [];
    existing.push(row);
    groups.set(key, existing);
  }

  const collections: CollectionInput[] = [];

  for (const [, groupRows] of groups) {
    const firstRow = groupRows[0];
    const metafields: MetafieldInput[] = [];

    if (firstRow.metafield_namespace && firstRow.metafield_key && firstRow.metafield_value && firstRow.metafield_type) {
      metafields.push({
        namespace: firstRow.metafield_namespace,
        key: firstRow.metafield_key,
        value: firstRow.metafield_value,
        type: firstRow.metafield_type,
      });
    }

    const collection: CollectionInput = {
      title: firstRow.title,
      ...(firstRow.handle && { handle: firstRow.handle }),
      ...(firstRow.description_html && { descriptionHtml: firstRow.description_html }),
      ...(firstRow.image_src && {
        image: {
          src: firstRow.image_src,
          ...(firstRow.image_alt && { altText: firstRow.image_alt }),
        },
      }),
      ...(firstRow.sort_order && { sortOrder: firstRow.sort_order.toUpperCase() }),
      ...((firstRow.seo_title || firstRow.seo_description) && {
        seo: {
          ...(firstRow.seo_title && { title: firstRow.seo_title }),
          ...(firstRow.seo_description && { description: firstRow.seo_description }),
        },
      }),
      ...(metafields.length > 0 && { metafields }),
    };

    if (firstRow.type === 'smart') {
      const rules = groupRows
        .filter((r) => r.rule_column && r.rule_relation && r.rule_condition)
        .map((r) => ({
          column: r.rule_column!.toUpperCase(),
          relation: r.rule_relation!.toUpperCase(),
          condition: r.rule_condition!,
        }));

      if (rules.length > 0) {
        collection.ruleSet = {
          appliedDisjunctively: firstRow.rules_disjunctive === 'true',
          rules,
        };
      }
    } else if (firstRow.type === 'custom' && firstRow.product_handles) {
      // Product handles will be resolved to GIDs in the command
      collection.products = firstRow.product_handles.split('|').map((h) => h.trim());
    }

    collections.push(collection);
  }

  return collections;
}
