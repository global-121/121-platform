/**
 * ESLint rule: no-form-control-undefined-value
 *
 * This rule prevents passing `undefined` as the first argument to Angular FormControl constructors.
 *
 * Problem:
 * When you pass `undefined` as the first argument to FormControl, it can cause issues with Angular's
 * reactive forms, where the value in `getRawValue()` or `controls[controlName].value` will be treated as
 * `null` instead of `undefined` after initialization or reset.
 *
 * Sadly, the only way to avoid this is to use the object format for the first argument, like so:
 *
 * Instead of:
 *   new FormControl(undefined, { nonNullable: true })
 *
 * Use:
 *   new FormControl({ value: undefined, disabled: false }, { nonNullable: true })
 *
 * Reference: https://github.com/angular/angular/issues/40608
 */

module.exports = {
  create(context) {
    return {
      NewExpression(node) {
        // Check if this is a FormControl constructor call
        if (
          node.callee &&
          node.callee.type === 'Identifier' &&
          node.callee.name === 'FormControl' &&
          node.arguments.length >= 1
        ) {
          const firstArg = node.arguments[0];

          // Check if the first argument is undefined (identifier or literal)
          if (
            (firstArg.type === 'Identifier' && firstArg.name === 'undefined') ||
            (firstArg.type === 'Literal' && firstArg.value === undefined)
          ) {
            context.report({
              messageId: 'noUndefinedValue',
              node: firstArg,
            });
          }
        }
      },
    };
  },
  meta: {
    docs: {
      category: 'Possible Errors',
      description:
        'Disallow undefined as the first argument to FormControl constructor',
    },
    fixable: null,
    messages: {
      noUndefinedValue:
        'Do not pass undefined as the first argument to FormControl. Use the second argument format instead: new FormControl({ value: undefined, disabled: false }, options)',
    },
    schema: [],
    type: 'problem',
  },
};
