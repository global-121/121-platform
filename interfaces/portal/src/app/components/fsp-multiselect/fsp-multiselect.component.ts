import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  Signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { MultiSelectModule } from 'primeng/multiselect';

import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';

import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { FspConfigurationApiService } from '~/domains/fsp-configuration/fsp-configuration.api.service';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';

@Component({
  selector: 'app-fsp-multiselect',
  imports: [
    FormFieldWrapperComponent,
    FormsModule,
    MultiSelectModule,
    TranslatableStringPipe,
  ],
  templateUrl: './fsp-multiselect.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FspMultiselectComponent {
  readonly programId = input<string>();

  readonly selectedOptions = model<Fsps[]>([]);
  readonly selectionChange = output<Fsps[]>();
  readonly direction = input<'bottom' | 'top'>('top');

  readonly className = computed(() =>
    this.direction() === 'bottom'
      ? 'wrapped-chip-multiselect wrapped-chip-multiselect-direction-bottom'
      : 'wrapped-chip-multiselect',
  );

  readonly fspConfigurationApiService = inject(FspConfigurationApiService);

  // Fetch FSP configurations for the given program ID. If no program ID is provided, the query will be skipped.
  fspConfigurations = injectQuery(() => ({
    ...this.fspConfigurationApiService.getFspConfigurations(
      this.programId as Signal<string>,
    )(),
    enabled: !!this.programId(),
  }));

  readonly fspMultiselectOptions = Object.values(FSP_SETTINGS).map((fsp) => {
    return {
      name: fsp.name,
      label: fsp.defaultLabel,
    };
  });

  constructor() {
    effect(() => {
      if (this.fspConfigurations.data()) {
        const fsps =
          this.fspConfigurations.data()?.map((fspConfiguration) => {
            return fspConfiguration.fspName;
          }) ?? [];

        this.selectedOptions.set(fsps);
        this.selectionChange.emit(fsps);
      }
    });
  }
}

/*
@TODO: Check if we can use the `ControlValueAccessor` interface instead of manually implementing `writeValue` and `registerOnChange`.
This would allow us to use the component with Angular forms more seamlessly.

 providers: [
   {
     provide: NG_VALUE_ACCESSOR,
     useExisting: FspMultiselectComponent,
     multi: true,
   },
 ],

  writeValue(value: Fsps[] | null) {
    this.selectedOptions.set(value ?? []);
  }

  registerOnChange(fn: (value: Fsps[]) => void) {
    this.selectedOptions.subscribe(fn);
  }

  etc...

*/
