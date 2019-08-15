import { Injectable } from '@angular/core';
import { ProgramsServiceApiService } from './programs-service-api.service';
import { InclusionStorage } from '../models/local-storage/inclusion-storage.model';
import { InclusionStatus } from '../models/inclusion-status.model';
import { catchError } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})

export class UpdateService {
  public updateSpeedMs = 3000;
  public inclusionStatus = {
    included: 'included',
    excluded: 'excluded',
    unavailable: 'unavailable'
  };
  public receivedStatus = {
    received: 'received',
    unavailable: 'unavailable'
  };
  public inclusionStatusStorage = 'inclusionStatus';
  public credentialStatusStorage = 'credentialStatus';
  public didStorage = 'did';

  constructor(public programsService: ProgramsServiceApiService) { }

  checkInclusion(programId: number): void {
    const allInclusion: InclusionStorage[] = this.getLocalStorageArray(this.inclusionStatusStorage);
    for (const inclusion of allInclusion) {
      console.log(inclusion);
      if (inclusion.programId === programId &&
        (inclusion.status === this.inclusionStatus.included || inclusion.status === this.inclusionStatus.included)) {
        return;
      }
    }
    this.listenForInclusion(programId, allInclusion);
  }

  checkCredential(programId: number): void {
    const allCredentialState = this.getLocalStorageArray(this.credentialStatusStorage);
    console.log(allCredentialState);
    for (const credentialState of allCredentialState) {
      if (credentialState.programId === programId && credentialState.status === this.receivedStatus.received) {
        return;
      }
    }
    this.listenForCredential(programId, allCredentialState);
  }

  listenForInclusion(programId: number, allInclusion: InclusionStorage[]): void {
    const did = localStorage.getItem(this.didStorage);
    this.programsService.getInclusionStatus(programId, did).subscribe(response => {
      if (response.status === this.inclusionStatus.unavailable) {
        setTimeout(() => {
          this.listenForInclusion(programId, allInclusion);
        }, this.updateSpeedMs);
      } else if (response.status === this.inclusionStatus.included || response.status === this.inclusionStatus.excluded) {
        this.storeStatus(response.status, programId, allInclusion, this.inclusionStatusStorage);
      }
    });
  }

  listenForCredential(programId: number, allCredentialState: any): void {
    const did = localStorage.getItem(this.didStorage);
    this.programsService.getCredential(did).subscribe(response => {
      this.storeStatus(this.receivedStatus.received, programId, allCredentialState, this.credentialStatusStorage);
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
