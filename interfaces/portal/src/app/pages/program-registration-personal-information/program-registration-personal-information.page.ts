import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';

import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { PageLayoutRegistrationComponent } from '~/components/page-layout-registration/page-layout-registration.component';
import { MetricApiService } from '~/domains/metric/metric.api.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { ComponentCanDeactivate } from '~/guards/pending-changes.guard';
import { EditPersonalInformationComponent } from '~/pages/program-registration-personal-information/components/edit-personal-information/edit-personal-information.component';
import { AuthService } from '~/services/auth.service';
import { RegistrationAttributeService } from '~/services/registration-attribute.service';
import { RtlHelperService } from '~/services/rtl-helper.service';

@Component({
  selector: 'app-program-registration-personal-information',
  imports: [
    PageLayoutRegistrationComponent,
    SkeletonModule,
    ButtonModule,
    DataListComponent,
    EditPersonalInformationComponent,
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
  readonly registrationApiService = inject(RegistrationApiService);
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

  readonly isEditing = signal(false);
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
          case RegistrationAttributeTypes.tel:
          case RegistrationAttributeTypes.text:
            return {
              ...attribute,
              type: 'text',
              value: value as string | UILanguageTranslation,
            };
        }
      },
    ),
  );

  onRegistrationUpdated() {
    this.isEditing.set(false);
    void this.registrationAttributes.refetch();
  }

  canDeactivate() {
    return (
      !this.isEditing() ||
      this.editPersonalInformationComponent().canDeactivate()
    );
  }
}
