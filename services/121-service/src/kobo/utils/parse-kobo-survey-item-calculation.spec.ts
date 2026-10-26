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
          // the result here is always numeric, but detecting that requires parsing if branches,
          // and a wrongly-text result is recoverable while wrongly-numeric loses registrations
          'a conditional with numbers in both branches',
        calculation: 'if(${score} > 5, 1, 0)',
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
