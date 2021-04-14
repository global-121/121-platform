import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { TranslateService } from '@ngx-translate/core';
import { interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PaInclusionStates } from '../models/pa-statuses.enum';
import { PaDataService } from './padata.service';
import { ProgramsServiceApiService } from './programs-service-api.service';

@Injectable({
  providedIn: 'root',
})
export class UpdateService {
  public updateSpeedMs = 3000;

  public credential: any;

  public pagesNav = {
    inclusion: 'tabs/personal',
    credential: 'tabs/personal',
  };

  constructor(
    public programsService: ProgramsServiceApiService,
    public paData: PaDataService,
    public toastController: ToastController,
    public translate: TranslateService,
    public storage: Storage,
    public router: Router,
  ) {}

  checkInclusionStatus(programId: number, did: string) {
    return new Promise((resolve) => {
      const subscription = this.listenForInclusionStatus(
        programId,
        did,
      ).subscribe((isStatusAvailable) => {
        if (isStatusAvailable === PaInclusionStates.unavailable) {
          return;
        }
        subscription.unsubscribe();
        this.createUpdateToast(
          'notification.inclusion',
          this.pagesNav.inclusion,
        );
        resolve();
      });
    });
  }

  listenForInclusionStatus(programId: number, did: string) {
    console.log('listenForInclusionStatus()', programId, did);
    return interval(this.updateSpeedMs).pipe(
      switchMap(() =>
        this.programsService.checkInclusionStatus(did, programId),
      ),
    );
  }

  createUpdateToast(messageKey: string, pageNav: string) {
    this.translate.get(messageKey).subscribe((message: string) => {
      const closeButtonText = this.translate.instant('notification.close');
      this.toastController
        .create({
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
              },
            },
          ],
        })
        .then((obj) => {
          obj.present();
        });
    });
  }
}
