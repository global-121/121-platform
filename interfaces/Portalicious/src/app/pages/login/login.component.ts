import { NgOptimizedImage } from '@angular/common';
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
import { ActivatedRoute, Router } from '@angular/router';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { AutoFocusModule } from 'primeng/autofocus';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToolbarModule } from 'primeng/toolbar';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { FormDefaultComponent } from '~/components/form/form-default.component';
import { LanguageSwitcherComponent } from '~/components/language-switcher/language-switcher.component';
import { LogoComponent } from '~/components/logo/logo.component';
import { CookieBannerComponent } from '~/pages/login/components/cookie-banner/cookie-banner.component';
import { AuthService } from '~/services/auth.service';
import { generateFieldErrors } from '~/utils/form-validation';

type LoginFormGroup = (typeof LoginComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    InputTextModule,
    PasswordModule,
    AutoFocusModule,
    LogoComponent,
    ToolbarModule,
    NgOptimizedImage,
    CookieBannerComponent,
    LanguageSwitcherComponent,
    FormDefaultComponent,
    ReactiveFormsModule,
    FormFieldWrapperComponent,
  ],
  templateUrl: './login.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

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
    mutationFn: ({ email, password }: Required<LoginFormGroup['value']>) =>
      this.authService.login({ username: email, password }),
    onSuccess: () => {
      const returnUrl = this.returnUrl();
      if (returnUrl) {
        return this.router.navigate([returnUrl]);
      }
      return this.router.navigate(['/']);
    },
  }));
}
