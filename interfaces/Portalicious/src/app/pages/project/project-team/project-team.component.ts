import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import {
  QueryTableColumn,
  QueryTableComponent,
} from '~/components/query-table/query-table.component';
import { AddUserButtonComponent } from '~/pages/project/project-team/add-user-button/add-user-button.component';
import { ApiEndpoints, ApiService } from '~/services/api.service';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';
import { ArrayElement } from '~/utils/type-helpers';

type UserInProject = ArrayElement<
  Awaited<ReturnType<ApiService['getUsersInProject']>>
>;

@Component({
  selector: 'app-project-team',
  standalone: true,
  imports: [PageLayoutComponent, QueryTableComponent, AddUserButtonComponent],
  providers: [ToastService],
  templateUrl: './project-team.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTeamComponent {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  selectedUser = signal<undefined | UserInProject>(undefined);

  // this is injected by the router
  projectId = input.required<number>();

  project = injectQuery(() => ({
    queryKey: [ApiEndpoints.projects, this.projectId()],
    queryFn: () => this.apiService.getProjectById(this.projectId()),
  }));

  projectUsers = injectQuery(() => ({
    queryKey: [ApiEndpoints.projects, this.projectId(), ApiEndpoints.users],
    queryFn: () => this.apiService.getUsersInProject(this.projectId()),
  }));

  columns = computed<QueryTableColumn<UserInProject>[]>(() => [
    {
      field: 'username',
      header: $localize`User name`,
    },
    {
      field: 'allRolesLabel',
      header: $localize`Roles`,
    },
    {
      field: 'scope',
      header: $localize`Scope`,
      hidden: !this.enableScope(),
    },
    {
      field: 'lastLogin',
      header: $localize`Last log in`,
      type: 'date',
    },
  ]);

  canManageAidworkers = computed(() =>
    this.authService.hasPermission(
      this.projectId(),
      PermissionEnum.AidWorkerProgramUPDATE,
    ),
  );

  enableScope = computed(() => this.project.data()?.enableScope);

  contextMenuItems = computed(() => {
    if (!this.canManageAidworkers()) {
      return undefined;
    }
    return [
      {
        label: $localize`Copy email`,
        icon: 'pi pi-copy',
        command: () => {
          const user = this.selectedUser();
          if (!user) {
            this.toastService.showGenericError();
            return;
          }
          void navigator.clipboard.writeText(user.username);
          this.toastService.showToast({
            detail: $localize`Email copied to clipboard`,
          });
        },
      },
      {
        label: $localize`:@@generic-edit:Edit`,
        icon: 'pi pi-pencil',
        command: () => {
          this.toastService.showToast({
            detail: `Edit functionality has not been implemented yet so don't be impatient`,
            severity: 'warn',
          });
        },
      },
      {
        label: $localize`Remove user`,
        icon: 'pi pi-times text-red-500',
        command: () => {
          this.toastService.showToast({
            detail: `Delete functionality has not been implemented yet so don't be impatient`,
            severity: 'error',
          });
        },
      },
    ];
  });
}
