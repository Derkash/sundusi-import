export interface ProductCsvRow {
  handle: string;
  title?: string;
  description_html?: string;
  vendor?: string;
  product_type?: string;
  tags?: string;
  status?: string;
  option1_name?: string;
  option1_value?: string;
  option2_name?: string;
  option2_value?: string;
  option3_name?: string;
  option3_value?: string;
  variant_sku?: string;
  variant_price?: string;
  variant_compare_at_price?: string;
  variant_barcode?: string;
  variant_weight?: string;
  variant_weight_unit?: string;
  variant_inventory_qty?: string;
  variant_inventory_policy?: string;
  image_src?: string;
  image_alt?: string;
  metafield_namespace?: string;
  metafield_key?: string;
  metafield_value?: string;
  metafield_type?: string;
}

export interface ArticleCsvRow {
  blog_title: string;
  title: string;
  author?: string;
  handle?: string;
  body_html?: string;
  summary?: string;
  tags?: string;
  image_src?: string;
  image_alt?: string;
  is_published?: string;
  publish_date?: string;
  metafield_namespace?: string;
  metafield_key?: string;
  metafield_value?: string;
  metafield_type?: string;
}

export interface PageCsvRow {
  title: string;
  handle?: string;
  body_html?: string;
  is_published?: string;
  template_suffix?: string;
  metafield_namespace?: string;
  metafield_key?: string;
  metafield_value?: string;
  metafield_type?: string;
}

export interface CollectionCsvRow {
  title: string;
  handle?: string;
  description_html?: string;
  type: string;
  sort_order?: string;
  image_src?: string;
  image_alt?: string;
  rule_column?: string;
  rule_relation?: string;
  rule_condition?: string;
  rules_disjunctive?: string;
  product_handles?: string;
  seo_title?: string;
  seo_description?: string;
  metafield_namespace?: string;
  metafield_key?: string;
  metafield_value?: string;
  metafield_type?: string;
}

export interface CustomerCsvRow {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  tags?: string;
  accepts_email_marketing?: string;
  accepts_sms_marketing?: string;
  tax_exempt?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  province_code?: string;
  zip?: string;
  country_code?: string;
  note?: string;
  metafield_namespace?: string;
  metafield_key?: string;
  metafield_value?: string;
  metafield_type?: string;
}
