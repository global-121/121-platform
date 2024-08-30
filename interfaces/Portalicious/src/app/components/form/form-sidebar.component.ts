import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';

import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FocusTrapModule } from 'primeng/focustrap';
import { SidebarModule } from 'primeng/sidebar';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { FormComponent } from '~/components/form/form.component';

@Component({
  selector: 'app-form-sidebar',
  standalone: true,
  imports: [
    ButtonModule,
    ReactiveFormsModule,
    FormErrorComponent,
    SidebarModule,
    FocusTrapModule,
  ],
  templateUrl: './form-sidebar.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormSidebarComponent<
  T extends FormGroup,
> extends FormComponent<T> {
  visible = model<boolean>(false);
  formTitle = input.required<string>();
}
