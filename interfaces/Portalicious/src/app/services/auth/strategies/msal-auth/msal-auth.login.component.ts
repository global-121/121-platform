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
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { FormDefaultComponent } from '~/components/form/form-default.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { AuthService } from '~/services/auth.service';
import { generateFieldErrors } from '~/utils/form-validation';

type LoginFormSsoGroup =
  (typeof MsalAuthLoginComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-msal-auth.login',
  standalone: true,
  imports: [
    ButtonModule,
    FormFieldWrapperComponent,
    ReactiveFormsModule,
    ProgressSpinnerModule,
    InputTextModule,
    AutoFocusModule,
    ReactiveFormsModule,
    FormFieldWrapperComponent,
    FormDefaultComponent,
  ],
  templateUrl: './msal-auth.login.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MsalAuthLoginComponent {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private returnUrl = computed(() => {
    const returnUrl: unknown = this.route.snapshot.queryParams.returnUrl;
    if (typeof returnUrl !== 'string') {
      return undefined;
    }
    return returnUrl;
  });
  authError = this.authService.authError;

  formGroup = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      validators: [Validators.required, Validators.email],
    }),
  });
  formFieldErrors = generateFieldErrors<LoginFormSsoGroup>(this.formGroup, {
    email: (control) => {
      if (!control.invalid) {
        return;
      }
      return $localize`Enter a valid email address`;
    },
  });
  loginMutation = injectMutation(() => ({
    mutationFn: ({ email }: ReturnType<LoginFormSsoGroup['getRawValue']>) =>
      this.authService.login({ username: email }, this.returnUrl()),
  }));
}
