module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require `@UseGuards(AuthenticatedUserGuard)` on controller classes and `@AuthenticatedUser()` on each endpoint method, to prevent accidental unprotected endpoints (and explain external use-cases)',
      category: 'Best Practices',
      recommended: false,
    },
    schema: [],
  },
  create(context) {
    const httpDecoratorNames = new Set([
      'Get',
      'Post',
      'Put',
      'Delete',
      'Patch',
      'Options',
      'Head',
      'All',
    ]);

    function getDecoratorName(decorator) {
      const expression = decorator.expression;
      if (!expression) {
        return undefined;
      }

      if (expression.type === 'Identifier') {
        return expression.name;
      }

      if (expression.type === 'CallExpression') {
        const callee = expression.callee;
        if (callee && callee.type === 'Identifier') {
          return callee.name;
        }
      }

      return undefined;
    }

    function hasDecorator(node, name) {
      if (!node.decorators) {
        return false;
      }

      return node.decorators.some(
        (decorator) => getDecoratorName(decorator) === name,
      );
    }

    function hasUseGuardsWithAuthenticatedUserGuard(node) {
      if (!node.decorators) {
        return false;
      }

      return node.decorators.some((decorator) => {
        const expression = decorator.expression;
        if (!expression || expression.type !== 'CallExpression') {
          return false;
        }

        const callee = expression.callee;
        if (!callee || callee.type !== 'Identifier') {
          return false;
        }

        if (callee.name !== 'UseGuards') {
          return false;
        }

        return expression.arguments.some(
          (argument) =>
            argument.type === 'Identifier' &&
            argument.name === 'AuthenticatedUserGuard',
        );
      });
    }

    return {
      ClassDeclaration(node) {
        if (!hasDecorator(node, 'Controller')) {
          return;
        }

        const hasNoUserAuthenticationController = hasDecorator(
          node,
          'NoUserAuthenticationController',
        );

        if (
          !hasNoUserAuthenticationController &&
          !hasUseGuardsWithAuthenticatedUserGuard(node)
        ) {
          context.report({
            node,
            message:
              'Controller classes must be decorated with `@UseGuards(AuthenticatedUserGuard)`, unless explicitly marked with `@NoUserAuthenticationController()`.',
          });
        }

        if (hasNoUserAuthenticationController) {
          // Explicitly marked as not requiring authentication; do not enforce method-level @AuthenticatedUser().
          return;
        }

        for (const element of node.body.body) {
          if (element.type !== 'MethodDefinition') {
            continue;
          }

          if (!element.decorators) {
            continue;
          }

          if (element.kind !== 'method') {
            continue;
          }

          const isEndpoint = element.decorators.some((decorator) => {
            const name = getDecoratorName(decorator);
            if (!name) {
              return false;
            }

            return httpDecoratorNames.has(name);
          });

          if (!isEndpoint) {
            continue;
          }

          const hasNoUserAuthenticationEndpoint = hasDecorator(
            element,
            'NoUserAuthenticationEndpoint',
          );

          if (hasNoUserAuthenticationEndpoint) {
            // Explicit opt-out for a specific endpoint; do not enforce @AuthenticatedUser().
            continue;
          }

          const hasAuthenticatedUser = element.decorators.some(
            (decorator) => getDecoratorName(decorator) === 'AuthenticatedUser',
          );

          if (!hasAuthenticatedUser) {
            context.report({
              node: element.key,
              message:
                'Endpoint methods in controllers must be decorated with `@AuthenticatedUser()`, unless explicitly marked with `@NoUserAuthenticationEndpoint()`.',
            });
          }
        }
      },
    };
  },
};
