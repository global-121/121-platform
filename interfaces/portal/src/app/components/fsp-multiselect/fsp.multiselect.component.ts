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

  // FETCHING CURRENT FSP CONFIGURATIONS FOR PROGRAM
  // SKIPPED IF NO PROGRAM ID IS PROVIDED (E.G. WHEN CREATING A NEW PROGRAM)
  fspConfigurations = injectQuery(() => ({
    ...this.fspConfigurationApiService.getFspConfigurations(
      this.programId as Signal<string>,
    )(),
    enabled: !!this.programId(),
  }));

  // readonly configurableFsps = computed(() =>
  //   Object.values(FSP_SETTINGS).filter(this.canConfigureFsp.bind(this)),
  // );

  readonly fspMultiselectOptions = Object.values(FSP_SETTINGS).map((fsp) => ({
    name: fsp.defaultLabel.en,
  }));

  constructor() {
    effect(() => {
      const fsps = this.fspConfigurations.data()?.map((c) => c.fspName) ?? [];
      this.selectedOptions.set(fsps);
      this.selectionChange.emit(fsps);
    });
  }

  // private canConfigureFsp({ name }: { name: Fsps }) {
  //   if (name === Fsps.excel) {
  //     // @TODO: This will be a problem when adding via program flow
  //     // Can always add multiple Excel FSP configurations
  //     return true;
  //   }

  //   // For other FSPs, only allow adding if not already configured
  //   return this.fspConfigurations
  //     .data()
  //     ?.every((fspConfiguration) => fspConfiguration.fspName !== name);
  // }

  writeValue(value: Fsps[] | null) {
    this.selectedOptions.set(value ?? []);
  }

  registerOnChange(fn: (value: Fsps[]) => void) {
    this.selectedOptions.subscribe(fn);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function -- Required by ControlValueAccessor, needs to be implemented but can be empty
  registerOnTouched() {}
}
