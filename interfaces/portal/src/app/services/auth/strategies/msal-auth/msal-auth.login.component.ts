import {
  ChangeDetectionStrategy,
  Component,
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
import { AutoFocus } from 'primeng/autofocus';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { FormDefaultComponent } from '~/components/form-default/form-default.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { AuthService } from '~/services/auth.service';
import { areAutomatedPopupsBlocked } from '~/utils/are-popups-blocked';
import { generateFieldErrors } from '~/utils/form-validation';
import { isIframed } from '~/utils/is-iframed';

type LoginFormSsoGroup =
  (typeof MsalAuthLoginComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-msal-auth.login',
  imports: [
    ButtonModule,
    FormFieldWrapperComponent,
    ReactiveFormsModule,
    ProgressSpinnerModule,
    InputTextModule,
    AutoFocus,
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
  private arePopupsAutoBlocked = areAutomatedPopupsBlocked(); // Should not be called in a user-initiated event

  readonly returnUrl = input<string | undefined>(undefined);

  formGroup = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
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
    onMutate: () => {
      if (isIframed() && this.arePopupsAutoBlocked) {
        throw Error(
          $localize`Please allow pop-up windows in your browser settings to login`,
        );
      }
    },
    mutationFn: ({ email }: ReturnType<LoginFormSsoGroup['getRawValue']>) =>
      this.authService.login({ username: email }, this.returnUrl()),
  }));
}
