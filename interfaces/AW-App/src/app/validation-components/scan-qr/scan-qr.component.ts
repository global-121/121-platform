import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Router, ActivatedRoute } from '@angular/router';
import { ValidationComponent } from '../validation-components.interface';
import { ConversationService } from 'src/app/services/conversation.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

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


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public storage: Storage,
    public conversationService: ConversationService,
    public programsService: ProgramsServiceApiService,
  ) {
  }

  ngOnInit() {
    this.getRouteParams();
  }

  public scanQrCode() {
    this.router.navigate(['/scan-qr']);
  }

  public async getRouteParams() {

    this.route.queryParams.subscribe(params => {
      console.log('params: ', params);
      console.log('this.route.queryParams.subscribe');
      if (params && params.did && params.programId) {
        console.log('Found programid and did params');
        this.did = JSON.parse(params.did);
        this.programId = JSON.parse(params.programId);
        this.programsService.getPrefilledAnswers(this.did, this.programId).subscribe(response => {
          if (response.length === 0) {
            this.scanError = true;
            return;
          } else {
            this.storage.set('scannedDid', this.did);
            this.storage.set('scannedProgramId', this.programId);
            this.didResult = true;
            this.scanError = false;
            this.complete();
          }
        });
      }
    });
  }

  getNextSection() {
    return 'validate-program';
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: 'main-menu',
      data: {
      },
      next: this.getNextSection(),
    });
  }

}
