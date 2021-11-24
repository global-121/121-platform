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
    return new RegExp(event.target.pattern).test(event.key);
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent | any) {
    event.preventDefault();
    const invertPattern = new RegExp(
      `${event.target.pattern.replace('[', '[^')}`,
      'g',
    );
    const pasteData = event.clipboardData.getData('text/plain');
    const stripped = pasteData.replace(invertPattern, '');
    document.execCommand('insertText', false, stripped);
  }
}
