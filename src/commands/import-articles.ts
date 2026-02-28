import type { ShopifyClient } from '../core/shopify-client.js';
import type { Logger } from '../core/logger.js';
import { createProgressBar } from '../core/logger.js';
import { readCsvFile } from '../core/csv-reader.js';
import { validateArticleRows } from '../validators/article-validator.js';
import { mapArticleRows } from '../mappers/article-mapper.js';
import { BLOGS_QUERY, BLOG_CREATE_MUTATION, ARTICLE_CREATE_MUTATION } from '../graphql/articles.js';
import type { ImportSummary } from '../types/shopify.js';

interface ImportArticlesOptions {
  dryRun: boolean;
  limit?: number;
  skip?: number;
  verbose: boolean;
  defaultBlog?: string;
}

export async function importArticles(
  client: ShopifyClient,
  logger: Logger,
  filePath: string,
  options: ImportArticlesOptions,
): Promise<ImportSummary> {
  const startTime = Date.now();

  // 1. Read CSV
  logger.info(`Lecture de ${filePath}...`);
  const rows = readCsvFile(filePath, { skip: options.skip, limit: options.limit });
  logger.info(`${rows.length} lignes lues`);

  // 2. Validate
  logger.info('Validation des données...');
  const { valid, errors: validationErrors } = validateArticleRows(rows);

  if (validationErrors.length > 0) {
    for (const err of validationErrors) {
      logger.warn(`Ligne ${err.row}: ${err.message}`);
    }
  }

  logger.info(`${valid.length} lignes valides, ${validationErrors.length} erreurs`);

  // 3. Map
  const articles = mapArticleRows(valid);
  logger.info(`${articles.length} articles à importer`);

  // 4. Dry-run
  if (options.dryRun) {
    logger.info('--- Mode dry-run ---');
    for (const article of articles) {
      logger.info(`  [${article.blogTitle}] "${article.input.title}"`);
    }
    return {
      total: articles.length,
      created: 0,
      updated: 0,
      failed: 0,
      errors: validationErrors.map((e) => ({ rowIndex: e.row, field: '', message: e.message })),
      duration: Date.now() - startTime,
    };
  }

  // 5. Resolve blog GIDs
  logger.info('Résolution des blogs...');
  const blogMap = await resolveBlogIds(client, logger, articles.map((a) => a.blogTitle));

  // 6. Import
  let created = 0;
  let failed = 0;
  const importErrors: { rowIndex: number; field: string; message: string }[] = [];
  const progress = createProgressBar(articles.length);
  progress.start(articles.length, 0, { status: 'Import...' });

  for (let i = 0; i < articles.length; i++) {
    const { blogTitle, input } = articles[i];
    const blogId = blogMap.get(blogTitle);

    if (!blogId) {
      failed++;
      importErrors.push({ rowIndex: i, field: 'blog_title', message: `Blog "${blogTitle}" introuvable` });
      progress.update(i + 1, { status: `${created} OK, ${failed} ERR` });
      continue;
    }

    try {
      const result = await client.query<{
        articleCreate: {
          article: { id: string; handle: string; title: string } | null;
          userErrors: { field: string[]; message: string }[];
        };
      }>(ARTICLE_CREATE_MUTATION, { article: { ...input, blog: { id: blogId } } });

      if (result.articleCreate.userErrors.length > 0) {
        failed++;
        for (const err of result.articleCreate.userErrors) {
          importErrors.push({ rowIndex: i, field: err.field.join('.'), message: err.message });
        }
      } else {
        created++;
        if (options.verbose && result.articleCreate.article) {
          logger.info(`  OK "${input.title}": ${result.articleCreate.article.id}`);
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
    total: articles.length,
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

async function resolveBlogIds(
  client: ShopifyClient,
  logger: Logger,
  blogTitles: string[],
): Promise<Map<string, string>> {
  const blogMap = new Map<string, string>();
  const uniqueTitles = [...new Set(blogTitles)];

  // Fetch existing blogs
  const result = await client.query<{
    blogs: { edges: { node: { id: string; title: string } }[] };
  }>(BLOGS_QUERY);

  for (const edge of result.blogs.edges) {
    blogMap.set(edge.node.title, edge.node.id);
  }

  // Create missing blogs
  for (const title of uniqueTitles) {
    if (!blogMap.has(title)) {
      logger.info(`  Création du blog "${title}"...`);
      const createResult = await client.query<{
        blogCreate: {
          blog: { id: string; title: string } | null;
          userErrors: { field: string[]; message: string }[];
        };
      }>(BLOG_CREATE_MUTATION, { blog: { title } });

      if (createResult.blogCreate.blog) {
        blogMap.set(title, createResult.blogCreate.blog.id);
      } else {
        logger.error(`  Échec création blog "${title}": ${createResult.blogCreate.userErrors.map((e) => e.message).join(', ')}`);
      }
    }
  }

  return blogMap;
}

function printSummary(logger: Logger, summary: ImportSummary): void {
  const durationSec = (summary.duration / 1000).toFixed(1);
  logger.info('');
  logger.info('--- Résumé Import Articles ---');
  logger.info(`  Total:    ${summary.total}`);
  logger.info(`  Créés:    ${summary.created}`);
  logger.info(`  Échoués:  ${summary.failed}`);
  logger.info(`  Durée:    ${durationSec}s`);
}
