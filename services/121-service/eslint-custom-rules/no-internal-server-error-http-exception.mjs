/**
 * Disallow throwing `HttpException` with status 500 / `HttpStatus.INTERNAL_SERVER_ERROR`,
 * and `InternalServerErrorException`.
 *
 * Throwing one of these turns an unexpected failure into a "handled" HTTP response,
 * which suppresses the stacktrace in our logs. Throwing a regular `Error` instead lets
 * Nest's default exception filter log it with a full stacktrace, so we can actually
 * diagnose the problem in production.
 */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow throwing HttpException with status 500 or InternalServerErrorException; throw a regular Error instead so the stacktrace is logged.',
      category: 'Best Practices',
      recommended: false,
    },
    schema: [],
    messages: {
      noHttpException500:
        'Do not throw HttpException with status 500. Throw a regular Error instead, so the stacktrace is logged.',
      noInternalServerErrorException:
        'Do not throw InternalServerErrorException. Throw a regular Error instead, so the stacktrace is logged.',
    },
  },
  create(context) {
    function getClassName(node) {
      if (node.type === 'Identifier') {
        return node.name;
      }
      if (
        node.type === 'MemberExpression' &&
        !node.computed &&
        node.property.type === 'Identifier'
      ) {
        return node.property.name;
      }
      return null;
    }

    function isInternalServerErrorStatus(node) {
      if (!node) {
        return false;
      }
      if (node.type === 'Literal' && node.value === 500) {
        return true;
      }
      if (
        node.type === 'MemberExpression' &&
        !node.computed &&
        node.property.type === 'Identifier' &&
        node.property.name === 'INTERNAL_SERVER_ERROR' &&
        getClassName(node.object) === 'HttpStatus'
      ) {
        return true;
      }
      return false;
    }

    return {
      ThrowStatement(node) {
        const argument = node.argument;
        if (!argument || argument.type !== 'NewExpression') {
          return;
        }
        const className = getClassName(argument.callee);
        if (!className) {
          return;
        }

        if (className === 'InternalServerErrorException') {
          context.report({
            node: argument,
            messageId: 'noInternalServerErrorException',
          });
          return;
        }

        if (
          className === 'HttpException' &&
          isInternalServerErrorStatus(argument.arguments[1])
        ) {
          context.report({
            node: argument,
            messageId: 'noHttpException500',
          });
        }
      },
    };
  },
};
