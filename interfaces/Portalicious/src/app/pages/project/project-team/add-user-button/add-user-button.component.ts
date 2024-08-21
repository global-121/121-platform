import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-add-user-button',
  standalone: true,
  imports: [ButtonModule],
  providers: [ToastService],
  templateUrl: './add-user-button.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddUserButtonComponent {
  private toastService = inject(ToastService);

  onAdd(): void {
    this.toastService.showToast({
      summary:
        'If you try really hard, I am sure you can imagine a new user being added to the table.',
    });
  }
}
