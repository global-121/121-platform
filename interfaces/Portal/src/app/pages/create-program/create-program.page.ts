import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { AfterViewInit, Component } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { environment } from '../../../environments/environment';
import { Program } from '../../models/program.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-create-program',
  templateUrl: './create-program.page.html',
  styleUrls: ['./create-program.page.scss'],
})
export class CreateProgramPage implements AfterViewInit {
  public koboTokenValue = '';
  public koboAssetIdValue = '';

  public isAdmin: boolean;

  public isAlertOpen = false;
  public alertMessage: string;

  public inProgress = false;

  public isCreateProgramEnabled = !!environment.url_create_program_api;

  constructor(
    private programsService: ProgramsServiceApiService,
    private authService: AuthService,
    private http: HttpClient,
  ) {}

  async ngAfterViewInit() {
    this.authService.authenticationState$.subscribe((user: User | null) => {
      this.isAdmin = user?.isAdmin;
    });
  }

  public async createProgram() {
    this.inProgress = true;

    const httpHeaders: HttpHeaders = new HttpHeaders({
      kobotoken: this.koboTokenValue,
      koboasset: this.koboAssetIdValue,
    });

    const res: Program = await new Promise((resolve, reject) =>
      this.http
        .get(environment.url_create_program_api, { headers: httpHeaders })
        .pipe(
          tap((response) =>
            console.log(
              `ApiService GET: ${this.createProgramEndpoint}`,
              '\nResponse:',
              response,
            ),
          ),
          catchError(
            (error: HttpErrorResponse): Observable<any> =>
              this.handleError(error),
          ),
        )
        .toPromise()
        .then((response) => {
          if (response && response.error) {
            this.openAlert(
              'There was a problem in fetching the program from Kobo',
            );
            throw response;
          }
          return resolve(response);
        })
        .catch((err) => reject(err)),
    );

    try {
      this.programsService.createProgram(res);
      this.openAlert('Program created successfully!');
    } catch (error) {
      console.error(error);
      this.openAlert('There was a problem in creating the program');
    }
  }

  public disableCreateProgramButton(): boolean {
    if (
      !this.koboTokenValue ||
      !this.koboAssetIdValue ||
      this.koboTokenValue === '' ||
      this.koboAssetIdValue === ''
    ) {
      return true;
    }

    return false;
  }

  private handleError(error: HttpErrorResponse) {
    console.error(error);

    return of(error);
  }

  private openAlert(message: string) {
    this.alertMessage = message;
    this.isAlertOpen = true;
    this.inProgress = false;
  }

  public dismissAlert() {
    this.isAlertOpen = false;
    this.clearFields();
  }

  public clearFields() {
    this.koboTokenValue = '';
    this.koboAssetIdValue = '';
  }
}
