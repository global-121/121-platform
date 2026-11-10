import { Injectable } from '@nestjs/common';

import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';

@Injectable()
export class KoboCalculationTypeInferenceService {
  /**
   * Determines whether a Kobo XPath calculation expression produces a numeric or text attribute.
   * Defaults conservatively to RegistrationAttributeTypes.text when ambiguous.
   */
  public inferAttributeTypeFromCalculation({
    calculation,
  }: {
    calculation?: string;
  }): RegistrationAttributeTypes {
    if (!calculation) {
      return RegistrationAttributeTypes.text;
    }

    const formula = this.removeEnclosingParentheses({
      formula: calculation.trim(),
    });
    if (!formula) {
      return RegistrationAttributeTypes.text;
    }

    // 1. A pure decimal number constant (e.g. "42", "3.14")
    if (DECIMAL_NUMBER_PATTERN.test(formula)) {
      return RegistrationAttributeTypes.numeric;
    }

    // A conditional returns one of its branches, so it is numeric when both branches are
    const conditional = this.parseConditional({ formula });
    if (conditional) {
      return this.isNumericConditional({ conditional })
        ? RegistrationAttributeTypes.numeric
        : RegistrationAttributeTypes.text;
    }

    // The result type is decided by the outermost operator or function.
    // Whatever is nested in brackets, references or quotes does not count.
    const topLevel = this.keepOnlyTopLevel({ formula });

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
    if (
      ARITHMETIC_OPERATOR_PATTERN.test(
        topLevel.replace(WILDCARD_NODE_TEST_PATTERN, ''),
      )
    ) {
      return RegistrationAttributeTypes.numeric;
    }

    // Default fallback to text if ambiguous
    return RegistrationAttributeTypes.text;
  }

  private parseConditional({
    formula,
  }: {
    formula: string;
  }): Conditional | undefined {
    const match = CONDITIONAL_PREFIX_PATTERN.exec(formula);
    if (!match) {
      return;
    }

    const callArguments = formula.slice(match[0].length - 1);
    if (!this.encloseWholeFormula({ formula: callArguments })) {
      return;
    }

    const [condition, thenBranch, elseBranch] = this.splitTopLevelArguments({
      formula: callArguments.slice(1, -1),
    });

    return { condition, thenBranch, elseBranch };
  }

  private isNumericConditional({
    conditional,
  }: {
    conditional: Conditional;
  }): boolean {
    return (
      this.isNumericBranch({
        branch: conditional.thenBranch,
        condition: conditional.condition,
        isReferenceProvenNumeric: true,
      }) &&
      this.isNumericBranch({
        branch: conditional.elseBranch,
        condition: conditional.condition,
        isReferenceProvenNumeric: false,
      })
    );
  }

  // Only the then-branch is reached with a reference that passed the numeric comparison
  private isNumericBranch({
    branch,
    condition,
    isReferenceProvenNumeric,
  }: {
    branch: string;
    condition: string;
    isReferenceProvenNumeric: boolean;
  }): boolean {
    if (REFERENCE_PATTERN.test(branch)) {
      return (
        isReferenceProvenNumeric &&
        this.isWholeConditionComparedToNumber({ reference: branch, condition })
      );
    }

    return (
      this.inferAttributeTypeFromCalculation({ calculation: branch }) ===
      RegistrationAttributeTypes.numeric
    );
  }

  // A reference has no known type, unless the whole condition orders it against a number (e.g. ${a} > 0)
  private isWholeConditionComparedToNumber({
    reference,
    condition,
  }: {
    reference: string;
    condition: string;
  }): boolean {
    const escapedReference = reference.replace(/[$.*+?^{}()|[\]\\]/g, '\\$&');
    const comparedToNumberPattern = new RegExp(
      `^(${escapedReference}\\s*(<=|>=|<|>)\\s*-?(\\d+\\.?\\d*|\\.\\d+)|-?(\\d+\\.?\\d*|\\.\\d+)\\s*(<=|>=|<|>)\\s*${escapedReference})$`,
    );
    return comparedToNumberPattern.test(
      this.removeEnclosingParentheses({ formula: condition }),
    );
  }

  private splitTopLevelArguments({ formula }: { formula: string }): string[] {
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
  }

  private removeEnclosingParentheses({ formula }: { formula: string }): string {
    let unwrapped = formula;

    while (this.encloseWholeFormula({ formula: unwrapped })) {
      unwrapped = unwrapped.slice(1, -1).trim();
    }

    return unwrapped;
  }

  private encloseWholeFormula({ formula }: { formula: string }): boolean {
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
  }

  private keepOnlyTopLevel({ formula }: { formula: string }): string {
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
  }
}

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

// `*` directly after a path separator, attribute or axis selects nodes instead of multiplying
const WILDCARD_NODE_TEST_PATTERN = /(\/|@|::)\*/g;

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

interface Conditional {
  condition: string;
  thenBranch: string;
  elseBranch: string;
}
