export const COLLECTION_CREATE_MUTATION = `
  mutation collectionCreate($input: CollectionInput!) {
    collectionCreate(input: $input) {
      collection {
        id
        handle
        title
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const PRODUCTS_BY_HANDLES_QUERY = `
  query productsByHandles($query: String!) {
    products(first: 250, query: $query) {
      edges {
        node {
          id
          handle
        }
      }
    }
  }
`;
