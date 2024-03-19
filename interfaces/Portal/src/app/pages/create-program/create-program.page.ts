import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { AfterViewInit, Component } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { Program } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
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
    const url = 'https://kobo-connect.azurewebsites.net/121-program';

    const httpHeaders: HttpHeaders = new HttpHeaders({
      kobotoken: this.koboTokenValue,
      koboasset: this.koboAssetIdValue,
    });

    const res: Program = await new Promise((resolve, reject) =>
      this.http
        .get(url, { headers: httpHeaders })
        .pipe(
          tap((response) =>
            console.log(`ApiService GET: ${url}`, '\nResponse:', response),
          ),
          catchError(
            (error: HttpErrorResponse): Observable<any> =>
              this.handleError(error),
          ),
        )
        .toPromise()
        .then((response) => {
          if (response && response.error) {
            throw response;
          }
          return resolve(response);
        })
        .catch((err) => reject(err)),
    );

    if (!res) {
      return;
    }

    this.programsService.createProgram(res);
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
}
