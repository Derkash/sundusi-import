import type { ShopifyClient } from '../core/shopify-client.js';
import type { Logger } from '../core/logger.js';
import { createProgressBar } from '../core/logger.js';
import { readCsvFile } from '../core/csv-reader.js';
import { validateProductRows } from '../validators/product-validator.js';
import { mapProductRows } from '../mappers/product-mapper.js';
import { PRODUCT_SET_MUTATION, PRODUCT_SET_MUTATION_BULK } from '../graphql/products.js';
import { runBulkMutation } from '../core/bulk-operations.js';
import type { ImportSummary } from '../types/shopify.js';

interface ImportProductsOptions {
  dryRun: boolean;
  bulk: boolean;
  limit?: number;
  skip?: number;
  verbose: boolean;
}

export async function importProducts(
  client: ShopifyClient,
  logger: Logger,
  filePath: string,
  options: ImportProductsOptions,
): Promise<ImportSummary> {
  const startTime = Date.now();

  // 1. Read CSV/Excel
  logger.info(`Lecture de ${filePath}...`);
  const rows = readCsvFile(filePath, { skip: options.skip, limit: options.limit });
  logger.info(`${rows.length} lignes lues`);

  // 2. Validate
  logger.info('Validation des données...');
  const { valid, errors: validationErrors } = validateProductRows(rows);

  if (validationErrors.length > 0) {
    for (const err of validationErrors) {
      logger.warn(`Ligne ${err.row}: ${err.message}`);
    }
  }

  logger.info(`${valid.length} lignes valides, ${validationErrors.length} erreurs`);

  // 3. Map to Shopify input
  const products = mapProductRows(valid);
  logger.info(`${products.length} produits à importer`);

  // 4. Dry-run: stop here
  if (options.dryRun) {
    logger.info('--- Mode dry-run ---');
    for (const product of products) {
      const variantCount = product.variants?.length || 0;
      logger.info(`  ${product.handle}: "${product.title}" (${variantCount} variante(s))`);
    }
    return {
      total: products.length,
      created: 0,
      updated: 0,
      failed: 0,
      errors: validationErrors.map((e) => ({ rowIndex: e.row, field: '', message: e.message })),
      duration: Date.now() - startTime,
    };
  }

  // 5. Import
  if (options.bulk && products.length > 10) {
    return importBulk(client, logger, products, validationErrors, startTime);
  }

  return importDirect(client, logger, products, validationErrors, options.verbose, startTime);
}

async function importDirect(
  client: ShopifyClient,
  logger: Logger,
  products: ReturnType<typeof mapProductRows>,
  validationErrors: { row: number; message: string }[],
  verbose: boolean,
  startTime: number,
): Promise<ImportSummary> {
  let created = 0;
  let failed = 0;
  const importErrors: { rowIndex: number; field: string; message: string }[] = [];
  const progress = createProgressBar(products.length);
  progress.start(products.length, 0, { status: 'Import...' });

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    try {
      const result = await client.query<{
        productSet: {
          product: { id: string; handle: string; title: string } | null;
          userErrors: { field: string[]; message: string }[];
        };
      }>(PRODUCT_SET_MUTATION, { input: product });

      if (result.productSet.userErrors.length > 0) {
        failed++;
        for (const err of result.productSet.userErrors) {
          importErrors.push({
            rowIndex: i,
            field: err.field.join('.'),
            message: err.message,
          });
          if (verbose) {
            logger.warn(`  ${product.handle}: ${err.field.join('.')} - ${err.message}`);
          }
        }
      } else {
        created++;
        if (verbose && result.productSet.product) {
          logger.info(
            `  OK ${product.handle}: ${result.productSet.product.id}`,
          );
        }
      }
    } catch (err) {
      failed++;
      const message = err instanceof Error ? err.message : String(err);
      importErrors.push({ rowIndex: i, field: '', message });
      if (verbose) {
        logger.error(`  ${product.handle}: ${message}`);
      }
    }

    progress.update(i + 1, { status: `${created} OK, ${failed} ERR` });
  }

  progress.stop();

  const summary: ImportSummary = {
    total: products.length,
    created,
    updated: 0,
    failed,
    errors: [
      ...validationErrors.map((e) => ({ rowIndex: e.row, field: '', message: e.message })),
      ...importErrors,
    ],
    duration: Date.now() - startTime,
  };

  printSummary(logger, summary);
  return summary;
}

async function importBulk(
  client: ShopifyClient,
  logger: Logger,
  products: ReturnType<typeof mapProductRows>,
  validationErrors: { row: number; message: string }[],
  startTime: number,
): Promise<ImportSummary> {
  const jsonlLines = products.map((product) => JSON.stringify({ input: product }));

  const result = await runBulkMutation(
    client,
    logger,
    PRODUCT_SET_MUTATION_BULK,
    jsonlLines,
  );

  const objectCount = parseInt(result.objectCount || '0');

  const summary: ImportSummary = {
    total: products.length,
    created: objectCount,
    updated: 0,
    failed: products.length - objectCount,
    errors: validationErrors.map((e) => ({ rowIndex: e.row, field: '', message: e.message })),
    duration: Date.now() - startTime,
  };

  printSummary(logger, summary);
  return summary;
}

function printSummary(logger: Logger, summary: ImportSummary): void {
  const durationSec = (summary.duration / 1000).toFixed(1);
  logger.info('');
  logger.info('--- Résumé Import Produits ---');
  logger.info(`  Total:    ${summary.total}`);
  logger.info(`  Créés:    ${summary.created}`);
  logger.info(`  Échoués:  ${summary.failed}`);
  logger.info(`  Durée:    ${durationSec}s`);

  if (summary.errors.length > 0) {
    logger.info(`  Erreurs:  ${summary.errors.length}`);
  }
}
