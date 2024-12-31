import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { FocusTrapModule } from 'primeng/focustrap';

import { FormComponent } from '~/components/form/form.component';
import { FormErrorComponent } from '~/components/form-error/form-error.component';

@Component({
  selector: 'app-form-sidebar',
  imports: [
    ButtonModule,
    ReactiveFormsModule,
    FormErrorComponent,
    DrawerModule,
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
  modal = model<boolean>(true);
}
