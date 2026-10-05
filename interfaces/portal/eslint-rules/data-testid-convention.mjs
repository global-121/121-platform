/**
 * ESLint rule: data-testid-convention (for Angular templates)
 *
 * Keeps the test-ids that Playwright uses via `getByTestId()` consistent.
 *
 * - Values that are fixed strings must be kebab-case. Dynamic values are not checked.
 * - Components that forward a `dataTestId` input to an inner element must not get a `data-testid` on their host element.
 *   Otherwise `getByTestId()` resolves to the host instead of the inner element that has the state e2e-tests rely on.
 */
const KEBAB_CASE_PATTERN = /^[a-z\d]+(?:-[a-z\d]+)*$/;

const isTestIdName = ({ name }) =>
  name === 'data-testid' || name.endsWith('TestId');

const getFixedBoundValue = ({ value }) => {
  const expression = value.ast;

  if (expression.constructor.name !== 'LiteralPrimitive') {
    return;
  }

  if (typeof expression.value !== 'string') {
    return;
  }

  return expression.value;
};

const toLocation = ({ end, start }) => ({
  end: { column: end.col, line: end.line + 1 },
  start: { column: start.col, line: start.line + 1 },
});

/** @type {import('eslint').Rule.RuleModule} */
export default {
  create(context) {
    const [{ componentsWithDataTestIdInput = [] } = {}] = context.options;
    const componentsForwardingTestId = new Set(componentsWithDataTestIdInput);

    const reportInvalidFormat = ({ sourceSpan, value }) => {
      if (value === undefined || KEBAB_CASE_PATTERN.test(value)) {
        return;
      }

      context.report({
        data: { value },
        loc: toLocation(sourceSpan),
        messageId: 'invalidFormat',
      });
    };

    return {
      Element(element) {
        const staticAttributes = element.attributes.filter(({ name }) =>
          isTestIdName({ name }),
        );
        const boundAttributes = element.inputs.filter(({ name }) =>
          isTestIdName({ name }),
        );

        for (const attribute of [...staticAttributes, ...boundAttributes]) {
          if (
            attribute.name === 'data-testid' &&
            componentsForwardingTestId.has(element.name)
          ) {
            context.report({
              data: { component: element.name },
              loc: toLocation(attribute.sourceSpan),
              messageId: 'useInputOnComponent',
            });
          }
        }

        for (const attribute of staticAttributes) {
          reportInvalidFormat({
            sourceSpan: attribute.sourceSpan,
            value: attribute.value,
          });
        }

        for (const attribute of boundAttributes) {
          reportInvalidFormat({
            sourceSpan: attribute.sourceSpan,
            value: getFixedBoundValue(attribute),
          });
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        'Enforce a consistent format and placement of test-ids in templates',
    },
    messages: {
      invalidFormat: 'Test-id "{{value}}" must be written in kebab-case.',
      useInputOnComponent:
        'Do not set "data-testid" on <{{component}}>, use its [dataTestId] input instead.',
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          componentsWithDataTestIdInput: {
            items: { type: 'string' },
            type: 'array',
          },
        },
        type: 'object',
      },
    ],
    type: 'problem',
  },
};
