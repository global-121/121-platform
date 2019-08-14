import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { timer } from 'rxjs';
import { ProgramsServiceApiService } from './programs-service-api.service';
import { InclusionStorage } from '../models/local-storage/inclusion-storage.model';
import { InclusionStatus } from '../models/inclusion-status.model';

@Injectable({
  providedIn: 'root'
})

export class UpdateService {
  updateSpeedMs = 3000;

  constructor(public programsService: ProgramsServiceApiService) { }
  checkInclusion(programId: number): void {
    const allInclusion: InclusionStorage[] = this.getLocalStorageArray('inclusion');
    for (const inclusion of allInclusion) {
      if (inclusion.programId === programId || inclusion.programId in ['excluded', 'included']) {
        return;
      }
    }
    this.listenForInclusion(programId, allInclusion);
  }

  listenForInclusion(programId: number, allInclusion: InclusionStorage[]): void {
    this.programsService.getInclusionStatus(programId).subscribe(response => {
      console.log(response);
      if (response.status === 'unavailable') {
        setTimeout(() => {
          this.listenForInclusion(programId, allInclusion);
        }, this.updateSpeedMs);
      } else if (response.status in ['included', 'excluded']) {
        this.storeInclusion(response, programId, allInclusion);
      }
    });
  }

  storeInclusion(response: InclusionStatus, programId: number, allInclusion: InclusionStorage[]) {
    const inclusionState: InclusionStorage = {
      programId,
      status: response.status
    };
    allInclusion.push(inclusionState);
    this.setLocalStorage('inclusion', allInclusion);
  }

  getLocalStorageArray(itemKey: string): any {
    let value: [];
    const valueString = localStorage.getItem(itemKey);
    if (valueString) {
      value = JSON.parse(valueString);
    } else {
      value = [];
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
