import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';

import { ButtonModule } from 'primeng/button';

import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-project-payments',
  standalone: true,
  imports: [PageLayoutComponent, ButtonModule],
  providers: [ToastService],
  templateUrl: './project-payments.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPaymentsPageComponent {
  // this is injected by the router
  projectId = input.required<number>();

  private toastService = inject(ToastService);

  onCreatePayment() {
    this.toastService.showToast({
      severity: 'warn',
      detail: 'Functionality not implemented yet',
    });
  }
}
