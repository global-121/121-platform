import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { CardEditableComponent } from '~/components/card-editable/card-editable.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { Attribute } from '~/domains/program/program.model';
import {
  canAddAccessGroupLevel,
  getAccessGroupAttributeNamesForSave,
  getAvailableAccessGroupAttributesByLevel,
} from '~/pages/program-settings-registration-data/components/access-groups-card/access-groups-card.helper';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';
import {
  TrackingAction,
  TrackingCategory,
} from '~/services/tracking/tracking.enums';
import { TrackingEvent } from '~/services/tracking/tracking-event.interface';
import { TranslatableStringService } from '~/services/translatable-string.service';

type AccessGroupAttributeOption = {
  labelToShow: string;
} & Attribute;

@Component({
  selector: 'app-access-groups-card',
  imports: [
    ButtonModule,
    CardEditableComponent,
    FormFieldWrapperComponent,
    ReactiveFormsModule,
    SelectModule,
  ],
  templateUrl: './access-groups-card.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessGroupsCardComponent {
  readonly programId = input.required<string>();
  readonly isEditing = signal(false);

  readonly trackSaveEventPayloads: TrackingEvent[] = [
    {
      category: TrackingCategory.programSettings,
      action: TrackingAction.programSettingsAccessGroupsSaveButtonClick,
    },
  ];

  private readonly programApiService = inject(ProgramApiService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly translatableStringService = inject(
    TranslatableStringService,
  );

  readonly canRead = computed(() =>
    this.authService.hasPermission({
      programId: this.programId(),
      requiredPermission: PermissionEnum.ProgramREAD,
    }),
  );

  readonly canEdit = computed(
    () =>
      this.authService.hasPermission({
        programId: this.programId(),
        requiredPermission: PermissionEnum.ProgramAccessGroupLevelsUPDATE,
      }) &&
      this.program.isSuccess() &&
      this.accessGroupLevels.isSuccess(),
  );

  readonly program = injectQuery(() => ({
    ...this.programApiService.getProgram(this.programId)(),
    enabled: this.canRead(),
  }));

  readonly accessGroupLevels = injectQuery(() => ({
    ...this.programApiService.getAccessGroupLevels({
      programId: this.programId,
    })(),
    enabled: this.canRead(),
  }));

  readonly dropdownRegistrationAttributes = computed<
    AccessGroupAttributeOption[]
  >(() => {
    if (!this.program.isSuccess()) {
      return [];
    }

    return this.program
      .data()
      .programRegistrationAttributes.filter(
        (attribute) => attribute.type === RegistrationAttributeTypes.dropdown,
      )
      .map((attribute) => ({
        ...attribute,
        labelToShow:
          this.translatableStringService.translate(attribute.label) ??
          attribute.name,
      }));
  });

  readonly hasNoDropdownRegistrationAttributes = computed(
    () =>
      this.program.isSuccess() &&
      this.dropdownRegistrationAttributes().length === 0,
  );

  readonly accessGroupRegistrationAttributeNames = computed(() => {
    const configuredAttributeNames =
      this.accessGroupLevels.data()?.accessGroupRegistrationAttributeNames;
    if (!configuredAttributeNames) {
      return [];
    }

    return configuredAttributeNames;
  });

  readonly configuredAccessGroupAttributes = computed(() => {
    const attributeByName = new Map(
      this.dropdownRegistrationAttributes().map((attribute) => [
        attribute.name,
        attribute,
      ]),
    );

    return this.accessGroupRegistrationAttributeNames()
      .map((name) => attributeByName.get(name))
      .filter((attribute) => attribute !== undefined);
  });

  readonly accessGroupLevelControls = new FormArray<FormControl<null | string>>(
    [],
  );

  readonly formGroup = new FormGroup({
    accessGroupRegistrationAttributeNames: this.accessGroupLevelControls,
  });

  readonly selectedAttributeNames = toSignal(
    this.accessGroupLevelControls.valueChanges,
    { initialValue: this.accessGroupLevelControls.getRawValue() },
  );

  readonly availableAttributesByLevel = computed(() => {
    return getAvailableAccessGroupAttributesByLevel({
      attributes: this.dropdownRegistrationAttributes(),
      selectedAttributeNames: this.selectedAttributeNames(),
    });
  });

  readonly canAddAccessGroupLevel = computed(() =>
    canAddAccessGroupLevel({
      levelCount: this.selectedAttributeNames().length,
    }),
  );

  readonly updateAccessGroupLevelsMutation = injectMutation(() => ({
    mutationFn: async ({
      accessGroupRegistrationAttributeNames,
    }: {
      accessGroupRegistrationAttributeNames: (null | string)[];
    }) =>
      this.programApiService.updateAccessGroupLevels({
        programId: this.programId(),
        accessGroupRegistrationAttributeNames:
          getAccessGroupAttributeNamesForSave({
            selectedAttributeNames: accessGroupRegistrationAttributeNames,
          }),
      }),
    onSuccess: () => {
      this.toastService.showToast({
        detail: $localize`Access groups saved successfully.`,
      });
    },
    onError: () => {
      this.toastService.showToast({
        severity: 'error',
        detail: $localize`An error occurred while updating.`,
      });
    },
  }));

  constructor() {
    effect(() => {
      if (this.isEditing() || !this.accessGroupLevels.isSuccess()) {
        return;
      }

      const configuredNames =
        this.accessGroupLevels.data().accessGroupRegistrationAttributeNames;
      this.accessGroupLevelControls.clear();

      for (const name of configuredNames) {
        this.accessGroupLevelControls.push(new FormControl(name));
      }

      if (configuredNames.length === 0) {
        this.accessGroupLevelControls.push(new FormControl(null));
      }
    });
  }

  getLevelLabel({ levelIndex }: { levelIndex: number }): string {
    const levelNumber = levelIndex + 1;
    const prefix = levelIndex > 0 ? '↳ ' : '';

    return `${prefix}${$localize`Level ${levelNumber}`}:`;
  }

  getLevelAriaLabel({ levelIndex }: { levelIndex: number }): string {
    const levelNumber = levelIndex + 1;

    return $localize`Level ${levelNumber}`;
  }

  getRemoveLevelAriaLabel({ levelIndex }: { levelIndex: number }): string {
    const levelNumber = levelIndex + 1;

    return $localize`Remove access level ${levelNumber}`;
  }

  addAccessGroupLevel(): void {
    if (!this.canAddAccessGroupLevel()) {
      return;
    }

    this.accessGroupLevelControls.push(new FormControl(null));
  }

  removeAccessGroupLevel({ levelIndex }: { levelIndex: number }): void {
    this.accessGroupLevelControls.removeAt(levelIndex);
  }
}
