import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { FormBaseComponent } from '~/components/form/components/form-base/form-base.component';

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
> extends FormBaseComponent<T> {}
