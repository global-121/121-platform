/**
 * ESLint rule: tanstack-no-manual-cache-invalidation
 *
 * This rule prevents using manual cache invalidation methods from TanStack Query.
 *
 * Problem:
 * We invalidate caches automatically using TanStack Query's MutationCache in `app.config.ts`.
 *
 * Reference: https://tkdodo.eu/blog/automatic-query-invalidation-after-mutations
 */
/** @type {import('eslint').Rule.RuleModule} */
export default {
  create(context) {
    return {
      CallExpression(node) {
        // Check for member expression calls: object.invalidateCache() or object.invalidateQueries()
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.property.type === 'Identifier' &&
          (node.callee.property.name === 'invalidateCache' ||
            node.callee.property.name === 'invalidateQueries')
        ) {
          context.report({
            messageId: 'manualInvalidation',
            node,
          });
        }
      },
    };
  },
  meta: {
    docs: {
      category: 'Best Practices',
      description:
        "Don't allow manual cache invalidation when using TanStack Query",
      recommended: false,
    },
    messages: {
      manualInvalidation:
        "Don't allow manual cache invalidation when using TanStack Query - rely on automatic cache management in MutationCache.",
    },
    schema: [],
    type: 'problem',
  },
};
