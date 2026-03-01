/**
 * Create the main navigation menu on Sundusi with 3-level hierarchy
 * matching the Yelira structure: Femme/Homme/Enfant → subcategories → sub-subcategories
 */
import 'dotenv/config';
import { loadConfig } from '../src/types/config.js';
import { createLogger } from '../src/core/logger.js';
import { createShopifyClient } from '../src/core/shopify-client.js';
import { NAVIGATION } from '../src/core/category-hierarchy.js';

// Shopify menu mutations
const MENU_UPDATE = `
  mutation menuUpdate($id: ID!, $title: String!, $items: [MenuItemUpdateInput!]!) {
    menuUpdate(id: $id, title: $title, items: $items) {
      menu {
        id
        handle
        title
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

const MENUS_QUERY = `
  query {
    menus(first: 20) {
      edges {
        node {
          id
          handle
          title
        }
      }
    }
  }
`;

interface MenuItemInput {
  title: string;
  type: string;
  resourceId?: string;
  url?: string;
  items?: MenuItemInput[];
}

async function main() {
  const config = loadConfig();
  const logger = createLogger(true);
  const client = createShopifyClient(config, logger);

  // 1. Fetch all collection IDs by handle
  logger.info('Récupération des collections...');
  const collectionIds = new Map<string, string>();
  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    const vars: Record<string, unknown> = { first: 100 };
    if (cursor) vars.after = cursor;
    const result = await client.query<{
      collections: {
        edges: { node: { id: string; handle: string }; cursor: string }[];
        pageInfo: { hasNextPage: boolean };
      };
    }>(`query($first: Int!, $after: String) {
      collections(first: $first, after: $after) {
        edges { node { id handle } cursor }
        pageInfo { hasNextPage }
      }
    }`, vars);

    for (const edge of result.collections.edges) {
      collectionIds.set(edge.node.handle, edge.node.id);
      cursor = edge.cursor;
    }
    hasNextPage = result.collections.pageInfo.hasNextPage;
  }
  logger.info(`${collectionIds.size} collections trouvées`);

  // 2. Find main-menu ID
  logger.info('Recherche du menu principal...');
  const menusResult = await client.query<{
    menus: { edges: { node: { id: string; handle: string; title: string } }[] };
  }>(MENUS_QUERY);

  let mainMenuId: string | null = null;
  for (const edge of menusResult.menus.edges) {
    logger.info(`  Menu: "${edge.node.title}" (${edge.node.handle}) → ${edge.node.id}`);
    if (edge.node.handle === 'main-menu') {
      mainMenuId = edge.node.id;
    }
  }

  if (!mainMenuId) {
    logger.error('Menu principal (main-menu) non trouvé!');
    return;
  }

  // Also delete the duplicate main-menu-1 if it exists
  for (const edge of menusResult.menus.edges) {
    if (edge.node.handle === 'main-menu-1') {
      logger.info('  Suppression du menu dupliqué main-menu-1...');
      await client.query(`mutation menuDelete($id: ID!) { menuDelete(id: $id) { deletedMenuId userErrors { message } } }`, { id: edge.node.id });
    }
  }

  // 3. Build menu items with collection resource IDs
  function buildMenuItem(item: { title: string; handle: string; children?: { title: string; handle: string; children?: { title: string; handle: string }[] }[] }): MenuItemInput {
    const collectionId = collectionIds.get(item.handle);
    const menuItem: MenuItemInput = {
      title: item.title,
      type: collectionId ? 'COLLECTION' : 'HTTP',
      ...(collectionId ? { resourceId: collectionId } : { url: `https://sundusi.com/collections/${item.handle}` }),
    };

    if (item.children && item.children.length > 0) {
      menuItem.items = item.children.map((child) => buildMenuItem(child as any));
    }

    return menuItem;
  }

  const menuItems = NAVIGATION.map((item) => buildMenuItem(item));

  // 4. Update the main menu with our navigation
  logger.info('Mise à jour du menu principal...');
  const updateResult = await client.query<{
    menuUpdate: {
      menu: { id: string; handle: string; title: string } | null;
      userErrors: { field: string; message: string; code: string }[];
    };
  }>(MENU_UPDATE, {
    id: mainMenuId,
    title: 'Menu principal',
    items: menuItems,
  });

  if (updateResult.menuUpdate.userErrors.length > 0) {
    logger.error('Erreurs:');
    for (const err of updateResult.menuUpdate.userErrors) {
      logger.error(`  ${err.field}: ${err.message} (${err.code})`);
    }
  } else if (updateResult.menuUpdate.menu) {
    logger.info(`Menu mis à jour: "${updateResult.menuUpdate.menu.title}" (${updateResult.menuUpdate.menu.handle})`);
  }

  logger.info('\n=== Terminé ===');
}

main().catch(console.error);
