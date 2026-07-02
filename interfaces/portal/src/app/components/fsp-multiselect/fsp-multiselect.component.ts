import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  Signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { MultiSelectModule } from 'primeng/multiselect';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';

import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { FspApiService } from '~/domains/fsp/fsp.api.service';
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
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FspMultiselectComponent),
      multi: true,
    },
  ],
})
export class FspMultiselectComponent implements ControlValueAccessor {
  readonly programId = input<string>();
  readonly selectedOptions = model<Fsps[]>([]);

  // Services
  readonly fspConfigurationApiService = inject(FspConfigurationApiService);
  readonly fspApiService = inject(FspApiService);

  isDisabled = false;

  private onChange: (value: Fsps[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  // Fetch FSP configurations for the given program ID. If no program ID is provided, the query will be skipped.
  fspConfigurations = injectQuery(() => ({
    ...this.fspConfigurationApiService.getFspConfigurations(
      this.programId as Signal<string>,
    )(),
    enabled: !!this.programId(),
  }));

  readonly enabledFsps = injectQuery(this.fspApiService.getAllEnabledFsps());

  readonly fspMultiselectOptions = computed(() => {
    const fsps = this.enabledFsps.data() ?? [];
    return fsps.map((fsp) => ({
      fspName: fsp.name,
      name: fsp.defaultLabel.en,
    }));
  });

  constructor() {
    effect(() => {
      if (this.fspConfigurations.data()) {
        const fsps =
          this.fspConfigurations.data()?.map((fspConfiguration) => {
            return fspConfiguration.fspName;
          }) ?? [];

        this.updateSelection({
          fsps,
          notifyForm: true,
        });
      }
    });
  }

  writeValue(value: Fsps[] | null): void {
    this.updateSelection({
      fsps: value ?? [],
      notifyForm: false,
    });
  }

  registerOnChange(fn: (value: Fsps[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  onSelectionChange(fsps: Fsps[]): void {
    this.updateSelection({ fsps, notifyForm: true });
  }

  markAsTouched(): void {
    this.onTouched();
  }

  private updateSelection({
    fsps,
    notifyForm,
  }: {
    fsps: Fsps[];
    notifyForm: boolean;
  }): void {
    this.selectedOptions.set(fsps);

    if (notifyForm) {
      this.onChange(fsps);
    }
  }
}
