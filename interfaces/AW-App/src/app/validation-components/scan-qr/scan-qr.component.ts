import { SessionStorageService } from './../../services/session-storage.service';
import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Router, ActivatedRoute } from '@angular/router';
import { ValidationComponent } from '../validation-components.interface';
import { ConversationService } from 'src/app/services/conversation.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { jsonpCallbackContext } from '@angular/common/http/src/module';
import { ValidationComponents } from '../validation-components.enum';

@Component({
  selector: 'app-scan-qr',
  templateUrl: './scan-qr.component.html',
  styleUrls: ['./scan-qr.component.scss'],
})
export class ScanQrComponent implements ValidationComponent {

  public did: string;
  public programId: number;
  public scanError = false;
  public didResult = false;
  public unknownDidCombination = false;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public storage: Storage,
    public conversationService: ConversationService,
    public programsService: ProgramsServiceApiService,
    public sessionStorageService: SessionStorageService
  ) {
  }

  ngOnInit() {
    console.log('init scan qr');
  }

  public scanQrCode() {
    const storageSubscription = this.sessionStorageService.watchStorage().subscribe((data: string) => {
      console.log('bla');
      console.log('sessionStorageService.watchStorage');
      this.checkScannedDid();
      storageSubscription.unsubscribe();
      // this will call whenever your localStorage data changes
      // use localStorage code here and set your data here for ngFor
    });
    this.router.navigate(['/scan-qr']);
  }

  public async checkScannedDid() {
    this.sessionStorageService.retrieve(this.sessionStorageService.type.scannedDid).then(data => {

      if (this.isNotJson(data)) {
        this.scanError = true;
        return;
      }

      const jsonData = JSON.parse(data);


      if (!jsonData && !jsonData.did && !jsonData.programId) {
        this.scanError = true;
        console.log('this.scanError: ', this.scanError);
        return;
      }

      this.did = jsonData.did;

      this.programId = jsonData.programId;
      this.programsService.getPrefilledAnswers(this.did, this.programId).subscribe(response => {
        if (response.length === 0) {
          this.unknownDidCombination = true;
          console.log('this.scanError: ', this.unknownDidCombination);
          return;
        }

        this.storage.set('scannedDid', this.did);
        this.storage.set('scannedProgramId', this.programId);
        this.didResult = true;
        this.cleanup();

        this.complete();

      });



    });
  }

  cleanup() {
    this.unknownDidCombination = false;
    this.scanError = false;
    this.sessionStorageService.destroyItem(this.sessionStorageService.type.scannedDid);
  }


  getNextSection() {
    return ValidationComponents.validateProgram;
  }

  isNotJson(str: string): boolean {
    try {
      JSON.parse(str);
    } catch (e) {
      return true;
    }
    return false;
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: ValidationComponents.mainMenu,
      data: {
      },
      next: this.getNextSection(),
    });
  }

}
