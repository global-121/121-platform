import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { timer } from 'rxjs';
import { ProgramsServiceApiService } from './programs-service-api.service';

@Injectable({
  providedIn: 'root'
})

export class UpdateService {
  constructor(public programsService: ProgramsServiceApiService) { }
  checkInclusion(programId: number): void {
    const allInclusion = JSON.parse(localStorage.getItem('inclusion'));
    this.programsService.getInclusionStatus(programId).subscribe(response => {
      if (response.status === 'unavailable') {
        const secondsWait = 3;
        setTimeout(() => {
          console.log(new Date());
          this.checkInclusion(programId);
        }, secondsWait * 1000);
      } else {
        const inclusionState = {
          programId: programId,
          status: response.status
        };

        allInclusion.push(inclusionState);
        console.log(allInclusion);
        window.localStorage.setItem(
          'inclusion',
          JSON.stringify(allInclusion)
        );
      }
    });
  }
}
