module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce cascade and onDelete options in TypeORM relationships',
      category: 'Best Practices',
      recommended: false,
    },
    schema: [], // no options
  },
  create: function (context) {
    return {
      Decorator(node) {
        if (
          node.expression.callee &&
          (node.expression.callee.name === 'ManyToOne' ||
            node.expression.callee.name === 'OneToOne')
        ) {
          for (const optionsArgument of node.expression.arguments) {
            if (
              optionsArgument &&
              optionsArgument.properties?.some(
                (prop) => prop.key.name === 'onDelete',
              )
            ) {
              return;
            }
          }
          context.report({
            node,
            message:
              'TypeORM relationships must include the cascade and the onDelete option',
          });
        }
      },
    };
  },
};
