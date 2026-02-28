import '@shopify/shopify-api/adapters/node';
import { shopifyApi, Session, LATEST_API_VERSION } from '@shopify/shopify-api';
import type { AppConfig } from '../types/config.js';
import type { Logger } from './logger.js';

export interface ShopifyClient {
  query: <T = unknown>(query: string, variables?: Record<string, unknown>) => Promise<T>;
}

export function createShopifyClient(config: AppConfig, logger: Logger): ShopifyClient {
  const shopify = shopifyApi({
    apiKey: 'not-needed',
    apiSecretKey: 'not-needed',
    scopes: [],
    hostName: config.shopifyStore,
    apiVersion: (config.apiVersion as typeof LATEST_API_VERSION) || LATEST_API_VERSION,
    isCustomStoreApp: true,
    isEmbeddedApp: false,
    adminApiAccessToken: config.shopifyAccessToken,
  });

  const session = shopify.session.customAppSession(config.shopifyStore);
  const client = new shopify.clients.Graphql({ session });

  let availablePoints = 1000;
  const MIN_POINTS_THRESHOLD = 100;

  async function query<T = unknown>(
    queryString: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    if (availablePoints < MIN_POINTS_THRESHOLD) {
      const waitTime = Math.ceil((MIN_POINTS_THRESHOLD - availablePoints) / 50);
      logger.debug(`Rate limit: ${availablePoints} points restants, pause ${waitTime}s`);
      await sleep(waitTime * 1000);
    }

    const response = await client.request(queryString, {
      variables: variables as Record<string, string>,
    });

    const extensions = (response as Record<string, unknown>).extensions as
      | { cost?: { throttleStatus?: { currentlyAvailable?: number } } }
      | undefined;

    if (extensions?.cost?.throttleStatus?.currentlyAvailable !== undefined) {
      availablePoints = extensions.cost.throttleStatus.currentlyAvailable;
    }

    return response.data as T;
  }

  return { query };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
