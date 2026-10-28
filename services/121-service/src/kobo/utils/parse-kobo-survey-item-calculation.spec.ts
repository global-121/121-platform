import { inferAttributeTypeFromCalculation } from '@121-service/src/kobo/utils/parse-kobo-survey-item-calculation';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';

const { numeric, text } = RegistrationAttributeTypes;

describe('inferAttributeTypeFromCalculation', () => {
  describe('missing or empty formula', () => {
    it.each([
      { description: 'is undefined', calculation: undefined },
      { description: 'is an empty string', calculation: '' },
      { description: 'is only whitespace', calculation: '   ' },
    ])(
      'should return text when the formula $description',
      ({ calculation }) => {
        const result = inferAttributeTypeFromCalculation({ calculation });

        expect(result).toBe(text);
      },
    );
  });

  describe('formulas that always give a number', () => {
    it.each([
      { description: 'an integer constant', calculation: '42' },
      { description: 'a decimal constant', calculation: '3.14' },
      {
        description: 'addition: + always converts to numbers',
        calculation: '${adults} + ${children}',
      },
      {
        description: 'multiplication',
        calculation: '${adults} * 2',
      },
      {
        description: 'subtraction with spaces around the minus',
        calculation: '${income} - ${costs}',
      },
      {
        description: 'division with div',
        calculation: '${total} div ${members}',
      },
      {
        description: 'a numeric function',
        calculation: 'round(${score}, 2)',
      },
      {
        description: 'string-length: a text function that returns a number',
        calculation: 'string-length(${name})',
      },
      {
        description: 'arithmetic on a question name that contains div',
        calculation: '${household-div} + 1',
      },
      {
        description: 'a numeric wrapper around a nested text function',
        calculation: 'number(substr(${identifier}, 0, 3))',
      },
      {
        description: 'a numeric wrapper around a quoted number',
        calculation: "number('42')",
      },
      {
        description: 'string-length around a nested concat',
        calculation: 'string-length(concat(${first}, ${last}))',
      },
      {
        description: 'a parenthesized addition',
        calculation: '(${adults} + ${children})',
      },
      {
        description: 'a doubly parenthesized addition',
        calculation: '((${adults} + ${children}))',
      },
      {
        description: 'a parenthesized constant',
        calculation: '(42)',
      },
      {
        description: 'a parenthesized numeric function',
        calculation: '(round(${score}))',
      },
      {
        description: 'two separate parenthesized groups multiplied',
        calculation: '(${a} + 1) * (${b} + 2)',
      },
      {
        description: 'a multiplication of two references',
        calculation: '${a} * ${b}',
      },
      {
        description: 'count of a wildcard path',
        calculation: 'count(/data/*)',
      },
      {
        description: 'a conditional with numbers in both branches',
        calculation: 'if(${score} > 5, 1, 0)',
      },
      {
        description:
          'a conditional returning a reference that the condition compares to a number',
        calculation: 'if(${a} > 0, ${a}, 0)',
      },
      {
        description: 'a conditional with a number on the left of the comparison',
        calculation: 'if(0 < ${a}, ${a}, 0)',
      },
      {
        description: 'a conditional with numeric calculations in both branches',
        calculation: 'if(${a} = 1, ${b} + 1, round(${c}))',
      },
      {
        description: 'a parenthesized conditional',
        calculation: '(if(${a} > 0, ${a}, 0))',
      },
      {
        description: 'a nested conditional with numbers',
        calculation: 'if(${a} > 0, if(${b} > 0, 1, 2), 0)',
      },
      {
        description: 'a conditional with a quoted comma in the condition',
        calculation: "if(${a} = 'x,y', 1, 0)",
      },
    ])('should return numeric for $description', ({ calculation }) => {
      const result = inferAttributeTypeFromCalculation({ calculation });

      expect(result).toBe(numeric);
    });
  });

  describe('formulas that give text', () => {
    it.each([
      {
        description: 'a text function',
        calculation: "concat(${first}, ' ', ${last})",
      },
      {
        description: 'substr',
        calculation: 'substr(${name}, 0, 3)',
      },
      {
        description: 'pulldata, whose result is a lookup string',
        calculation: "pulldata('table', 'column', 'key', ${id})",
      },
      {
        description: 'a conditional with a quoted text result',
        calculation: "if(${score} > 5, 'high', 'low')",
      },
      {
        description: 'a quoted string that contains an operator',
        calculation: "'1 + 2'",
      },
      {
        description: 'a text function with a nested numeric function',
        calculation: "concat(string-length(${a}), 'x')",
      },
      {
        description: 'a parenthesized comparison',
        calculation: '(${a} = 1)',
      },
      {
        description: 'a parenthesized text function',
        calculation: '(concat(${a}, ${b}))',
      },
      {
        description: 'a wildcard path: * is not a multiplication',
        calculation: '/data/*',
      },
      {
        description: 'a relative wildcard path',
        calculation: '../*',
      },
      {
        description: 'a wildcard path with spaces',
        calculation: '/data/group/ *',
      },
      {
        description: 'an attribute wildcard',
        calculation: '@*',
      },
      {
        description: 'an axis wildcard',
        calculation: 'child::*',
      },
    ])('should return text for $description', ({ calculation }) => {
      const result = inferAttributeTypeFromCalculation({ calculation });

      expect(result).toBe(text);
    });
  });

  describe('formulas where we are not sure, so we choose text', () => {
    it.each([
      {
        description: 'only a reference to another question',
        calculation: '${adults}',
      },
      {
        description:
          'a conditional returning a reference that is not compared to a number',
        calculation: 'if(${a} > 0, ${b}, 0)',
      },
      {
        description: 'a conditional returning a reference compared with =',
        calculation: 'if(${a} = 0, ${a}, 0)',
      },
      {
        description: 'a conditional with a text branch and a number branch',
        calculation: "if(${score} > 5, 1, 'unknown')",
      },
      {
        description: 'a conditional with too few arguments',
        calculation: 'if(${a} > 0, 1)',
      },
      {
        description: 'a conditional followed by more text',
        calculation: "if(${a} > 0, 1, 0) = '1'",
      },
      {
        description: 'a conditional with a text and a number branch',
        calculation: "if(${score} > 5, ${name}, 'unknown')",
      },
      {
        description: 'a numeric function only in the condition, text result',
        calculation: 'if(count(${items}) > 0, ${name}, ${other})',
      },
      {
        description: 'an operator only in the condition, text result',
        calculation: 'if(${a} + ${b} > 3, ${x}, ${y})',
      },
      {
        description: 'a comparison: the result is true or false',
        calculation: '${adults} * 1 = 5',
      },
      {
        description: 'a question name that contains div, without arithmetic',
        calculation: '${household-div}',
      },
      {
        description: 'a subtraction without spaces: could be part of a name',
        calculation: '${income}-${costs}',
      },
      {
        description: 'Infinity: Number() accepts it, but it is not a value',
        calculation: 'Infinity',
      },
      {
        description: 'a hexadecimal number: Number() accepts it',
        calculation: '0x1F',
      },
      {
        description: 'a formula we cannot classify',
        calculation: 'foo bar',
      },
    ])('should return text for $description', ({ calculation }) => {
      const result = inferAttributeTypeFromCalculation({ calculation });

      expect(result).toBe(text);
    });
  });
});
