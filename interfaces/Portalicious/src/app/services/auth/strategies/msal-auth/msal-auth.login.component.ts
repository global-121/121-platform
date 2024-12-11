import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { AutoFocusModule } from 'primeng/autofocus';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { FormDefaultComponent } from '~/components/form/form-default.component';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { AuthService } from '~/services/auth.service';
import { generateFieldErrors } from '~/utils/form-validation';
import { isIframed } from '~/utils/is-iframed';
import { isPopupBlocked } from '~/utils/is-pop-up-blocked';

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
    FormErrorComponent,
  ],
  templateUrl: './msal-auth.login.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MsalAuthLoginComponent {
  private authService = inject(AuthService);
  returnUrl = input<string | undefined>(undefined);

  allowPopupErrorMessage = $localize`Please allow pop-up windows to login`;
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
  isPopupBlocked = computed(() => {
    return isPopupBlocked();
  });
  isIframed = computed(() => {
    return isIframed();
  });
}
