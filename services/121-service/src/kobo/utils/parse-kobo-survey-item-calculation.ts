import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';

/**
 * Functions in XPath / ODK that strictly produce string output.
 */
const XPATH_STRING_FUNCTIONS = [
  'concat',
  'substr',
  'substring-before',
  'substring-after',
  'translate',
  'normalize-space',
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
  'abs',
  'pow',
  'min',
  'max',
  'string-length',
] as const;

const QUOTE_CHARACTERS = new Set(['"', "'"]);

const DECIMAL_NUMBER_PATTERN = /^-?(\d+\.?\d*|\.\d+)$/;

const QUOTED_LITERAL_PATTERN = /["']/;

const CONDITIONAL_PREFIX_PATTERN = /^if\s*\(/i;

const REFERENCE_PATTERN = /^\$\{[^}]+\}$/;

const BOOLEAN_OPERATOR_PATTERN = /[<>=]|\b(and|or)\b/i;

const ARITHMETIC_OPERATOR_PATTERN = /\*|\+|\s-\s|\b(div|mod)\b/i;

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

  const formula = removeEnclosingParentheses({ formula: calculation.trim() });
  if (!formula) {
    return RegistrationAttributeTypes.text;
  }

  // 1. A pure decimal number constant (e.g. "42", "3.14")
  if (DECIMAL_NUMBER_PATTERN.test(formula)) {
    return RegistrationAttributeTypes.numeric;
  }

  // A conditional returns one of its branches, so it is numeric when both branches are
  const conditional = parseConditional({ formula });
  if (conditional) {
    return isNumericConditional({ conditional })
      ? RegistrationAttributeTypes.numeric
      : RegistrationAttributeTypes.text;
  }

  // The result type is decided by the outermost operator or function.
  // Whatever is nested in brackets, references or quotes does not count.
  const topLevel = keepOnlyTopLevel({ formula });

  // 2. A comparison or logical operator makes the result true/false, whatever is calculated inside
  if (BOOLEAN_OPERATOR_PATTERN.test(topLevel)) {
    return RegistrationAttributeTypes.text;
  }

  // 3. A function that guarantees a numeric return (e.g. round(...), count-selected(...))
  if (NUMERIC_FUNCTION_PATTERN.test(topLevel)) {
    return RegistrationAttributeTypes.numeric;
  }

  // 4. A function that guarantees a text return (e.g. concat(...))
  if (STRING_FUNCTION_PATTERN.test(topLevel)) {
    return RegistrationAttributeTypes.text;
  }

  // 5. Quoted string literals (e.g. if(${a} = 1, 'high', 'low')) are conservatively treated as text
  if (QUOTED_LITERAL_PATTERN.test(formula)) {
    return RegistrationAttributeTypes.text;
  }

  // 6. Arithmetic operators always return a number in XPath
  if (ARITHMETIC_OPERATOR_PATTERN.test(topLevel)) {
    return RegistrationAttributeTypes.numeric;
  }

  // Default fallback to text if ambiguous
  return RegistrationAttributeTypes.text;
};

interface Conditional {
  condition: string;
  thenBranch: string;
  elseBranch: string;
}

const parseConditional = ({
  formula,
}: {
  formula: string;
}): Conditional | undefined => {
  const match = CONDITIONAL_PREFIX_PATTERN.exec(formula);
  if (!match) {
    return;
  }

  const callArguments = formula.slice(match[0].length - 1);
  if (!encloseWholeFormula({ formula: callArguments })) {
    return;
  }

  const [condition, thenBranch, elseBranch] = splitTopLevelArguments({
    formula: callArguments.slice(1, -1),
  });

  return { condition, thenBranch, elseBranch };
};

const isNumericConditional = ({
  conditional,
}: {
  conditional: Conditional;
}): boolean =>
  [conditional.thenBranch, conditional.elseBranch].every((branch) =>
    isNumericBranch({ branch, condition: conditional.condition }),
  );

const isNumericBranch = ({
  branch,
  condition,
}: {
  branch: string;
  condition: string;
}): boolean => {
  if (REFERENCE_PATTERN.test(branch)) {
    return isComparedToNumber({ reference: branch, condition });
  }

  return (
    inferAttributeTypeFromCalculation({ calculation: branch }) ===
    RegistrationAttributeTypes.numeric
  );
};

// A reference has no known type, unless the condition orders it against a number (e.g. ${a} > 0)
const isComparedToNumber = ({
  reference,
  condition,
}: {
  reference: string;
  condition: string;
}): boolean => {
  const escapedReference = reference.replace(/[$.*+?^{}()|[\]\\]/g, '\\$&');
  const comparedToNumberPattern = new RegExp(
    `${escapedReference}\\s*(<=|>=|<|>)\\s*-?[\\d.]|[\\d.]\\s*(<=|>=|<|>)\\s*${escapedReference}`,
  );
  return comparedToNumberPattern.test(condition);
};

const splitTopLevelArguments = ({ formula }: { formula: string }): string[] => {
  const callArguments: string[] = [];
  let currentArgument = '';
  let bracketDepth = 0;
  let quoteCharacter: string | undefined;
  let isInsideReference = false;

  for (const character of formula) {
    if (quoteCharacter) {
      if (character === quoteCharacter) {
        quoteCharacter = undefined;
      }
    } else if (isInsideReference) {
      if (character === '}') {
        isInsideReference = false;
      }
    } else if (QUOTE_CHARACTERS.has(character)) {
      quoteCharacter = character;
    } else if (character === '$') {
      isInsideReference = true;
    } else if (character === '(') {
      bracketDepth += 1;
    } else if (character === ')') {
      bracketDepth -= 1;
    } else if (character === ',' && bracketDepth === 0) {
      callArguments.push(currentArgument.trim());
      currentArgument = '';
      continue;
    }

    currentArgument += character;
  }

  callArguments.push(currentArgument.trim());

  return callArguments;
};

const removeEnclosingParentheses = ({
  formula,
}: {
  formula: string;
}): string => {
  let unwrapped = formula;

  while (encloseWholeFormula({ formula: unwrapped })) {
    unwrapped = unwrapped.slice(1, -1).trim();
  }

  return unwrapped;
};

const encloseWholeFormula = ({ formula }: { formula: string }): boolean => {
  if (!formula.startsWith('(') || !formula.endsWith(')')) {
    return false;
  }

  let bracketDepth = 0;
  let quoteCharacter: string | undefined;
  let isInsideReference = false;

  for (const [index, character] of [...formula].entries()) {
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
    } else if (character === '$') {
      isInsideReference = true;
    } else if (character === '(') {
      bracketDepth += 1;
    } else if (character === ')') {
      bracketDepth -= 1;
      if (bracketDepth === 0) {
        return index === formula.length - 1;
      }
    }
  }

  return false;
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
