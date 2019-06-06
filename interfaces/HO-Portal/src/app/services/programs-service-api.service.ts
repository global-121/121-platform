import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { ApiService } from './api.service';

import { Program } from '../models/program.model';

@Injectable({
  providedIn: 'root',
})
export class ProgramsServiceApiService {
  constructor(
    private apiService: ApiService
  ) { }

  getAllPrograms(): Observable<Program[]> {
    return this.apiService.get(
      environment.programs_service_api,
      '/programs'
    ).pipe(
      map((response) => {
        return response.programs;
      })
    );
  }
}
