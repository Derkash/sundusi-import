import type { ValidatedCustomerRow } from '../validators/customer-validator.js';
import type { CustomerInput, MetafieldInput } from '../types/shopify.js';

export function mapCustomerRows(rows: ValidatedCustomerRow[]): CustomerInput[] {
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

    const hasAddress = row.address1 || row.city || row.zip || row.country_code;

    const customer: CustomerInput = {
      ...(row.email && { email: row.email }),
      ...(row.first_name && { firstName: row.first_name }),
      ...(row.last_name && { lastName: row.last_name }),
      ...(row.phone && { phone: row.phone }),
      ...(row.tags && { tags: row.tags.split(',').map((t) => t.trim()) }),
      ...(row.accepts_email_marketing === 'true' && {
        emailMarketingConsent: {
          marketingState: 'SUBSCRIBED' as const,
          marketingOptInLevel: 'SINGLE_OPT_IN' as const,
        },
      }),
      ...(row.accepts_sms_marketing === 'true' && {
        smsMarketingConsent: {
          marketingState: 'SUBSCRIBED' as const,
          marketingOptInLevel: 'SINGLE_OPT_IN' as const,
        },
      }),
      ...(row.tax_exempt === 'true' && { taxExempt: true }),
      ...(hasAddress && {
        addresses: [
          {
            ...(row.address1 && { address1: row.address1 }),
            ...(row.address2 && { address2: row.address2 }),
            ...(row.city && { city: row.city }),
            ...(row.province && { province: row.province }),
            ...(row.zip && { zip: row.zip }),
            ...(row.country_code && { countryCode: row.country_code }),
          },
        ],
      }),
      ...(row.note && { note: row.note }),
      ...(metafields.length > 0 && { metafields }),
    };

    return customer;
  });
}
