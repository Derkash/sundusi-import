export interface AppConfig {
  shopifyStore: string;
  shopifyAccessToken: string;
  apiVersion: string;
}

export function loadConfig(): AppConfig {
  const shopifyStore = process.env.SHOPIFY_STORE;
  const shopifyAccessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2026-01';

  if (!shopifyStore) {
    throw new Error('SHOPIFY_STORE manquant dans .env');
  }
  if (!shopifyAccessToken) {
    throw new Error('SHOPIFY_ACCESS_TOKEN manquant dans .env');
  }

  return { shopifyStore, shopifyAccessToken, apiVersion };
}
