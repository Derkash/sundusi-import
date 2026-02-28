import type { ValidatedProductRow } from '../validators/product-validator.js';
import type {
  ProductSetInput,
  ProductOptionInput,
  ProductVariantSetInput,
  FileInput,
  MetafieldInput,
} from '../types/shopify.js';

const WEIGHT_UNIT_MAP: Record<string, ProductVariantSetInput['weightUnit']> = {
  g: 'GRAMS',
  kg: 'KILOGRAMS',
  oz: 'OUNCES',
  lb: 'POUNDS',
};

const STATUS_MAP: Record<string, ProductSetInput['status']> = {
  active: 'ACTIVE',
  draft: 'DRAFT',
  archived: 'ARCHIVED',
};

export function mapProductRows(rows: ValidatedProductRow[]): ProductSetInput[] {
  // Group rows by handle
  const groups = new Map<string, ValidatedProductRow[]>();
  for (const row of rows) {
    const existing = groups.get(row.handle) || [];
    existing.push(row);
    groups.set(row.handle, existing);
  }

  const products: ProductSetInput[] = [];

  for (const [handle, groupRows] of groups) {
    const firstRow = groupRows[0];

    // Build options from all rows
    const options = buildOptions(groupRows);

    // Build variants
    const variants = groupRows.map((row) => buildVariant(row, options));

    // Collect unique images
    const files = collectImages(groupRows);

    // Collect metafields from first row
    const metafields = buildMetafields(firstRow);

    const product: ProductSetInput = {
      handle,
      ...(firstRow.title && { title: firstRow.title }),
      ...(firstRow.description_html && { descriptionHtml: firstRow.description_html }),
      ...(firstRow.vendor && { vendor: firstRow.vendor }),
      ...(firstRow.product_type && { productType: firstRow.product_type }),
      ...(firstRow.tags && { tags: firstRow.tags.split(',').map((t) => t.trim()) }),
      ...(firstRow.status && { status: STATUS_MAP[firstRow.status] }),
      ...(options.length > 0 && { productOptions: options }),
      variants,
      ...(files.length > 0 && { files }),
      ...(metafields.length > 0 && { metafields }),
    };

    products.push(product);
  }

  return products;
}

function buildOptions(rows: ValidatedProductRow[]): ProductOptionInput[] {
  const optionNames = new Map<string, Set<string>>();

  for (const row of rows) {
    for (const i of [1, 2, 3] as const) {
      const nameKey = `option${i}_name` as keyof ValidatedProductRow;
      const valueKey = `option${i}_value` as keyof ValidatedProductRow;
      const name = row[nameKey] as string | undefined;
      const value = row[valueKey] as string | undefined;

      if (name && value) {
        if (!optionNames.has(name)) {
          optionNames.set(name, new Set());
        }
        optionNames.get(name)!.add(value);
      }
    }
  }

  const options: ProductOptionInput[] = [];
  let position = 1;
  for (const [name, values] of optionNames) {
    options.push({
      name,
      position,
      values: Array.from(values).map((v) => ({ name: v })),
    });
    position++;
  }

  return options;
}

function buildVariant(
  row: ValidatedProductRow,
  options: ProductOptionInput[],
): ProductVariantSetInput {
  const optionValues: { optionName: string; name: string }[] = [];

  for (const i of [1, 2, 3] as const) {
    const nameKey = `option${i}_name` as keyof ValidatedProductRow;
    const valueKey = `option${i}_value` as keyof ValidatedProductRow;
    const name = row[nameKey] as string | undefined;
    const value = row[valueKey] as string | undefined;

    if (name && value) {
      optionValues.push({ optionName: name, name: value });
    }
  }

  const variant: ProductVariantSetInput = {
    ...(row.variant_price && { price: row.variant_price }),
    ...(row.variant_compare_at_price && { compareAtPrice: row.variant_compare_at_price }),
    ...(row.variant_sku && { sku: row.variant_sku }),
    ...(row.variant_barcode && { barcode: row.variant_barcode }),
    ...(row.variant_weight && { weight: parseFloat(row.variant_weight) }),
    ...(row.variant_weight_unit && { weightUnit: WEIGHT_UNIT_MAP[row.variant_weight_unit] }),
    ...(optionValues.length > 0 && { optionValues }),
  };

  return variant;
}

function collectImages(rows: ValidatedProductRow[]): FileInput[] {
  const seen = new Set<string>();
  const files: FileInput[] = [];

  for (const row of rows) {
    if (row.image_src && !seen.has(row.image_src)) {
      seen.add(row.image_src);
      files.push({
        originalSource: row.image_src,
        contentType: 'IMAGE',
        ...(row.image_alt && { alt: row.image_alt }),
      });
    }
  }

  return files;
}

function buildMetafields(row: ValidatedProductRow): MetafieldInput[] {
  if (row.metafield_namespace && row.metafield_key && row.metafield_value && row.metafield_type) {
    return [
      {
        namespace: row.metafield_namespace,
        key: row.metafield_key,
        value: row.metafield_value,
        type: row.metafield_type,
      },
    ];
  }
  return [];
}
