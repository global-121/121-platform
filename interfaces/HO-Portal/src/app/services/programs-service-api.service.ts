import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { Program } from '../models/program.model';

import mockPrograms from '../mocks/programs.mock';

@Injectable({
  providedIn: 'root',
})
export class ProgramsServiceApiService {
  constructor(
  ) { }

  getAllPrograms(): Observable<Program[]> {
    return of(mockPrograms);
  }
}
