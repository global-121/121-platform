import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

import { Program } from '../models/program.model';

@Injectable({
  providedIn: 'root',
})
export class ProgramsServiceApiService {
  constructor(
    private apiService: ApiService,
    private jwtService: JwtService
  ) { }

  login(email: string, password: string): Observable<any> {
    console.log('ProgramsService : login()');

    return this.apiService.post(
      environment.url_121_service_api,
      '/user/login',
      {
        email,
        password
      },
      true
    ).pipe(
      map((response) => {
        console.log('response: ', response);

        const user = response.user;

        if (user && user.token) {
          this.jwtService.saveToken(user.token);
        }
      })
    );
  }

  getCountries(): Observable<any[]> {
    return this.apiService.get(
      environment.url_121_service_api,                    
      '/programs/countrys'
    ).pipe(
      map((response) => {
        //Somehow the endpoint gives no response (needs to be fixed in back-end)
        // return response;
        return [{"id": 1, "country": "Malawi"},{"id": 2, "country": "Ethiopia"}];
      })
    );
  }

  getAllPrograms(): Observable<Program[]> {
    return this.apiService.get(
      environment.url_121_service_api,                    
      '/programs'
    ).pipe(
      map((response) => {
        console.log(response);
        return response.programs;
      })
    );
  }

  getProgramsByCountryId(countryId: number): Observable<Program[]> {
    return this.apiService.get(
      environment.url_121_service_api,                    
      '/programs?countryId='+countryId
    ).pipe(
      map((response) => {
        console.log(response);
        return response.programs;
      })
    );
  }
}
