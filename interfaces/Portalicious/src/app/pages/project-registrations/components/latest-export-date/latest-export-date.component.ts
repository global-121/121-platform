import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';

import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { AuthService } from '~/services/auth.service';

@Component({
  selector: 'app-latest-export-date',
  standalone: true,
  imports: [DatePipe, SkeletonInlineComponent],
  templateUrl: './latest-export-date.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LatestExportDateComponent {
  projectId = input.required<number>();
  exportType = input.required<ExportType>();

  private authService = inject(AuthService);
  private projectApiService = inject(ProjectApiService);

  latestExport = injectQuery(() => ({
    ...this.projectApiService.getLatestAction({
      projectId: this.projectId,
      actionType: this.exportType(),
    })(),
    enabled: this.canSeeLastExportTime(),
  }));

  canSeeLastExportTime = computed(() =>
    this.authService.hasPermission({
      projectId: this.projectId(),
      requiredPermission: PermissionEnum.ActionREAD,
    }),
  );
}
