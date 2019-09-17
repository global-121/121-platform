import { TranslateService } from '@ngx-translate/core';
import { Injectable } from '@angular/core';
import { ProgramsServiceApiService } from './programs-service-api.service';
import { InclusionStorage } from '../models/local-storage/inclusion-storage.model';
import { ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { Router } from '@angular/router';
import { Observable, of, interval, timer, from } from 'rxjs';
import { concatMap, map, filter, take, switchMap, takeWhile } from 'rxjs/operators';


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

  public credential: any;

  public pagesNav = {
    inclusion: 'tabs/tab1',
    credential: 'tabs/personal'
  };

  constructor(
    public programsService: ProgramsServiceApiService,
    public toastController: ToastController,
    public translate: TranslateService,
    public storage: Storage,
    public router: Router) { }

  async checkInclusion(programId: number): Promise<void> {
    this.createUpdateToast('notification.inclusion', this.pagesNav.inclusion);
    const allInclusion: InclusionStorage[] = await this.getLocalStorageArray(this.inclusionStatusStorage);
    for (const inclusion of allInclusion) {
      if (inclusion.programId === programId &&
        (inclusion.status === this.inclusionStatus.included || inclusion.status === this.inclusionStatus.included)) {
        return;
      }
    }
    this.listenForInclusion(programId, allInclusion);
  }

  listenForInclusion(programId: number, allInclusion: InclusionStorage[]): void {
    const did = localStorage.getItem(this.didStorage);
    this.programsService.getInclusionStatus(programId, did).subscribe(response => {
      if (response.status === this.inclusionStatus.unavailable) {
        setTimeout(() => {
          this.listenForInclusion(programId, allInclusion);
        }, this.updateSpeedMs);
      } else if (response.status === this.inclusionStatus.included || response.status === this.inclusionStatus.excluded) {
        this.storeStatus(response.status, programId, did, allInclusion, this.inclusionStatusStorage);
        this.createUpdateToast('notification.inclusion', this.pagesNav.inclusion);
      }
    });
  }

  checkCredential(programId: number, did: string) {
    return new Promise(resolve => {
      const subscription = this.listenForCredential(programId, did).subscribe(isCredAvailable => {
        console.log('isCredAvailable', isCredAvailable);
        if (isCredAvailable.message !== '') {
          subscription.unsubscribe();
          this.createUpdateToast('notification.credential', this.pagesNav.credential);
          resolve();
        }
      });
    });
  }

  listenForCredential(programId: number, did: string) {
    console.log('testListenForCredential');
    let subscription;
    return subscription = interval(this.updateSpeedMs).pipe(
      switchMap(() => this.programsService.getCredential(did))
    );
  }

  createUpdateToast(messageKey: string, pageNav: string) {
    this.translate.get(messageKey).subscribe((message: string) => {
      const closeButtonText = this.translate.instant('notification.close');
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
