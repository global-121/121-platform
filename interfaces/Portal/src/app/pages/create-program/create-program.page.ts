import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, Observable, of, tap } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import Permission from 'src/app/auth/permission.enum';
import { Program } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

@Component({
  selector: 'app-create-program',
  templateUrl: './create-program.page.html',
  styleUrls: ['./create-program.page.scss'],
})
export class CreateProgramPage implements OnInit {
  public programId = this.route.snapshot.params.id;
  public program: Program;
  public canViewMetrics: boolean;

  public koboTokenValue = '';

  public koboAssetIdValue = '';

  constructor(
    private route: ActivatedRoute,
    private programsService: ProgramsServiceApiService,
    private authService: AuthService,
    private http: HttpClient,
  ) {}

  async ngOnInit() {
    this.program = await this.programsService.getProgramById(this.programId);

    this.canViewMetrics = this.authService.hasPermission(
      this.programId,
      Permission.ProgramMetricsREAD,
    );
  }

  public async createProgram() {
    console.log(
      '🚀 ~ CreateProgramPage ~ koboTokenValue:',
      this.koboTokenValue,
    );
    console.log(
      '🚀 ~ CreateProgramPage ~ koboAssetIdValue:',
      this.koboAssetIdValue,
    );

    const url = 'https://kobo-connect.azurewebsites.net/121-program';

    const httpHeaders: HttpHeaders = new HttpHeaders({
      kobotoken: this.koboTokenValue,
      koboasset: this.koboAssetIdValue,
    });

    const res = await new Promise((resolve, reject) =>
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
    console.log('🚀 ~ CreateProgramPage ~ createProgram ~ res:', res);
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
