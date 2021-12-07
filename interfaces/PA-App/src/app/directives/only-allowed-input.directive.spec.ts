import { async } from '@angular/core/testing';
import { OnlyAllowedInputDirective } from './only-allowed-input.directive';

describe('OnlyAllowedInputDirective', () => {
  let testElement;
  let directive;

  beforeEach(async(() => {
    testElement = document.createElement('input');
    directive = new OnlyAllowedInputDirective();
  }));

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });

  it('should not accept a-z characters', () => {
    testElement.pattern = '[0-9+]';
    const testEvent = {
      target: testElement,
      key: 'a',
    };

    expect(directive.onKeyPress(testEvent)).toBeFalse();
  });

  it('should accept 0-9 characters', () => {
    testElement.pattern = '[0-9+]';
    const testEvent = {
      target: testElement,
      key: '9',
    };

    expect(directive.onKeyPress(testEvent)).toBeTrue();
  });

  it('should only accept specified characters', () => {
    testElement.pattern = '[abc]';
    const inputs = ['a', 'b', 'c'];

    inputs.forEach((input) => {
      expect(
        directive.onKeyPress({
          target: testElement,
          key: input,
        }),
      ).toBeTrue();
    });
  });

  it('should not accept not-specified characters', () => {
    testElement.pattern = '[abc]';
    const inputs = ['x', ' ', '/', ''];

    inputs.forEach((input) => {
      expect(
        directive.onKeyPress({
          target: testElement,
          key: input,
        }),
      ).toBeFalse();
    });
  });

  it('should strip invalid characters from pasted input (where possible)', () => {
    const pasteSpy = spyOn(document, 'execCommand');

    const tests = [
      {
        input: 'abc123ABC',
        pattern: '[0-9+]',
        output: '123',
      },
      {
        input: '1.234,-',
        pattern: '[0-9+]',
        output: '1234',
      },
      {
        input: 'abc123ABC',
        pattern: '[A-Z+]',
        output: 'ABC',
      },
      {
        input: 'abc123ABC',
        pattern: '[a-zA-Z+]',
        output: 'abcABC',
      },
      {
        input: 'abc1234567890',
        pattern: '^\\d{10}$',
        output: '1234567890',
      },
      {
        input: '+123 45 67 890abc',
        pattern: '^+?[0-9 ]+{10}$',
        output: '+123 45 67 890abc',
      },
      {
        input: '+123 45 67 890abc',
        pattern: '^+?\\d{3} \\d{2} \\d{2} \\d{3}$',
        output: '+123 45 67 890abc',
      },
    ];

    tests.forEach((test) => {
      const getDataSpy = jasmine.createSpy().and.returnValue(test.input);
      testElement.pattern = test.pattern;

      directive.onPaste({
        preventDefault: jasmine.createSpy(),
        target: testElement,
        clipboardData: {
          getData: getDataSpy,
        },
      });
      expect(pasteSpy).toHaveBeenCalledWith('insertText', false, test.output);
    });
  });
});
