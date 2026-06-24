import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  model,
  output,
  Signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { MultiSelectModule } from 'primeng/multiselect';

import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';

import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';
export interface FspMultiselectOption {
  name: string;
}

@Component({
  selector: 'app-fsp-multiselect',
  imports: [
    FormFieldWrapperComponent,
    FormsModule,
    MultiSelectModule,
    TranslatableStringPipe,
  ],
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
export class FspMultiselectComponent implements ControlValueAccessor {
  readonly programId = input<string>();

  readonly selectedOptions = model<Fsps[]>([]);
  readonly selectionChange = output<Fsps[]>();

  readonly fspConfigurationApiService = inject(FspConfigurationApiService);

  // Fetch FSP configurations for the given program ID. If no program ID is provided, the query will be skipped.
  fspConfigurations = injectQuery(() => ({
    ...this.fspConfigurationApiService.getFspConfigurations(
      this.programId as Signal<string>,
    )(),
    enabled: !!this.programId(),
  }));

  readonly fspMultiselectOptions = Object.values(FSP_SETTINGS).map((fsp) => {
    console.log('fsp -->', fsp);
    return {
      fspName: fsp.name,
      name: fsp.defaultLabel.en,
    };
  });

  constructor() {
    effect(() => {
      if (this.fspConfigurations.data()) {
        const fsps =
          this.fspConfigurations.data()?.map((fspConfiguration) => {
            console.log('fspConfiguration -->', fspConfiguration.fspName);
            return fspConfiguration.fspName;
          }) ?? [];

        console.log('I am in the effect', fsps);

        this.selectedOptions.set(fsps);
        this.selectionChange.emit(fsps);

        console.log('I fired');
        console.log('I set selectedOptions', fsps);
        console.log('I emitted selectionChange', fsps);
      }
    });
  }

  writeValue(value: Fsps[] | null) {
    this.selectedOptions.set(value ?? []);
  }

  registerOnChange(fn: (value: Fsps[]) => void) {
    this.selectedOptions.subscribe(fn);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function -- Required by ControlValueAccessor, needs to be implemented but can be empty
  registerOnTouched() {}
}
