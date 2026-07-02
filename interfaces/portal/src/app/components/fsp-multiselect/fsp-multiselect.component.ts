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
import { TranslatableStringService } from '~/services/translatable-string.service';

@Component({
  selector: 'app-fsp-multiselect',
  imports: [FormFieldWrapperComponent, FormsModule, MultiSelectModule],
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
  readonly translatableStringService = inject(TranslatableStringService);

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
    const uniqueFsps = new Set<Fsps>();

    // Removing possible duplicates (Excel)
    return fsps.flatMap((fsp) => {
      if (uniqueFsps.has(fsp.name)) {
        return [];
      }

      uniqueFsps.add(fsp.name);

      return [
        {
          fspName: fsp.name,
          defaultLabel: fsp.defaultLabel,
          translatedLabel:
            this.translatableStringService.translate(fsp.defaultLabel) ?? '',
        },
      ];
    });
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
    const uniqueFsps = [...new Set(fsps)]; // Removing possible duplicates (Excel)
    this.selectedOptions.set(uniqueFsps);

    if (notifyForm) {
      this.onChange(uniqueFsps);
    }
  }
}
