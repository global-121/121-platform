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
  ProjectFormInformationComponent,
  ProjectInformationFormGroup,
} from '~/components/project-form-information/project-form-information.component';
import {
  ProjectFormNameComponent,
  ProjectNameFormGroup,
} from '~/components/project-form-name/project-form-name.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { PROJECT_FORM_TOOLTIPS } from '~/domains/project/project.helper';
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
  selector: 'app-project-settings-basic-information',
  imports: [
    CardEditableComponent,
    ProjectFormNameComponent,
    ProjectFormInformationComponent,
    DataListComponent,
  ],
  templateUrl: './project-settings-basic-information.component.html',
  providers: [ToastService],
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSettingsBasicInformationComponent {
  private locale = inject<Locale>(LOCALE_ID);
  private currentLocale = getLanguageEnumFromLocale(this.locale);
  languageName = getLocaleLabel(this.locale);

  readonly projectId = input.required<string>();

  readonly isEditing = signal(false);

  authService = inject(AuthService);
  projectApiService = inject(ProjectApiService);
  registrationsTableColumnService = inject(RegistrationsTableColumnService);
  toastService = inject(ToastService);
  translatableStringService = inject(TranslatableStringService);

  project = injectQuery(this.projectApiService.getProject(this.projectId));

  readonly canEdit = computed(() =>
    this.authService.hasPermission({
      projectId: this.projectId(),
      requiredPermission: PermissionEnum.ProgramUPDATE,
    }),
  );

  readonly projectFormName =
    viewChild<ProjectFormNameComponent>('projectFormName');
  readonly projectFormInformation = viewChild<ProjectFormInformationComponent>(
    'projectFormInformation',
  );

  // These are two separate components/formGroups because they are also
  // used separately in the project creation flow
  readonly formGroup = computed(() => {
    const nameGroup = this.projectFormName()?.formGroup;
    const informationGroup = this.projectFormInformation()?.formGroup;

    if (!nameGroup || !informationGroup) {
      return undefined;
    }

    return new FormGroup({
      nameGroup,
      informationGroup,
    });
  });

  updateProjectMutation = injectMutation(() => ({
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
        nameGroup: ProjectNameFormGroup;
        informationGroup: ProjectInformationFormGroup;
      }>['getRawValue']
    >) =>
      this.projectApiService.updateProject({
        projectId: this.projectId,
        projectPatch: {
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

      void this.projectApiService.invalidateCache(this.projectId);
      void this.registrationsTableColumnService.invalidateCache(this.projectId);
    },
  }));

  readonly projectBasicInformationData = computed(() => {
    const projectData = this.project.data();

    const listData: DataListItem[] = [
      {
        label: '*' + $localize`Project name`,
        value: this.translatableStringService.translate(
          projectData?.titlePortal,
        ),
        fullWidth: true,
      },
      {
        label: $localize`Project description`,
        value: this.translatableStringService.translate(
          projectData?.description,
        ),
        fullWidth: true,
      },
      {
        label: $localize`Start date`,
        value: projectData?.startDate,
        type: 'date',
      },
      {
        label: $localize`End date`,
        value: projectData?.endDate,
        type: 'date',
      },
      {
        label: $localize`Location`,
        value: projectData?.location,
        fullWidth: true,
      },
      {
        label: '*' + $localize`Target registrations`,
        value: projectData?.targetNrRegistrations,
        fullWidth: true,
        type: 'number',
        tooltip: PROJECT_FORM_TOOLTIPS.targetRegistrations,
      },
      {
        label: $localize`Enable validation`,
        value: projectData?.validation ?? false,
        fullWidth: true,
        type: 'boolean',
        tooltip: PROJECT_FORM_TOOLTIPS.validationProcess,
      },
      {
        label: $localize`Enable scope`,
        value: projectData?.enableScope ?? false,
        fullWidth: true,
        type: 'boolean',
        tooltip: PROJECT_FORM_TOOLTIPS.enableScope,
      },
    ];

    return [...listData].map((item) => ({
      ...item,
      loading: this.project.isPending(),
    }));
  });
}
