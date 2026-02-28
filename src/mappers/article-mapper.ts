import type { ValidatedArticleRow } from '../validators/article-validator.js';
import type { ArticleCreateInput, MetafieldInput } from '../types/shopify.js';

export interface MappedArticle {
  blogTitle: string;
  input: ArticleCreateInput;
}

export function mapArticleRows(rows: ValidatedArticleRow[]): MappedArticle[] {
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

    const input: ArticleCreateInput = {
      title: row.title,
      ...(row.handle && { handle: row.handle }),
      ...(row.author && { author: { name: row.author } }),
      ...(row.body_html && { body: row.body_html }),
      ...(row.summary && { summary: row.summary }),
      ...(row.tags && { tags: row.tags.split(',').map((t) => t.trim()) }),
      ...(row.image_src && {
        image: { src: row.image_src, ...(row.image_alt && { altText: row.image_alt }) },
      }),
      ...(row.is_published && { isPublished: row.is_published === 'true' }),
      ...(row.publish_date && { publishDate: row.publish_date }),
      ...(metafields.length > 0 && { metafields }),
    };

    return { blogTitle: row.blog_title, input };
  });
}
