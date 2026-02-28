# Sundusi Import

CLI d'import en masse pour la boutique Shopify Sundusi via l'API GraphQL Admin.

## Ressources supportées

- Produits (avec variantes, images, metafields)
- Articles de blog
- Pages personnalisées
- Collections (smart et custom)
- Clients

## Prérequis

- Node.js 20+
- Un access token Shopify Admin API (custom app)

## Installation

```bash
npm install
cp .env.example .env
# Remplir .env avec votre access token Shopify
```

## Utilisation

```bash
# Import de produits
npm run import -- products data/mes-produits.csv

# Mode dry-run (validation sans appel API)
npm run import -- products data/mes-produits.csv --dry-run

# Import bulk pour gros fichiers
npm run import -- products data/catalogue.xlsx --bulk

# Limiter le nombre de lignes
npm run import -- products data/mes-produits.csv --limit 10

# Autres ressources
npm run import -- articles data/articles.csv
npm run import -- pages data/pages.csv
npm run import -- collections data/collections.csv
npm run import -- customers data/clients.csv
```

## Templates CSV

Des templates avec exemples sont disponibles dans le dossier `templates/`.

## Liens utiles

- [Admin Shopify](https://admin.shopify.com/store/sundusi-2)
- [API GraphQL Admin](https://shopify.dev/docs/api/admin-graphql)
- [Contexte partagé](../shared/)
