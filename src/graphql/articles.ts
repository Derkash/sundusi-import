export const BLOGS_QUERY = `
  query {
    blogs(first: 50) {
      edges {
        node {
          id
          title
        }
      }
    }
  }
`;

export const BLOG_CREATE_MUTATION = `
  mutation blogCreate($blog: BlogCreateInput!) {
    blogCreate(blog: $blog) {
      blog {
        id
        title
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const ARTICLE_CREATE_MUTATION = `
  mutation articleCreate($article: ArticleCreateInput!) {
    articleCreate(article: $article) {
      article {
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
