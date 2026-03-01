/**
 * Sundusi category hierarchy — single source of truth.
 *
 * Used by:
 *  - product-mapper.ts  → inject parent tags automatically
 *  - create-navigation.ts → build the Shopify menu
 *  - assign-products-to-collections.ts → assign to manual collections
 */

export interface CategoryLeaf {
  title: string;
  handle: string;
}

export interface CategoryL1 {
  title: string;
  handle: string;
  children: CategoryLeaf[];
}

export interface CategoryRoot {
  title: string;
  handle: string;
  children: CategoryL1[];
}

export const NAVIGATION: CategoryRoot[] = [
  {
    title: 'Femme',
    handle: 'femme',
    children: [
      {
        title: 'Abayas',
        handle: 'abayas',
        children: [
          { title: 'Abaya Dubaï', handle: 'abaya-dubai' },
          { title: 'Abaya Kimono', handle: 'abaya-kimono' },
          { title: 'Abaya Papillon', handle: 'abaya-papillon' },
          { title: 'Abaya Simple & Quotidien', handle: 'abaya-simple' },
          { title: 'Abaya Luxe & Soirée', handle: 'abaya-luxe-soiree' },
          { title: 'Abaya Ouverte & Zippée', handle: 'abaya-ouverte-zippee' },
          { title: 'Abaya Voile Intégré', handle: 'abaya-voile-integre' },
          { title: 'Abaya Allaitement', handle: 'abaya-allaitement' },
          { title: 'Abaya 1m80', handle: 'abaya-1m80' },
          { title: 'Sous-Abaya', handle: 'sous-abaya' },
        ],
      },
      {
        title: 'Hijabs & Voiles',
        handle: 'hijabs',
        children: [
          { title: 'Hijab Soie de Médine', handle: 'hijab-soie-de-medine' },
          { title: 'Hijab Mousseline', handle: 'hijab-mousseline' },
          { title: 'Hijab Jersey', handle: 'hijab-jersey' },
          { title: 'Hijab Satin & Soirée', handle: 'hijab-satin-soiree' },
          { title: 'Hijab à Enfiler', handle: 'hijab-a-enfiler' },
          { title: 'Bonnets & Sous-Hijab', handle: 'bonnets-sous-hijab' },
          { title: 'Châles & Maxi Hijab', handle: 'chales-maxi-hijab' },
        ],
      },
      {
        title: 'Jilbabs',
        handle: 'jilbabs',
        children: [
          { title: 'Jilbab 2 Pièces', handle: 'jilbab-2-pieces' },
          { title: 'Jilbab 1 Pièce', handle: 'jilbab-1-piece' },
          { title: 'Jilbab Sarouel', handle: 'jilbab-sarouel' },
        ],
      },
      {
        title: 'Khimars',
        handle: 'khimars',
        children: [
          { title: 'Khimar Court', handle: 'khimar-court' },
          { title: 'Khimar Long', handle: 'khimar-long' },
          { title: 'Khimar Soie de Médine', handle: 'khimar-soie-de-medine' },
          { title: 'Khimar Jazz & Mousseline', handle: 'khimar-jazz-mousseline' },
        ],
      },
      {
        title: 'Tenues de Prière',
        handle: 'tenues-de-priere',
        children: [
          { title: 'Robe de Prière Hijab Intégré', handle: 'robe-priere-hijab-integre' },
          { title: 'Ensemble de Prière', handle: 'ensemble-de-priere' },
          { title: 'Jilbab de Prière', handle: 'jilbab-de-priere' },
          { title: 'Tapis de Prière', handle: 'tapis-de-priere' },
        ],
      },
      {
        title: 'Mariage & Occasions',
        handle: 'mariage-occasions',
        children: [
          { title: 'Abaya Mariage', handle: 'abaya-mariage' },
          { title: 'Tenue Aïd & Ramadan', handle: 'tenue-aid-ramadan' },
          { title: 'Abaya Soirée & Fête', handle: 'abaya-soiree-fete' },
          { title: 'Caftan & Djellaba', handle: 'caftan-djellaba' },
        ],
      },
      {
        title: 'Prêt-à-Porter Mastour',
        handle: 'pret-a-porter',
        children: [
          { title: 'Robes Longues', handle: 'robes-longues' },
          { title: 'Ensembles & Combinaisons', handle: 'ensembles-combinaisons' },
          { title: 'Tuniques & Chemises', handle: 'tuniques-chemises' },
          { title: 'Jupes Longues', handle: 'jupes-longues' },
          { title: 'Pantalons & Palazzo', handle: 'pantalons-palazzo' },
          { title: 'Manteaux & Vestes', handle: 'manteaux-vestes' },
        ],
      },
      {
        title: 'Burkini & Bain',
        handle: 'burkini',
        children: [
          { title: 'Burkini Femme', handle: 'burkini-femme' },
          { title: 'Hijab de Bain', handle: 'hijab-de-bain' },
          { title: 'Jilbab de Bain', handle: 'jilbab-de-bain' },
        ],
      },
      {
        title: 'Omra & Hajj Femme',
        handle: 'omra-hajj-femme',
        children: [
          { title: 'Abaya Omra', handle: 'abaya-omra' },
          { title: 'Tenue Blanche Hajj', handle: 'tenue-blanche-hajj' },
          { title: 'Ensemble Prière Voyage', handle: 'ensemble-priere-voyage' },
        ],
      },
      {
        title: 'Grande Taille',
        handle: 'grande-taille-femme',
        children: [
          { title: 'Abaya Grande Taille', handle: 'abaya-grande-taille' },
          { title: 'Abaya 1m80', handle: 'abaya-1m80' },
          { title: 'Jilbab Grande Taille', handle: 'jilbab-grande-taille' },
        ],
      },
      {
        title: 'Accessoires',
        handle: 'accessoires-femme',
        children: [
          { title: 'Box Cadeaux', handle: 'box-cadeaux' },
          { title: 'Épingles & Broches Hijab', handle: 'epingles-broches-hijab' },
          { title: 'Bijoux', handle: 'bijoux' },
          { title: 'Ceintures', handle: 'ceintures' },
        ],
      },
    ],
  },
  {
    title: 'Homme',
    handle: 'homme',
    children: [
      {
        title: 'Qamis',
        handle: 'qamis',
        children: [
          { title: 'Qamis Blanc & Saoudien', handle: 'qamis-blanc-saoudien' },
          { title: 'Qamis Moderne & Couleur', handle: 'qamis-moderne-couleur' },
        ],
      },
      {
        title: 'Abaya Homme',
        handle: 'abaya-homme',
        children: [
          { title: 'Abaya Homme Noire', handle: 'abaya-homme-noire' },
          { title: 'Abaya Homme Blanche', handle: 'abaya-homme-blanche' },
        ],
      },
      {
        title: 'Omra & Hajj Homme',
        handle: 'omra-hajj-homme',
        children: [
          { title: 'Ihram', handle: 'ihram' },
        ],
      },
    ],
  },
  {
    title: 'Enfant',
    handle: 'enfant',
    children: [
      {
        title: 'Fille',
        handle: 'fille',
        children: [
          { title: 'Abaya Fille', handle: 'abaya-fille' },
          { title: 'Robe de Prière Fille', handle: 'robe-priere-fille' },
          { title: 'Burkini Fille', handle: 'burkini-fille' },
        ],
      },
      {
        title: 'Garçon',
        handle: 'garcon',
        children: [
          { title: 'Qamis Enfant', handle: 'qamis-enfant' },
        ],
      },
      {
        title: 'Combo Mère-Fille',
        handle: 'combo-mere-fille',
        children: [
          { title: 'Abaya Mère-Fille', handle: 'abaya-mere-fille' },
          { title: 'Prière Mère-Fille', handle: 'priere-mere-fille' },
        ],
      },
    ],
  },
];

