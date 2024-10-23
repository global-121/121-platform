import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { CardModule } from 'primeng/card';

import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import {
  QueryTableColumn,
  QueryTableComponent,
} from '~/components/query-table/query-table.component';
import { RoleApiService } from '~/domains/role/role.api.service';
import { Role } from '~/domains/role/role.model';

@Component({
  selector: 'app-user-roles',
  standalone: true,
  imports: [PageLayoutComponent, CardModule, QueryTableComponent],
  templateUrl: './user-roles.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserRolesPageComponent {
  private roleApiService = inject(RoleApiService);

  roles = injectQuery(this.roleApiService.getRoles());

  columns = computed<QueryTableColumn<Role>[]>(() => [
    {
      field: 'label',
      header: $localize`Role`,
    },
    {
      field: 'description',
      header: $localize`Description`,
    },
  ]);
}
