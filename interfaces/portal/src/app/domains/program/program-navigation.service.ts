import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { AppRoutes } from '~/app.routes';
import { AuthService } from '~/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class ProgramNavigationService {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  /**
   * After a program is created or duplicated, refresh the user's permissions
   * so the new program becomes visible, then navigate to its settings page to
   * complete setup.
   */
  async navigateToNewProgram({
    programId,
  }: {
    programId: number | undefined;
  }): Promise<void> {
    // The keys of the user permissions determine which programs a user can see
    await this.authService.refreshUserPermissions();

    await this.router.navigate([
      '/',
      AppRoutes.program,
      programId,
      AppRoutes.programSettings,
    ]);
  }
}
