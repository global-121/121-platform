import { ChangeDetectionStrategy, Component, model } from '@angular/core';

import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SidebarModule } from 'primeng/sidebar';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { FormBaseComponent } from '~/components/form/components/form-base/form-base.component';

@Component({
  selector: 'app-form-sidebar',
  standalone: true,
  imports: [
    ButtonModule,
    ReactiveFormsModule,
    FormErrorComponent,
    SidebarModule,
  ],
  templateUrl: './form-sidebar.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormSidebarComponent<
  T extends FormGroup,
> extends FormBaseComponent<T> {
  visible = model<boolean>(false);
}
