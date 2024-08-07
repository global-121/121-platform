import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { ToolbarModule } from 'primeng/toolbar';
import {
  DynamicFormComponent,
  DynamicFormField,
} from '~/components/dynamic-form/dynamic-form.component';
import { LanguageSwitcherComponent } from '~/components/language-switcher/language-switcher.component';
import { LogoComponent } from '~/components/logo/logo.component';
import { CookieBannerComponent } from '~/pages/login/components/cookie-banner/cookie-banner.component';
import { AuthService } from '~/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    LogoComponent,
    ToolbarModule,
    NgOptimizedImage,
    CookieBannerComponent,
    LanguageSwitcherComponent,
    DynamicFormComponent,
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

  loginForm = new FormGroup({
    // eslint-disable-next-line @typescript-eslint/unbound-method
    email: new FormControl('', [Validators.required, Validators.email]),
    // eslint-disable-next-line @typescript-eslint/unbound-method
    password: new FormControl('', [Validators.required]),
  });

  loginFields: DynamicFormField[] = [
    {
      controlName: 'email',
      label: $localize`E-mail`,
      type: 'email',
      placeholder: $localize`example: yourname@example.org`,
      autocomplete: 'email username',
      autoFocus: true,
      validationMessage: (form: FormGroup) => {
        if (form.controls.email.invalid) {
          return $localize`Enter a valid email address`;
        }

        return null;
      },
    },
    {
      controlName: 'password',
      label: $localize`Password`,
      type: 'password',
      autocomplete: 'current-password',
      validationMessage: (form: FormGroup) => {
        if (form.controls.password.invalid) {
          return $localize`Enter your password`;
        }

        return null;
      },
    },
  ];

  loginMutation = injectMutation(() => ({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      this.authService.login({ username: email, password }),
    onSuccess: () => {
      const returnUrl = this.returnUrl();
      if (returnUrl) {
        return this.router.navigate([returnUrl]);
      }
      return this.router.navigate(['/']);
    },
  }));

  loginFormError = computed(() => {
    if (!this.loginMutation.isError()) {
      return;
    }
    return this.loginMutation.failureReason()?.message;
  });

  onLogin() {
    const { email, password } = this.loginForm.value;

    if (!this.loginForm.valid || !email || !password) {
      return;
    }

    this.loginMutation.mutate({ email, password });
  }
}
