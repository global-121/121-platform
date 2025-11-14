import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
  signal,
  viewChild,
} from '@angular/core';
import { FormGroup } from '@angular/forms';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { CardEditableComponent } from '~/components/card-editable/card-editable.component';
import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import {
  ProgramFormInformationComponent,
  ProgramInformationFormGroup,
} from '~/components/program-form-information/program-form-information.component';
import {
  ProgramFormNameComponent,
  ProgramNameFormGroup,
} from '~/components/program-form-name/program-form-name.component';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { PROGRAM_FORM_TOOLTIPS } from '~/domains/program/program.helper';
import { AuthService } from '~/services/auth.service';
import { RegistrationsTableColumnService } from '~/services/registrations-table-column.service';
import { ToastService } from '~/services/toast.service';
import { TranslatableStringService } from '~/services/translatable-string.service';
import {
  getLanguageEnumFromLocale,
  getLocaleLabel,
  Locale,
} from '~/utils/locale';

@Component({
  selector: 'app-program-settings-basic-information',
  imports: [
    CardEditableComponent,
    ProgramFormNameComponent,
    ProgramFormInformationComponent,
    DataListComponent,
  ],
  templateUrl: './program-settings-basic-information.component.html',
  providers: [ToastService],
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramSettingsBasicInformationComponent {
  private locale = inject<Locale>(LOCALE_ID);
  private currentLocale = getLanguageEnumFromLocale(this.locale);
  languageName = getLocaleLabel(this.locale);

  readonly programId = input.required<string>();

  readonly isEditing = signal(false);

  authService = inject(AuthService);
  programApiService = inject(ProgramApiService);
  registrationsTableColumnService = inject(RegistrationsTableColumnService);
  toastService = inject(ToastService);
  translatableStringService = inject(TranslatableStringService);

  program = injectQuery(this.programApiService.getProgram(this.programId));

  readonly canEdit = computed(() =>
    this.authService.hasPermission({
      programId: this.programId(),
      requiredPermission: PermissionEnum.ProgramUPDATE,
    }),
  );

  readonly programFormName =
    viewChild<ProgramFormNameComponent>('programFormName');
  readonly programFormInformation = viewChild<ProgramFormInformationComponent>(
    'programFormInformation',
  );

  // These are two separate components/formGroups because they are also
  // used separately in the program creation flow
  readonly formGroup = computed(() => {
    const nameGroup = this.programFormName()?.formGroup;
    const informationGroup = this.programFormInformation()?.formGroup;

    if (!nameGroup || !informationGroup) {
      return undefined;
    }

    return new FormGroup({
      nameGroup,
      informationGroup,
    });
  });

  updateProgramMutation = injectMutation(() => ({
    mutationFn: async ({
      nameGroup: { name, description },
      informationGroup: {
        startDate,
        endDate,
        location,
        targetNrRegistrations,
        validation,
        enableScope,
      },
    }: ReturnType<
      FormGroup<{
        nameGroup: ProgramNameFormGroup;
        informationGroup: ProgramInformationFormGroup;
      }>['getRawValue']
    >) =>
      this.programApiService.updateProgram({
        programId: this.programId,
        programPatch: {
          titlePortal: {
            [this.currentLocale]: name,
          },
          description: {
            [this.currentLocale]: description,
          },
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          location,
          targetNrRegistrations,
          validation,
          enableScope,
        },
      }),
    onSuccess: () => {
      this.toastService.showToast({
        detail: $localize`Basic information details saved successfully.`,
      });

      void this.programApiService.invalidateCache(this.programId);
      void this.registrationsTableColumnService.invalidateCache(this.programId);
    },
  }));

  readonly programBasicInformationData = computed(() => {
    const programData = this.program.data();

    const listData: DataListItem[] = [
      {
        label: '*' + $localize`Program name`,
        value: this.translatableStringService.translate(
          programData?.titlePortal,
        ),
        fullWidth: true,
      },
      {
        label: $localize`Program description`,
        value: this.translatableStringService.translate(
          programData?.description,
        ),
        fullWidth: true,
      },
      {
        label: $localize`Start date`,
        value: programData?.startDate,
        type: 'date',
      },
      {
        label: $localize`End date`,
        value: programData?.endDate,
        type: 'date',
      },
      {
        label: $localize`Location`,
        value: programData?.location,
        fullWidth: true,
      },
      {
        label: '*' + $localize`Target registrations`,
        value: programData?.targetNrRegistrations,
        fullWidth: true,
        type: 'number',
        tooltip: PROGRAM_FORM_TOOLTIPS.targetRegistrations,
      },
      {
        label: $localize`Enable validation`,
        value: programData?.validation ?? false,
        fullWidth: true,
        type: 'boolean',
        tooltip: PROGRAM_FORM_TOOLTIPS.validationProcess,
      },
      {
        label: $localize`Enable scope`,
        value: programData?.enableScope ?? false,
        fullWidth: true,
        type: 'boolean',
        tooltip: PROGRAM_FORM_TOOLTIPS.enableScope,
      },
    ];

    return [...listData].map((item) => ({
      ...item,
      loading: this.program.isPending(),
    }));
  });
}
