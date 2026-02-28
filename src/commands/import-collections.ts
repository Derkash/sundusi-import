import type { ShopifyClient } from '../core/shopify-client.js';
import type { Logger } from '../core/logger.js';
import { createProgressBar } from '../core/logger.js';
import { readCsvFile } from '../core/csv-reader.js';
import { validateCollectionRows } from '../validators/collection-validator.js';
import { mapCollectionRows } from '../mappers/collection-mapper.js';
import { COLLECTION_CREATE_MUTATION, PRODUCTS_BY_HANDLES_QUERY } from '../graphql/collections.js';
import type { ImportSummary } from '../types/shopify.js';

interface ImportCollectionsOptions {
  dryRun: boolean;
  limit?: number;
  skip?: number;
  verbose: boolean;
}

export async function importCollections(
  client: ShopifyClient,
  logger: Logger,
  filePath: string,
  options: ImportCollectionsOptions,
): Promise<ImportSummary> {
  const startTime = Date.now();

  logger.info(`Lecture de ${filePath}...`);
  const rows = readCsvFile(filePath, { skip: options.skip, limit: options.limit });
  logger.info(`${rows.length} lignes lues`);

  logger.info('Validation des données...');
  const { valid, errors: validationErrors } = validateCollectionRows(rows);

  if (validationErrors.length > 0) {
    for (const err of validationErrors) {
      logger.warn(`Ligne ${err.row}: ${err.message}`);
    }
  }

  logger.info(`${valid.length} lignes valides, ${validationErrors.length} erreurs`);

  const collections = mapCollectionRows(valid);
  logger.info(`${collections.length} collections à importer`);

  if (options.dryRun) {
    logger.info('--- Mode dry-run ---');
    for (const col of collections) {
      const type = col.ruleSet ? 'smart' : 'custom';
      logger.info(`  "${col.title}" (${type})`);
    }
    return {
      total: collections.length,
      created: 0,
      updated: 0,
      failed: 0,
      errors: validationErrors.map((e) => ({ rowIndex: e.row, field: '', message: e.message })),
      duration: Date.now() - startTime,
    };
  }

  // Resolve product handles to GIDs for custom collections
  const allProductHandles = collections
    .flatMap((c) => c.products || [])
    .filter((h) => !h.startsWith('gid://'));

  let productHandleMap = new Map<string, string>();
  if (allProductHandles.length > 0) {
    logger.info('Résolution des handles de produits...');
    productHandleMap = await resolveProductHandles(client, allProductHandles);
    logger.info(`${productHandleMap.size} produits résolus`);
  }

  let created = 0;
  let failed = 0;
  const importErrors: { rowIndex: number; field: string; message: string }[] = [];
  const progress = createProgressBar(collections.length);
  progress.start(collections.length, 0, { status: 'Import...' });

  for (let i = 0; i < collections.length; i++) {
    const collection = { ...collections[i] };

    // Replace product handles with GIDs
    if (collection.products) {
      collection.products = collection.products
        .map((h) => productHandleMap.get(h) || h)
        .filter((id) => id.startsWith('gid://'));
    }

    try {
      const result = await client.query<{
        collectionCreate: {
          collection: { id: string; handle: string; title: string } | null;
          userErrors: { field: string[]; message: string }[];
        };
      }>(COLLECTION_CREATE_MUTATION, { input: collection });

      if (result.collectionCreate.userErrors.length > 0) {
        failed++;
        for (const err of result.collectionCreate.userErrors) {
          importErrors.push({ rowIndex: i, field: err.field.join('.'), message: err.message });
        }
      } else {
        created++;
        if (options.verbose && result.collectionCreate.collection) {
          logger.info(`  OK "${collection.title}": ${result.collectionCreate.collection.id}`);
        }
      }
    } catch (err) {
      failed++;
      importErrors.push({ rowIndex: i, field: '', message: err instanceof Error ? err.message : String(err) });
    }

    progress.update(i + 1, { status: `${created} OK, ${failed} ERR` });
  }

  progress.stop();

  const summary: ImportSummary = {
    total: collections.length,
    created,
    updated: 0,
    failed,
    errors: [
      ...validationErrors.map((e) => ({ rowIndex: e.row, field: '', message: e.message })),
      ...importErrors,
    ],
    duration: Date.now() - startTime,
  };

  const durationSec = (summary.duration / 1000).toFixed(1);
  logger.info('');
  logger.info('--- Résumé Import Collections ---');
  logger.info(`  Total:    ${summary.total}`);
  logger.info(`  Créés:    ${summary.created}`);
  logger.info(`  Échoués:  ${summary.failed}`);
  logger.info(`  Durée:    ${durationSec}s`);

  return summary;
}

async function resolveProductHandles(
  client: ShopifyClient,
  handles: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = [...new Set(handles)];

  // Query in batches of 50
  for (let i = 0; i < unique.length; i += 50) {
    const batch = unique.slice(i, i + 50);
    const queryStr = batch.map((h) => `handle:${h}`).join(' OR ');

    const result = await client.query<{
      products: { edges: { node: { id: string; handle: string } }[] };
    }>(PRODUCTS_BY_HANDLES_QUERY, { query: queryStr });

    for (const edge of result.products.edges) {
      map.set(edge.node.handle, edge.node.id);
    }
  }

  return map;
}
