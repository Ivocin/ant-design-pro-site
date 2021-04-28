const { resolve } = require('path');

module.exports = async ({ graphql, actions }) => {
  const { createPage, createRedirect } = actions;
  // Used to detect and prevent duplicate redirects

  const docsTemplate = resolve(__dirname, '../src/templates/docs.tsx');
  // Redirect /index.html to root.
  createRedirect({
    fromPath: '/index.html',
    redirectInBrowser: true,
    toPath: '/',
  });

  const allMarkdown = await graphql(
    `
      {
        allMarkdownRemark(limit: 1000) {
          edges {
            node {
              fields {
                slug
                underScoreCasePath
                path
              }
            }
          }
        }
      }
    `,
  );

  if (allMarkdown.errors) {
    console.error(allMarkdown.errors);

    throw Error(allMarkdown.errors);
  }
  const redirects = {};

  const { edges } = allMarkdown.data.allMarkdownRemark;
  edges.forEach((edge) => {
    const { slug, underScoreCasePath } = edge.node.fields;
    const getType = () => {
      if (slug.includes('docs/')) {
        return '/docs/';
      }
      if (slug.includes('blog/')) {
        return '/blog/';
      }
      if (slug.includes('config/')) {
        return '/config/';
      }
      return '/blog';
    };
    if (slug.includes('docs/') || slug.includes('/blog') || slug.includes('/config')) {
      const template = docsTemplate;
      const createArticlePage = (path) => {
        if (underScoreCasePath !== path) {
          redirects[underScoreCasePath] = path;
        }
        console.log(path);
        return createPage({
          path,
          component: template,
          context: {
            slug,
            // if is docs page
            type: getType(),
            locale: slug.includes('-cn') ? '/-cn/' : '//',
          },
        });
      };

      // Register primary URL.
      createArticlePage(slug.replace('/index', ''));
    }
  });
  // 首页的中文版
  const indexTemplate = resolve(__dirname, '../src/pages/index.tsx');

  createPage({
    path: '/index-cn',
    component: indexTemplate,
  });

  createRedirect({
    fromPath: '/docs/',
    redirectInBrowser: true,
    toPath: '/docs/getting-started',
  });

  createRedirect({
    fromPath: '/config',
    redirectInBrowser: true,
    toPath: '/config/config',
  });

  createRedirect({
    fromPath: '/config-cn',
    redirectInBrowser: true,
    toPath: '/config/config-cn',
  });

  createRedirect({
    fromPath: '/blog/beter-block/',
    redirectInBrowser: true,
    toPath: '/blog/better-block',
  });

  createRedirect({
    fromPath: '/blog/beter-block-cn/',
    redirectInBrowser: true,
    toPath: '/blog/better-block-cn',
  });

  const blogEdges = await graphql(
    `
      {
        allMarkdownRemark(sort: { order: ASC, fields: [frontmatter___order] }, limit: 1000) {
          edges {
            node {
              fields {
                slug
                underScoreCasePath
                path
              }
            }
          }
        }
      }
    `,
  );

  const { node } = blogEdges.data.allMarkdownRemark.edges[0];
  const blogPath = node.fields.slug.replace('-cn', '');

  createRedirect({
    fromPath: '/blog-cn',
    redirectInBrowser: true,
    toPath: `${blogPath}-cn`,
  });

  createRedirect({
    fromPath: '/blog/',
    redirectInBrowser: true,
    toPath: blogPath,
  });

  Object.keys(redirects).map((path) =>
    createRedirect({
      fromPath: path,
      redirectInBrowser: true,
      toPath: redirects[path],
    }),
  );
};
