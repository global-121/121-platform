import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { ButtonModule } from 'primeng/button';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { ExportPaymentsComponent } from '~/pages/project-payments/components/export-payments/export-payments.component';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-project-payments',
  standalone: true,
  imports: [PageLayoutComponent, ButtonModule, ExportPaymentsComponent],
  providers: [ToastService],
  templateUrl: './project-payments.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPaymentsPageComponent {
  // this is injected by the router
  projectId = input.required<number>();

  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  onCreatePayment() {
    this.toastService.showToast({
      severity: 'warn',
      detail: 'Functionality not implemented yet',
    });
  }

  canExport = computed(() =>
    this.authService.hasAllPermissions({
      projectId: this.projectId(),
      requiredPermissions: [
        PermissionEnum.RegistrationPersonalEXPORT,
        PermissionEnum.PaymentREAD,
        PermissionEnum.PaymentTransactionREAD,
      ],
    }),
  );
}
