# Sundusi Import — Contexte projet

## Objectif
CLI Node.js/TypeScript pour importer en masse des données dans Shopify via l'API GraphQL Admin.

## Ressources supportées
- **Produits** : avec variantes, images, prix, metafields
- **Articles** : articles de blog
- **Pages** : pages personnalisées
- **Collections** : smart et custom
- **Clients** : avec adresses

## Stack
- **Runtime** : Node.js + TypeScript (via tsx)
- **API** : Shopify GraphQL Admin API (version 2026-01)
- **Lib** : @shopify/shopify-api (officielle)
- **CLI** : Commander
- **Validation** : Zod
- **Format d'entrée** : CSV / Excel

## Utilisation
```bash
npm run import -- <resource> <fichier> [options]
npm run import -- products data/produits.csv --dry-run
```

## Conventions
- Consulter `../shared/store-info.md` pour les IDs et URLs Shopify
- Consulter `../shared/brand.md` pour l'identité visuelle
- Les fichiers de données utilisateur vont dans `data/` (gitignored)
- Les templates CSV sont dans `templates/`
