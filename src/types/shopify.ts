export interface MetafieldInput {
  namespace: string;
  key: string;
  value: string;
  type: string;
}

// Products
export interface ProductSetInput {
  title?: string;
  descriptionHtml?: string;
  handle?: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  productOptions?: ProductOptionInput[];
  variants?: ProductVariantSetInput[];
  files?: FileInput[];
  metafields?: MetafieldInput[];
}

export interface ProductOptionInput {
  name: string;
  position?: number;
  values?: { name: string }[];
}

export interface ProductVariantSetInput {
  price?: string;
  compareAtPrice?: string;
  sku?: string;
  barcode?: string;
  weight?: number;
  weightUnit?: 'GRAMS' | 'KILOGRAMS' | 'OUNCES' | 'POUNDS';
  optionValues?: { optionName: string; name: string }[];
  inventoryQuantities?: { locationId: string; name: string; quantity: number }[];
}

export interface FileInput {
  originalSource: string;
  filename?: string;
  contentType?: 'IMAGE' | 'VIDEO' | 'FILE';
  alt?: string;
}

// Articles
export interface ArticleCreateInput {
  title: string;
  handle?: string;
  author?: { name: string };
  body?: string;
  summary?: string;
  tags?: string[];
  image?: { src: string; altText?: string };
  isPublished?: boolean;
  publishDate?: string;
  metafields?: MetafieldInput[];
}

// Pages
export interface PageCreateInput {
  title: string;
  handle?: string;
  body?: string;
  isPublished?: boolean;
  templateSuffix?: string;
  metafields?: MetafieldInput[];
}

// Collections
export interface CollectionInput {
  title: string;
  descriptionHtml?: string;
  handle?: string;
  image?: { src: string; altText?: string };
  ruleSet?: {
    appliedDisjunctively: boolean;
    rules: { column: string; relation: string; condition: string }[];
  };
  products?: string[];
  sortOrder?: string;
  seo?: { title?: string; description?: string };
  metafields?: MetafieldInput[];
}

// Customers
export interface CustomerInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  tags?: string[];
  emailMarketingConsent?: {
    marketingState: 'SUBSCRIBED' | 'NOT_SUBSCRIBED' | 'UNSUBSCRIBED';
    marketingOptInLevel?: 'SINGLE_OPT_IN' | 'CONFIRMED_OPT_IN' | 'UNKNOWN';
  };
  smsMarketingConsent?: {
    marketingState: 'SUBSCRIBED' | 'NOT_SUBSCRIBED' | 'UNSUBSCRIBED';
    marketingOptInLevel?: 'SINGLE_OPT_IN' | 'CONFIRMED_OPT_IN' | 'UNKNOWN';
  };
  taxExempt?: boolean;
  addresses?: AddressInput[];
  metafields?: MetafieldInput[];
  note?: string;
}

export interface AddressInput {
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  zip?: string;
  countryCode?: string;
  phone?: string;
}

// Results
export interface ImportResult {
  success: boolean;
  shopifyId?: string;
  handle?: string;
  errors?: { field: string; message: string }[];
  rowIndex: number;
}

export interface ImportSummary {
  total: number;
  created: number;
  updated: number;
  failed: number;
  errors: { rowIndex: number; field: string; message: string }[];
  duration: number;
}