/**
 * Build a lookup map: collection handle → parent tags to inject.
 *
 * Examples:
 *   "abaya-dubai"  → ["femme", "abayas"]   (level 2 → gets root + L1 tags)
 *   "abayas"       → ["femme"]              (level 1 → gets root tag)
 *   "femme"        → []                     (root → no parent)
 */
export function buildParentTagsMap(): Map<string, string[]> {
  const map = new Map<string, string[]>();

  for (const root of NAVIGATION) {
    // Root level has no parent tags
    map.set(root.handle, []);

    for (const l1 of root.children) {
      // Level 1 gets the root tag
      map.set(l1.handle, [root.handle]);

      for (const leaf of l1.children) {
        // Level 2 gets root + level 1 tags
        map.set(leaf.handle, [root.handle, l1.handle]);
      }
    }
  }

  return map;
}

/**
 * Given a list of tags (from CSV), return the list enriched with
 * all parent category tags derived from the hierarchy.
 */
export function enrichTagsWithParents(tags: string[]): string[] {
  const parentMap = buildParentTagsMap();
  const result = new Set(tags);

  for (const tag of tags) {
    const parentTags = parentMap.get(tag.toLowerCase());
    if (parentTags) {
      for (const pt of parentTags) {
        result.add(pt);
      }
    }
  }

  return Array.from(result);
}
