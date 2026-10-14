import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';

import { injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';

import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { AppRoutes } from '~/app.routes';
import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { ImageDialogsComponent } from '~/components/image/image-dialogs/image-dialogs.component';
import { PageLayoutRegistrationComponent } from '~/components/page-layout-registration/page-layout-registration.component';
import { MetricApiService } from '~/domains/metric/metric.api.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { registrationLink } from '~/domains/registration/registration.helper';
import { ComponentCanDeactivate } from '~/guards/pending-changes.guard';
import { EditPersonalInformationComponent } from '~/pages/program-registration-personal-information/components/edit-personal-information/edit-personal-information.component';
import { AuthService } from '~/services/auth.service';
import { RegistrationAttributeService } from '~/services/registration-attribute.service';
import { RtlHelperService } from '~/services/rtl-helper.service';

const normalizeKoboImageValue = (value: unknown): string =>
  typeof value === 'string' && value.trim().toLowerCase() !== 'null'
    ? value
    : '';

@Component({
  selector: 'app-program-registration-personal-information',
  imports: [
    PageLayoutRegistrationComponent,
    SkeletonModule,
    ButtonModule,
    DataListComponent,
    EditPersonalInformationComponent,
    ImageDialogsComponent,
  ],
  templateUrl: './program-registration-personal-information.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramRegistrationPersonalInformationPageComponent implements ComponentCanDeactivate {
  readonly rtlHelper = inject(RtlHelperService);
  // this is injected by the router
  readonly programId = input.required<string>();
  readonly registrationId = input.required<string>();

  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly registrationApiService = inject(RegistrationApiService);
  readonly queryClient = inject(QueryClient);
  readonly metricApiService = inject(MetricApiService);
  readonly registrationAttributeService = inject(RegistrationAttributeService);

  registrationAttributes = injectQuery(
    this.registrationAttributeService.getRegistrationAttributes(
      signal({
        programId: this.programId,
        registrationId: this.registrationId,
      }),
    ),
  );

  readonly registrationReferenceId = computed(() => {
    const registrationQueryOptions =
      this.registrationApiService.getRegistrationById(
        this.programId,
        this.registrationId,
      )();

    return this.queryClient.getQueryData<{ referenceId?: string }>(
      registrationQueryOptions.queryKey,
    )?.referenceId;
  });

  readonly startEditing = input<boolean>(false);
  readonly isEditing = linkedSignal(() => this.startEditing());
  readonly editPersonalInformationComponent =
    viewChild.required<EditPersonalInformationComponent>(
      'editPersonalInformation',
    );

  readonly canUpdatePersonalInformation = computed(() =>
    this.authService.hasPermission({
      programId: this.programId(),
      requiredPermission: PermissionEnum.RegistrationAttributeUPDATE,
    }),
  );

  readonly dataList = computed<DataListItem[]>(() =>
    (this.registrationAttributes.data() ?? []).map(
      ({ type, value, ...attribute }) => {
        switch (type) {
          case RegistrationAttributeTypes.multiSelect:
            throw new Error('multiSelect not supported');
          case RegistrationAttributeTypes.numeric:
            return {
              ...attribute,
              type: 'number',
              value: value as number,
            };
          case RegistrationAttributeTypes.numericNullable:
            return {
              ...attribute,
              type: 'number',
              value: value as null | number,
            };
          case RegistrationAttributeTypes.date:
            return {
              ...attribute,
              type: 'date',
              value: value as Date,
            };
          case RegistrationAttributeTypes.boolean:
            return {
              ...attribute,
              type: 'boolean',
              value: value as boolean,
            };
          case RegistrationAttributeTypes.dropdown:
            return {
              ...attribute,
              type: 'options',
              value: value as string | string[],
            };
          case RegistrationAttributeTypes.koboImage:
            return {
              ...attribute,
              type: 'koboImage',
              value: normalizeKoboImageValue(value),
            };
          case RegistrationAttributeTypes.tel:
          case RegistrationAttributeTypes.text:
          default:
            return {
              ...attribute,
              type: 'text',
              value: value as string | UILanguageTranslation,
            };
        }
      },
    ),
  );

  readonly imageDataList = computed(() =>
    this.dataList().filter(
      (item): item is Extract<DataListItem, { type: 'koboImage' }> =>
        item.type === 'koboImage',
    ),
  );

  readonly koboImages = computed(() =>
    this.imageDataList().map((item) => ({
      label: item.label,
      imageUrl: item.value,
      programId: this.programId(),
      referenceId: this.registrationReferenceId(),
      attributeName:
        'name' in item && typeof item.name === 'string' ? item.name : undefined,
      dataTestId: item.dataTestId,
    })),
  );

  readonly hasKoboImages = computed(() => this.imageDataList().length > 0);

  readonly editableAttributeList = computed(() => {
    const editableAttributes = (this.registrationAttributes.data() ?? []).map(
      (attribute) =>
        attribute.type === RegistrationAttributeTypes.koboImage
          ? { ...attribute, isEditable: false }
          : attribute,
    );

    return editableAttributes;
  });

  enterEditMode() {
    void this.router.navigate(
      registrationLink({
        programId: this.programId(),
        registrationId: this.registrationId(),
        editPersonalInfo: true,
      }),
    );
  }

  leaveEditMode() {
    // Set before navigating, so the pending-changes guard lets us through
    this.isEditing.set(false);

    void this.router.navigate([
      ...registrationLink({
        programId: this.programId(),
        registrationId: this.registrationId(),
      }),
      AppRoutes.programRegistrationPersonalInformation,
    ]);
  }

  canDeactivate() {
    return (
      !this.isEditing() ||
      this.editPersonalInformationComponent().canDeactivate()
    );
  }
}
