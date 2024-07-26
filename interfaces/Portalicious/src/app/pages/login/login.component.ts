import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToolbarModule } from 'primeng/toolbar';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
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
    InputTextModule,
    ReactiveFormsModule,
    PasswordModule,
    ButtonModule,
    CookieBannerComponent,
    FormErrorComponent,
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

  loginFormSubmitted = signal(false);

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

  onLogin() {
    this.loginFormSubmitted.set(true);

    const { email, password } = this.loginForm.value;

    if (!this.loginForm.valid || !email || !password) {
      return;
    }

    this.loginMutation.mutate({ email, password });
  }
}
