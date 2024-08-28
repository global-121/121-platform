import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { FormComponent } from '~/components/form/form.component';

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
> extends FormComponent<T> {}
