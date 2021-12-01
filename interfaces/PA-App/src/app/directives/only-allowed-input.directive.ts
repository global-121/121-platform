import { Directive, HostListener } from '@angular/core';

/**
 * Make the input-element ONLY accept input as defined in the `pattern`-attribute.
 */
@Directive({
  selector: '[appOnlyAllowedInput]',
})
export class OnlyAllowedInputDirective {
  constructor() {}

  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent | any) {
    let pattern = event.target.pattern;

    if (!pattern) {
      return true;
    }

    // Strip quantifiers from pattern, to match single characters
    pattern = this.stripQuantifiers(pattern);

    return new RegExp(pattern).test(event.key);
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent | any) {
    if (!event.target.pattern) {
      return;
    }
    event.preventDefault();

    let pattern = event.target.pattern;

    pattern = this.stripStartEnd(pattern);
    pattern = this.stripQuantifiers(pattern);
    pattern = this.invertCharacterRanges(pattern);
    pattern = this.invertDigits(pattern);

    let invertedPattern = new RegExp('');
    try {
      invertedPattern = new RegExp(pattern, 'g');
    } catch (error) {}

    const pasteData: string = event.clipboardData.getData('text/plain');
    const stripped = pasteData.replace(invertedPattern, '');
    document.execCommand('insertText', false, stripped);
  }

  private stripQuantifiers(patternValue: string): string {
    let pattern = patternValue;

    const quantifiersPattern = new RegExp(/\{[0-9]+\}/, 'g');
    if (quantifiersPattern.test(pattern)) {
      pattern = pattern.replace(quantifiersPattern, '');
    }

    return pattern;
  }

  private stripStartEnd(patternValue: string): string {
    let pattern = patternValue;

    pattern = pattern.replace(/^\^/, '');
    pattern = pattern.replace(/\$$/, '');

    return pattern;
  }

  private invertCharacterRanges(patternValue: string): string {
    let pattern = patternValue;

    if (new RegExp(/\[/).test(pattern)) {
      pattern = pattern.replace('[', '[^');
    }

    return pattern;
  }
  private invertDigits(patternValue: string): string {
    let pattern = patternValue;

    if (new RegExp(/\\d/).test(pattern)) {
      pattern = pattern.replace(/d/g, 'D');
    }

    return pattern;
  }
}
