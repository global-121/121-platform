import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';

import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { RegistrationPageLayoutComponent } from '~/components/registration-page-layout/registration-page-layout.component';
import { EditPersonalInformationComponent } from '~/pages/project-registration-personal-information/components/edit-personal-information/edit-personal-information.component';
import { AuthService } from '~/services/auth.service';
import { RegistrationAttributeService } from '~/services/registration-attribute.service';

@Component({
  selector: 'app-project-registration-personal-information',
  standalone: true,
  imports: [
    RegistrationPageLayoutComponent,
    SkeletonModule,
    ButtonModule,
    DataListComponent,
    EditPersonalInformationComponent,
  ],
  templateUrl: './project-registration-personal-information.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectRegistrationPersonalInformationPageComponent {
  // this is injected by the router
  readonly projectId = input.required<string>();
  readonly registrationId = input.required<string>();

  readonly authService = inject(AuthService);
  readonly registrationAttributeService = inject(RegistrationAttributeService);

  registrationAttributes = injectQuery(
    this.registrationAttributeService.getRegistrationAttributes(
      signal({
        projectId: this.projectId,
        registrationId: this.registrationId,
      }),
    ),
  );

  isEditing = signal(false);

  canUpdatePersonalInformation = computed(() =>
    this.authService.hasPermission({
      projectId: this.projectId(),
      requiredPermission: PermissionEnum.RegistrationAttributeUPDATE,
    }),
  );

  dataList = computed<DataListItem[]>(() =>
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
              type: 'multi',
              value: value as string | string[],
            };
          case RegistrationAttributeTypes.tel:
          case RegistrationAttributeTypes.text:
            return {
              ...attribute,
              type: 'text',
              value: value as LocalizedString | string,
            };
        }
      },
    ),
  );

  onRegistrationUpdated() {
    this.isEditing.set(false);
    void this.registrationAttributes.refetch();
  }
}
