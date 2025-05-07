import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { CardModule } from 'primeng/card';

import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-change-password',
  imports: [PageLayoutComponent, CardModule, NgComponentOutlet],
  providers: [ToastService],
  templateUrl: './change-password.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordPageComponent {
  private authService = inject(AuthService);

  ChangePasswordComponent = this.authService.ChangePasswordComponent;
}
