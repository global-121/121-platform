import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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
      'programs-service',
      '/programs'
    );
  }
}
