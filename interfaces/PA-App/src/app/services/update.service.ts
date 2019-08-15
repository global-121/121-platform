import { Injectable } from '@angular/core';
import { ProgramsServiceApiService } from './programs-service-api.service';
import { InclusionStorage } from '../models/local-storage/inclusion-storage.model';
import { InclusionStatus } from '../models/inclusion-status.model';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})

export class UpdateService {
  updateSpeedMs = 3000;

  constructor(public programsService: ProgramsServiceApiService) { }

  checkInclusion(programId: number): void {
    const allInclusion: InclusionStorage[] = this.getLocalStorageArray('inclusionStatus');
    for (const inclusion of allInclusion) {
      console.log(inclusion);
      if (inclusion.programId === programId && (inclusion.status === 'included' || inclusion.status === 'excluded')) {
        return;
      }
    }
    this.listenForInclusion(programId, allInclusion);
  }

  checkCredential(programId: number): void {
    const allCredentialState = this.getLocalStorageArray('credentialStatus');
    console.log(allCredentialState);
    for (const credentialState of allCredentialState) {
      if (credentialState.programId === programId && credentialState.status === 'received') {
        console.log(credentialState);
        return;
      }
    }
    this.listenForCredential(programId, allCredentialState)
  }

  listenForInclusion(programId: number, allInclusion: InclusionStorage[]): void {
    const did = localStorage.getItem('did');
    this.programsService.getInclusionStatus(programId, did).subscribe(response => {
      console.log('response', response.status);
      if (response.status === 'unavailable') {
        setTimeout(() => {
          this.listenForInclusion(programId, allInclusion);
        }, this.updateSpeedMs);
      } else if (response.status === 'included' || response.status === 'excluded') {
        this.storeStatus(response.status, programId, allInclusion, 'inclusionStatus');
      }
    });
  }

  listenForCredential(programId: number, allCredentialState: any): void {
    const did = localStorage.getItem('did');
    this.programsService.getCredential(did).subscribe(response => {
      this.storeStatus('received', programId, allCredentialState, 'credentialStatus');
    }, err => {
      setTimeout(() => {
        console.log('error', err);
        this.listenForCredential(programId, allCredentialState);
      }, this.updateSpeedMs);
    });
  }

  storeStatus(status: string, programId: number, allState: InclusionStorage[], storageName: string): void {
    const state: InclusionStorage = {
      programId,
      status,
    };
    console.log('bablabl', state);
    allState.push(state);
    this.setLocalStorage(storageName, allState);
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
