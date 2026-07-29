import { AutoFocus } from 'primeng/autofocus';

export const patchPrimeNgAutoFocus = (): void => {
  const originalAutoFocus = AutoFocus.prototype.autoFocus.bind(
    AutoFocus.prototype,
  );
  const originalAfterContentChecked =
    AutoFocus.prototype.onAfterContentChecked.bind(AutoFocus.prototype);
  const originalAfterViewChecked = AutoFocus.prototype.onAfterViewChecked.bind(
    AutoFocus.prototype,
  );

  AutoFocus.prototype.onAfterContentChecked = function (this: AutoFocus) {
    if (!this.autofocus) {
      (this.host.nativeElement as HTMLElement).removeAttribute('autofocus');
      this.focused = true;
      return;
    }

    originalAfterContentChecked.call(this);
  };

  AutoFocus.prototype.onAfterViewChecked = function (this: AutoFocus) {
    if (!this.autofocus) {
      this.focused = true;
      return;
    }

    originalAfterViewChecked.call(this);
  };

  AutoFocus.prototype.autoFocus = function (this: AutoFocus) {
    if (!this.autofocus) {
      (this.host.nativeElement as HTMLElement).removeAttribute('autofocus');
      this.focused = true;
      return;
    }

    originalAutoFocus.call(this);
  };
};
