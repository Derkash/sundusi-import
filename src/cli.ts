#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import { createLogger } from './core/logger.js';
import { createShopifyClient } from './core/shopify-client.js';
import { loadConfig } from './types/config.js';
import { importProducts } from './commands/import-products.js';
import { importArticles } from './commands/import-articles.js';
import { importPages } from './commands/import-pages.js';
import { importCollections } from './commands/import-collections.js';
import { importCustomers } from './commands/import-customers.js';

const program = new Command();

program
  .name('sundusi-import')
  .description('CLI d\'import en masse pour la boutique Shopify Sundusi')
  .version('1.0.0');

// Global options
function addGlobalOptions(cmd: Command): Command {
  return cmd
    .option('--dry-run', 'Valider sans importer', false)
    .option('--verbose', 'Afficher les détails', false)
    .option('--limit <n>', 'Limiter à N lignes', parseInt)
    .option('--skip <n>', 'Sauter les N premières lignes', parseInt);
}

// Products
addGlobalOptions(
  program
    .command('products <file>')
    .description('Importer des produits depuis un fichier CSV/Excel')
    .option('--bulk', 'Utiliser les bulk operations pour les gros fichiers', false),
).action(async (file: string, opts) => {
  await runImport('products', file, opts);
});

// Articles
addGlobalOptions(
  program
    .command('articles <file>')
    .description('Importer des articles de blog depuis un fichier CSV/Excel'),
).action(async (file: string, opts) => {
  await runImport('articles', file, opts);
});

// Pages
addGlobalOptions(
  program
    .command('pages <file>')
    .description('Importer des pages depuis un fichier CSV/Excel'),
).action(async (file: string, opts) => {
  await runImport('pages', file, opts);
});

// Collections
addGlobalOptions(
  program
    .command('collections <file>')
    .description('Importer des collections depuis un fichier CSV/Excel'),
).action(async (file: string, opts) => {
  await runImport('collections', file, opts);
});

// Customers
addGlobalOptions(
  program
    .command('customers <file>')
    .description('Importer des clients depuis un fichier CSV/Excel'),
).action(async (file: string, opts) => {
  await runImport('customers', file, opts);
});

async function runImport(
  resource: string,
  file: string,
  opts: { dryRun: boolean; verbose: boolean; limit?: number; skip?: number; bulk?: boolean },
): Promise<void> {
  const logger = createLogger(opts.verbose);

  logger.info(`=== Sundusi Import: ${resource} ===`);
  logger.info(`Fichier: ${file}`);
  if (opts.dryRun) logger.info('Mode: dry-run');
  if (opts.bulk) logger.info('Mode: bulk operations');
  if (opts.limit) logger.info(`Limite: ${opts.limit} lignes`);
  if (opts.skip) logger.info(`Skip: ${opts.skip} lignes`);
  logger.info('');

  try {
    if (opts.dryRun) {
      // Dry-run mode: no Shopify client needed for validation
      const dummyClient = {
        query: async () => {
          throw new Error('Dry-run: pas d\'appel API');
        },
      };

      switch (resource) {
        case 'products':
          await importProducts(dummyClient, logger, file, { ...opts, bulk: opts.bulk || false });
          break;
        case 'articles':
          await importArticles(dummyClient, logger, file, opts);
          break;
        case 'pages':
          await importPages(dummyClient, logger, file, opts);
          break;
        case 'collections':
          await importCollections(dummyClient, logger, file, opts);
          break;
        case 'customers':
          await importCustomers(dummyClient, logger, file, opts);
          break;
      }
    } else {
      const config = loadConfig();
      const client = createShopifyClient(config, logger);

      switch (resource) {
        case 'products':
          await importProducts(client, logger, file, { ...opts, bulk: opts.bulk || false });
          break;
        case 'articles':
          await importArticles(client, logger, file, opts);
          break;
        case 'pages':
          await importPages(client, logger, file, opts);
          break;
        case 'collections':
          await importCollections(client, logger, file, opts);
          break;
        case 'customers':
          await importCustomers(client, logger, file, opts);
          break;
      }
    }
  } catch (err) {
    logger.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

program.parse();
