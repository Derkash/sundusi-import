export const PRODUCT_SET_MUTATION = `
  mutation productSet($input: ProductSetInput!) {
    productSet(input: $input) {
      product {
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

export const PRODUCT_SET_MUTATION_BULK = `
  mutation productSet($input: ProductSetInput!) {
    productSet(input: $input) {
      product {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;
