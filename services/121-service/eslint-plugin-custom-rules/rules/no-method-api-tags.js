module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        '@ApiTags decorator should only be used at class level, not on methods. If they are on methods they appear twice in the swagger docs',
      category: 'Best Practices',
      recommended: false,
    },
    schema: [], // no options
  },
  create: function (context) {
    return {
      MethodDefinition(node) {
        if (node.decorators) {
          const apiTagsDecorator = node.decorators.find(
            (decorator) =>
              decorator.expression.callee &&
              decorator.expression.callee.name === 'ApiTags',
          );
          if (apiTagsDecorator) {
            context.report({
              node: apiTagsDecorator,
              message:
                '@ApiTags should only be used at class level, not on individual methods',
            });
          }
        }
      },
    };
  },
};
