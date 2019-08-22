import { TranslateService } from '@ngx-translate/core';
import { Injectable } from '@angular/core';
import { ProgramsServiceApiService } from './programs-service-api.service';
import { InclusionStorage } from '../models/local-storage/inclusion-storage.model';
import { ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { Router } from '@angular/router';


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

  public pagesNav = {
    inclusion: 'tabs/tab1',
    credential: 'tabs/tab1'
  };

  constructor(
    public programsService: ProgramsServiceApiService,
    public toastController: ToastController,
    public translate: TranslateService,
    public storage: Storage,
    public router: Router) { }

  async checkInclusion(programId: number): Promise<void> {
    this.createUpdateToast('TOAST.inclusion', this.pagesNav.inclusion);
    const allInclusion: InclusionStorage[] = await this.getLocalStorageArray(this.inclusionStatusStorage);
    for (const inclusion of allInclusion) {
      if (inclusion.programId === programId &&
        (inclusion.status === this.inclusionStatus.included || inclusion.status === this.inclusionStatus.included)) {
        return;
      }
    }
    this.listenForInclusion(programId, allInclusion);
  }

  async checkCredential(programId: number): Promise<void> {
    const allCredentialState = await this.getLocalStorageArray(this.credentialStatusStorage);
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
        this.createUpdateToast('TOAST.inclusion', this.pagesNav.inclusion);
      }
    });
  }

  listenForCredential(programId: number, allCredentialState: any): void {
    const did = localStorage.getItem(this.didStorage);
    this.programsService.getCredential(did).subscribe(response => {
      this.storeStatus(this.receivedStatus.received, programId, allCredentialState, this.credentialStatusStorage);
      this.createUpdateToast('TOAST.credentials', this.pagesNav.credential);
    }, err => {
      setTimeout(() => {
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

  async getLocalStorageArray(itemKey: string): Promise<any> {
    let value: [];
    const valueString = await this.storage.get(itemKey);
    if (valueString) {
      value = JSON.parse(valueString);
    } else {
      value = [];
      this.storage.set(itemKey, JSON.stringify(value));
    }
    return value;
  }

  setLocalStorage(itemKey: string, itemValue: object): void {
    const itemString = JSON.stringify(itemValue);
    this.storage.set(
      itemKey,
      itemString
    );
  }

  createUpdateToast(messageKey: string, pageNav: string) {
    this.translate.get(messageKey).subscribe((message: string) => {
      const closeButtonText = this.translate.instant('TOAST.close');
      this.toastController.create({
        header: message,
        animated: true,
        showCloseButton: true,
        closeButtonText,
        cssClass: 'update-toast',
        position: 'bottom',
        buttons: [
          {
            side: 'start',
            icon: 'share-alt',
            handler: () => {
              this.router.navigate([pageNav]);
            }
          }]
      }).then((obj) => {
        obj.present();
      });
    });
  }
}
