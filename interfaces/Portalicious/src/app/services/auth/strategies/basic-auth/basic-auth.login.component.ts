import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { AutoFocusModule } from 'primeng/autofocus';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

import { FormDefaultComponent } from '~/components/form/form-default.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { AuthService } from '~/services/auth.service';
import { generateFieldErrors } from '~/utils/form-validation';

type LoginFormGroup =
  (typeof BasicAuthLoginComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-basic-auth-login',
  standalone: true,
  imports: [
    InputTextModule,
    PasswordModule,
    AutoFocusModule,
    FormDefaultComponent,
    ReactiveFormsModule,
    FormFieldWrapperComponent,
  ],
  templateUrl: './basic-auth.login.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicAuthLoginComponent {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  private returnUrl = computed(() => {
    const returnUrl: unknown = this.route.snapshot.queryParams.returnUrl;
    if (typeof returnUrl !== 'string') {
      return undefined;
    }
    return returnUrl;
  });

  formGroup = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      validators: [Validators.required],
    }),
  });

  formFieldErrors = generateFieldErrors<LoginFormGroup>(this.formGroup, {
    email: (control) => {
      if (!control.invalid) {
        return;
      }
      return $localize`Enter a valid email address`;
    },
    password: (control) => {
      if (!control.invalid) {
        return;
      }
      return $localize`Enter your password`;
    },
  });

  loginMutation = injectMutation(() => ({
    mutationFn: ({
      email,
      password,
    }: ReturnType<LoginFormGroup['getRawValue']>) =>
      this.authService.login({ username: email, password }, this.returnUrl()),
  }));
}