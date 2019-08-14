import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { timer } from 'rxjs';
import { ProgramsServiceApiService } from './programs-service-api.service';
import { InclusionStorage } from '../models/local-storage/inclusion-storage.model';

@Injectable({
  providedIn: 'root'
})

export class UpdateService {
  constructor(public programsService: ProgramsServiceApiService) { }
  checkInclusion(programId: number): void {
    let allInclusion: InclusionStorage[];
    allInclusion = this.getLocalStorageArray('inclusion');
    for (const inclusion of allInclusion) {
      if (inclusion.programId === programId || inclusion.programId in ['excluded', 'included']) {
        return;
      }
    }
    this.programsService.getInclusionStatus(programId).subscribe(response => {
      if (response.status === 'unavailable') {
        const secondsWait = 3;
        setTimeout(() => {
          console.log(new Date());
          this.checkInclusion(programId);
        }, secondsWait * 1000);
      } else {
        const inclusionState: InclusionStorage = {
          programId: programId,
          status: response.status
        };
        allInclusion.push(inclusionState);
        console.log(allInclusion);
        this.setLocalStorage('inclusion', allInclusion)

      }
    });
  }

  getLocalStorageArray(itemKey: string): [any] {
    let value: [object];
    const valueString = localStorage.getItem(itemKey);
    if (valueString) {
      value = JSON.parse(valueString);
    } else {
      value = [new Object()];
      localStorage.setItem(itemKey, JSON.stringify(value));
    }
    return value;
  }

  setLocalStorage(itemKey: string, itemValue: object): void {
    const itemString = JSON.stringify(itemValue);
    window.localStorage.setItem(
      itemKey,
      itemString
    );
  }
}
