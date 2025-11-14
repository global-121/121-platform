import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';

import { MenuItem } from 'primeng/api';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { ButtonMenuComponent } from '~/components/button-menu/button-menu.component';
import { Registration } from '~/domains/registration/registration.model';
import { ImportRegistrationsComponent } from '~/pages/program-registrations/components/import-registrations/import-registrations.component';
import { UpdateRegistrationsComponent } from '~/pages/program-registrations/components/update-registrations/update-registrations.component';
import { AuthService } from '~/services/auth.service';
import { ActionDataWithPaginateQuery } from '~/services/paginate-query.service';

@Component({
  selector: 'app-import-registrations-menu',
  imports: [
    ButtonMenuComponent,
    UpdateRegistrationsComponent,
    ImportRegistrationsComponent,
  ],
  templateUrl: './import-registrations-menu.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportRegistrationsMenuComponent {
  readonly programId = input.required<string>();
  readonly getActionData =
    input.required<
      () => ActionDataWithPaginateQuery<Registration> | undefined
    >();

  readonly actionComplete = output();

  private authService = inject(AuthService);

  readonly importNewRegistrationsDialogVisible = model<boolean>(false);
  readonly updateExistingRegistrationsDialogVisible = model<boolean>(false);

  readonly updateSelectedRegistrationsActionData = signal<
    ActionDataWithPaginateQuery<Registration> | undefined
  >(undefined);

  readonly importOptions = computed<MenuItem[]>(() => [
    {
      label: $localize`Import new registrations`,
      command: () => {
        this.importNewRegistrationsDialogVisible.set(true);
      },
    },
    {
      label: $localize`Update selected registrations`,
      command: () => {
        const actionData = this.getActionData()();
        if (!actionData) {
          return;
        }
        this.updateSelectedRegistrationsActionData.set(actionData);
        this.updateExistingRegistrationsDialogVisible.set(true);
      },
      visible: this.authService.hasPermission({
        programId: this.programId(),
        requiredPermission: PermissionEnum.RegistrationBulkUPDATE,
      }),
    },
  ]);

  onUpdateSuccess() {
    this.actionComplete.emit();
  }
}
