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
