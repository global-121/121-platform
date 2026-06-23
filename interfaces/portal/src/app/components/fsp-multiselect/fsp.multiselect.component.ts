import {
  ChangeDetectionStrategy,
  Component,
  model,
  OnInit,
  output,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

import { MultiSelectModule } from 'primeng/multiselect';

import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';

import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';

export interface FspMultiselectOption {
  name: string;
}

// In the component:

@Component({
  selector: 'app-fsp-multiselect',
  imports: [FormFieldWrapperComponent, FormsModule, MultiSelectModule],
  templateUrl: './fsp.multiselect.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: FspMultiselectComponent,
      multi: true,
    },
  ],
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FspMultiselectComponent implements ControlValueAccessor, OnInit {
  readonly selectedOptions = model<FspMultiselectOption[]>([]);
  readonly selectionChange = output<FspMultiselectOption[]>();

  readonly fspMultiselectOptions = Object.values(FSP_SETTINGS).map((fsp) => ({
    name: fsp.defaultLabel.en,
  }));

  writeValue(value: FspMultiselectOption[] | null) {
    this.selectedOptions.set(value ?? []);
  }

  registerOnChange(fn: (value: FspMultiselectOption[]) => void) {
    this.selectedOptions.subscribe(fn);
  }

  ngOnInit() {
    console.log(
      'FspMultiselectComponent initialized',
      this.fspMultiselectOptions,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function -- Required by ControlValueAccessor, needs to be implemented but can be empty
  registerOnTouched() {}
}
