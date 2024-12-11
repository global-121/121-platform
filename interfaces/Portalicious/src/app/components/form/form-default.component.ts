import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';

import { FormComponent } from '~/components/form/form.component';
import { FormErrorComponent } from '~/components/form-error/form-error.component';

@Component({
  selector: 'app-form-default',
  standalone: true,
  imports: [ButtonModule, ReactiveFormsModule, FormErrorComponent],
  templateUrl: './form-default.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormDefaultComponent<
  T extends FormGroup,
> extends FormComponent<T> {
  disabled = input<boolean>(false);
}
