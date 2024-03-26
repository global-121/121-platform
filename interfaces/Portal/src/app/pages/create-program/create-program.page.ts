import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AppRoutes } from 'src/app/app-routes.enum';
import { AuthService } from 'src/app/auth/auth.service';
import { ProgramPhase } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-create-program',
  templateUrl: './create-program.page.html',
  styleUrls: ['./create-program.page.scss'],
})
export class CreateProgramPage implements AfterViewInit {
  @ViewChild('createProgramForm')
  public createProgramForm: NgForm;

  public koboTokenValue = '';
  public koboAssetIdValue = '';
  public isAdmin: boolean;
  public errorMessage: string;
  public inProgress = false;

  constructor(
    private programsService: ProgramsServiceApiService,
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService,
  ) {}

  async ngAfterViewInit() {
    this.authService.authenticationState$.subscribe((user: User | null) => {
      this.isAdmin = user?.isAdmin;
    });
  }

  public async createProgram() {
    if (this.createProgramForm.invalid || this.inProgress) {
      return;
    }

    this.inProgress = true;

    try {
      const result = await this.programsService.createProgramFromKobo(
        this.koboTokenValue,
        this.koboAssetIdValue,
      );

      if (!result || !result.id) {
        throw new Error('No Program-ID returned.');
      }

      this.resetForm();

      this.router.navigate([AppRoutes.program, result.id, ProgramPhase.design]);

      return;
    } catch (error) {
      console.error(error);

      this.inProgress = false;
      let errorResult = error;

      if (error.error && error.error.message) {
        errorResult = error.error.message;
      }

      if (error.error && error.error.errors) {
        errorResult = errorResult.concat(': ', error.error.errors.join(' - '));
      }

      if (errorResult) {
        this.errorMessage = this.translate.instant(
          'common.error-with-message',
          { error: errorResult },
        );
        return;
      }

      this.errorMessage = this.translate.instant('common.unknown-error');
    }
  }

  public resetForm() {
    this.createProgramForm.resetForm();
    this.errorMessage = '';
    this.inProgress = false;
  }
}
