// Taken from this PR: https://github.com/angular-eslint/angular-eslint/pull/2156
import { Selectors } from '@angular-eslint/utils';
import { AST_NODE_TYPES, ASTUtils } from '@typescript-eslint/utils';

const isCallExpression = (node) => node.type === AST_NODE_TYPES.CallExpression;

const isMemberExpression = (node) =>
  node.type === AST_NODE_TYPES.MemberExpression;

const isPropertyDefinition = (node) =>
  node.type === AST_NODE_TYPES.PropertyDefinition;

const getDeclaredProperties = ({ body: { body } }) =>
  body.filter(isPropertyDefinition);

const getPropertySignalName = (propertyDefinition) => {
  const expression = propertyDefinition.value;
  if (ASTUtils.isIdentifier(expression)) return expression.name;

  if (!expression || !isCallExpression(expression)) {
    return undefined;
  }

  if (isMemberExpression(expression.callee)) {
    return ASTUtils.isIdentifier(expression.callee.object)
      ? expression.callee.object.name
      : undefined;
  }

  return ASTUtils.isIdentifier(expression.callee)
    ? expression.callee.name
    : undefined;
};

export default {
  create(context) {
    const { order } = context.options[0];
    const relevantSignalFunctions = new Set(order);

    const isBefore = (property1, property2) => {
      const methodIndex1 = order.indexOf(getPropertySignalName(property1));
      const methodIndex2 = order.indexOf(getPropertySignalName(property2));

      return (
        (methodIndex1 < methodIndex2 && methodIndex1 !== -1) ||
        methodIndex2 === -1
      );
    };

    return {
      [Selectors.COMPONENT_OR_DIRECTIVE_CLASS_DECORATOR](node) {
        const declaredProperties = getDeclaredProperties(node.parent);

        const declaredPropertyFunctions = declaredProperties.filter(
          (method) =>
            !!method &&
            relevantSignalFunctions.has(getPropertySignalName(method)),
        );

        for (let i = 1; i < declaredPropertyFunctions.length; ++i) {
          const before = isBefore(
            declaredPropertyFunctions[i],
            declaredPropertyFunctions[i - 1],
          );

          if (before) {
            // context.report({
            //   messageId: 'signalsNotSorted',
            // });
            context.report({
              data: {
                first: getPropertySignalName(declaredPropertyFunctions[i]),
                second: getPropertySignalName(declaredPropertyFunctions[i - 1]),
              },
              message: 'Expected "{{ first }}" to be before "{{ second }}"',
              node: declaredPropertyFunctions[i].key,
            });
          }
        }
      },
    };
  },
  meta: {
    defaultOptions: [
      {
        order: [
          'input',
          'output',
          'inject',
          'model',
          'signal',
          'viewChild',
          'viewChildren',
          'contentChild',
          'contentChildren',
          'computed',
        ],
      },
    ],
    docs: {
      description: 'Ensures that signal functions are in a specific order',
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          order: {
            description: 'The order of the signal types',
            items: {
              type: 'string',
            },
            type: 'array',
            uniqueItems: true,
          },
        },
        type: 'object',
      },
    ],
    type: 'problem',
  },
  name: 'sort-signals',
};
