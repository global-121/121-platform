import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Router, ActivatedRoute } from '@angular/router';
import { PersonalComponent } from '../personal-components.interface';
import { ConversationService } from 'src/app/services/conversation.service';

@Component({
  selector: 'app-scan-qr',
  templateUrl: './scan-qr.component.html',
  styleUrls: ['./scan-qr.component.scss'],
})
export class ScanQrComponent implements PersonalComponent {

  public did: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public storage: Storage,
    public conversationService: ConversationService,
  ) {
    this.route.queryParams.subscribe(params => {
      if (params && params.did) {
        this.did = JSON.parse(params.did);
        this.storage.set('scannedDid', this.did);
        this.complete();
      }
    });
  }

  ngOnInit() { }

  public scanQrCode() {
    this.router.navigate(['/scan-qr']);
  }

  getNextSection() {
    return 'validate-identity';
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
