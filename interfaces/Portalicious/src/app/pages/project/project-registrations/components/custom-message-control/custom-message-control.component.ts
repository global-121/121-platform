import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';

import { TooltipModule } from 'primeng/tooltip';

import { InfoTooltipComponent } from '~/components/info-tooltip/info-tooltip.component';

@Component({
  selector: 'app-custom-message-control',
  standalone: true,
  imports: [InfoTooltipComponent, TooltipModule, ReactiveFormsModule],
  templateUrl: './custom-message-control.component.html',
  styles: ``,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomMessageControlComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomMessageControlComponent implements ControlValueAccessor {
  formControlName = input.required<string>();

  writeValue(value: string): void {
    console.log(value);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  registerOnChange(): void {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  registerOnTouched(): void {}
}
