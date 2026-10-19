import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';

/**
 * Functions in XPath / ODK that strictly produce string output.
 */
const XPATH_STRING_FUNCTIONS = [
  'concat',
  'substr',
  'substring',
  'substring-before',
  'substring-after',
  'translate',
  'normalize-space',
  'lower-case',
  'upper-case',
  'string',
  'pulldata',
  'join',
] as const;

/**
 * Functions in XPath / ODK that strictly produce numeric output.
 */
const XPATH_NUMERIC_FUNCTIONS = [
  'sum',
  'count',
  'count-selected',
  'int',
  'number',
  'round',
  'floor',
  'ceiling',
  'abs',
  'pow',
  'min',
  'max',
  'string-length',
] as const;

const QUOTE_CHARACTERS = new Set(['"', "'"]);

const DECIMAL_NUMBER_PATTERN = /^-?(\d+\.?\d*|\.\d+)$/;

const BOOLEAN_OPERATOR_PATTERN = /[<>=]|\b(and|or)\b/i;

const ARITHMETIC_OPERATOR_PATTERN = /[+*]|\s-\s|\b(div|mod)\b/i;

const toFunctionCallPattern = ({
  functionNames,
}: {
  functionNames: readonly string[];
}): RegExp => new RegExp(`\\b(${functionNames.join('|')})\\s*\\(`, 'i');

const STRING_FUNCTION_PATTERN = toFunctionCallPattern({
  functionNames: XPATH_STRING_FUNCTIONS,
});

const NUMERIC_FUNCTION_PATTERN = toFunctionCallPattern({
  functionNames: XPATH_NUMERIC_FUNCTIONS,
});

/**
 * Determines whether a Kobo XPath calculation expression produces a numeric or text attribute.
 * Defaults conservatively to RegistrationAttributeTypes.text when ambiguous.
 */
export const inferAttributeTypeFromCalculation = ({
  calculation,
}: {
  calculation?: string;
}): RegistrationAttributeTypes => {
  if (!calculation) {
    return RegistrationAttributeTypes.text;
  }

  const trimmed = calculation.trim();
  if (!trimmed) {
    return RegistrationAttributeTypes.text;
  }

  // 1. A pure decimal number constant (e.g. "42", "3.14")
  if (DECIMAL_NUMBER_PATTERN.test(trimmed)) {
    return RegistrationAttributeTypes.numeric;
  }

  // 2. If it contains explicit string-producing functions, it's text
  if (STRING_FUNCTION_PATTERN.test(trimmed)) {
    return RegistrationAttributeTypes.text;
  }

  // 3. Check for quoted string literals (e.g., 'hello' or "world")
  // In ODK, string literals inside calculations (e.g. in if() statements or default fallbacks)
  // mean the expression returns text, unless they are purely inside an equality check condition.
  // To be safe: if there are quotes, check whether they represent returned values rather than comparisons.
  const containsQuotes = /["']/.test(trimmed);
  if (containsQuotes) {
    // If the calculation uses if(...) with string outcomes like if(${a} = 1, 'high', 'low'), it's text.
    // If quotes are present, we conservatively treat it as text unless explicitly confirmed otherwise.
    return RegistrationAttributeTypes.text;
  }

  // The result type is decided by the outermost operator or function.
  // Whatever is nested in brackets, references or quotes does not count.
  const topLevel = keepOnlyTopLevel({ formula: trimmed });

  // 4. A comparison or logical operator makes the result true/false, whatever is calculated inside
  if (BOOLEAN_OPERATOR_PATTERN.test(topLevel)) {
    return RegistrationAttributeTypes.text;
  }

  // 5. A function that guarantees a numeric return (e.g. round(...), count-selected(...))
  if (NUMERIC_FUNCTION_PATTERN.test(topLevel)) {
    return RegistrationAttributeTypes.numeric;
  }

  // 6. Arithmetic operators always return a number in XPath
  if (ARITHMETIC_OPERATOR_PATTERN.test(topLevel)) {
    return RegistrationAttributeTypes.numeric;
  }

  // Default fallback to text if ambiguous
  return RegistrationAttributeTypes.text;
};

const keepOnlyTopLevel = ({ formula }: { formula: string }): string => {
  let topLevel = '';
  let bracketDepth = 0;
  let quoteCharacter: string | undefined;
  let isInsideReference = false;

  for (const character of formula) {
    if (quoteCharacter) {
      if (character === quoteCharacter) {
        quoteCharacter = undefined;
      }
      continue;
    }

    if (isInsideReference) {
      if (character === '}') {
        isInsideReference = false;
      }
      continue;
    }

    if (QUOTE_CHARACTERS.has(character)) {
      quoteCharacter = character;
      continue;
    }

    if (character === '$') {
      isInsideReference = true;
      continue;
    }

    if (character === ')') {
      bracketDepth = Math.max(bracketDepth - 1, 0);
    }

    if (bracketDepth === 0) {
      topLevel += character;
    }

    if (character === '(') {
      bracketDepth += 1;
    }
  }

  return topLevel;
};
