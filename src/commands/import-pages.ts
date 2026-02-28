import type { ShopifyClient } from '../core/shopify-client.js';
import type { Logger } from '../core/logger.js';
import { createProgressBar } from '../core/logger.js';
import { readCsvFile } from '../core/csv-reader.js';
import { validatePageRows } from '../validators/page-validator.js';
import { mapPageRows } from '../mappers/page-mapper.js';
import { PAGE_CREATE_MUTATION } from '../graphql/pages.js';
import type { ImportSummary } from '../types/shopify.js';

interface ImportPagesOptions {
  dryRun: boolean;
  limit?: number;
  skip?: number;
  verbose: boolean;
}

export async function importPages(
  client: ShopifyClient,
  logger: Logger,
  filePath: string,
  options: ImportPagesOptions,
): Promise<ImportSummary> {
  const startTime = Date.now();

  logger.info(`Lecture de ${filePath}...`);
  const rows = readCsvFile(filePath, { skip: options.skip, limit: options.limit });
  logger.info(`${rows.length} lignes lues`);

  logger.info('Validation des données...');
  const { valid, errors: validationErrors } = validatePageRows(rows);

  if (validationErrors.length > 0) {
    for (const err of validationErrors) {
      logger.warn(`Ligne ${err.row}: ${err.message}`);
    }
  }

  logger.info(`${valid.length} lignes valides, ${validationErrors.length} erreurs`);

  const pages = mapPageRows(valid);
  logger.info(`${pages.length} pages à importer`);

  if (options.dryRun) {
    logger.info('--- Mode dry-run ---');
    for (const page of pages) {
      logger.info(`  "${page.title}" (handle: ${page.handle || 'auto'})`);
    }
    return {
      total: pages.length,
      created: 0,
      updated: 0,
      failed: 0,
      errors: validationErrors.map((e) => ({ rowIndex: e.row, field: '', message: e.message })),
      duration: Date.now() - startTime,
    };
  }

  let created = 0;
  let failed = 0;
  const importErrors: { rowIndex: number; field: string; message: string }[] = [];
  const progress = createProgressBar(pages.length);
  progress.start(pages.length, 0, { status: 'Import...' });

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    try {
      const result = await client.query<{
        pageCreate: {
          page: { id: string; handle: string; title: string } | null;
          userErrors: { field: string[]; message: string }[];
        };
      }>(PAGE_CREATE_MUTATION, { page });

      if (result.pageCreate.userErrors.length > 0) {
        failed++;
        for (const err of result.pageCreate.userErrors) {
          importErrors.push({ rowIndex: i, field: err.field.join('.'), message: err.message });
        }
      } else {
        created++;
        if (options.verbose && result.pageCreate.page) {
          logger.info(`  OK "${page.title}": ${result.pageCreate.page.id}`);
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
    total: pages.length,
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
  logger.info('--- Résumé Import Pages ---');
  logger.info(`  Total:    ${summary.total}`);
  logger.info(`  Créés:    ${summary.created}`);
  logger.info(`  Échoués:  ${summary.failed}`);
  logger.info(`  Durée:    ${durationSec}s`);

  return summary;
}
