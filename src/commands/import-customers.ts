import type { ShopifyClient } from '../core/shopify-client.js';
import type { Logger } from '../core/logger.js';
import { createProgressBar } from '../core/logger.js';
import { readCsvFile } from '../core/csv-reader.js';
import { validateCustomerRows } from '../validators/customer-validator.js';
import { mapCustomerRows } from '../mappers/customer-mapper.js';
import { CUSTOMER_CREATE_MUTATION } from '../graphql/customers.js';
import type { ImportSummary } from '../types/shopify.js';

interface ImportCustomersOptions {
  dryRun: boolean;
  limit?: number;
  skip?: number;
  verbose: boolean;
}

export async function importCustomers(
  client: ShopifyClient,
  logger: Logger,
  filePath: string,
  options: ImportCustomersOptions,
): Promise<ImportSummary> {
  const startTime = Date.now();

  logger.info(`Lecture de ${filePath}...`);
  const rows = readCsvFile(filePath, { skip: options.skip, limit: options.limit });
  logger.info(`${rows.length} lignes lues`);

  logger.info('Validation des données...');
  const { valid, errors: validationErrors } = validateCustomerRows(rows);

  if (validationErrors.length > 0) {
    for (const err of validationErrors) {
      logger.warn(`Ligne ${err.row}: ${err.message}`);
    }
  }

  logger.info(`${valid.length} lignes valides, ${validationErrors.length} erreurs`);

  const customers = mapCustomerRows(valid);
  logger.info(`${customers.length} clients à importer`);

  if (options.dryRun) {
    logger.info('--- Mode dry-run ---');
    for (const customer of customers) {
      const name = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email || customer.phone;
      logger.info(`  "${name}"`);
    }
    return {
      total: customers.length,
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
  const progress = createProgressBar(customers.length);
  progress.start(customers.length, 0, { status: 'Import...' });

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    try {
      const result = await client.query<{
        customerCreate: {
          customer: { id: string; email: string; firstName: string; lastName: string } | null;
          userErrors: { field: string[]; message: string }[];
        };
      }>(CUSTOMER_CREATE_MUTATION, { input: customer });

      if (result.customerCreate.userErrors.length > 0) {
        failed++;
        for (const err of result.customerCreate.userErrors) {
          importErrors.push({ rowIndex: i, field: err.field.join('.'), message: err.message });
        }
      } else {
        created++;
        if (options.verbose && result.customerCreate.customer) {
          logger.info(`  OK ${customer.email || customer.phone}: ${result.customerCreate.customer.id}`);
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
    total: customers.length,
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
  logger.info('--- Résumé Import Clients ---');
  logger.info(`  Total:    ${summary.total}`);
  logger.info(`  Créés:    ${summary.created}`);
  logger.info(`  Échoués:  ${summary.failed}`);
  logger.info(`  Durée:    ${durationSec}s`);

  return summary;
}
