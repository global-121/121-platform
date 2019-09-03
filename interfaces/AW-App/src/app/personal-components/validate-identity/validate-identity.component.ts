import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-validate-identity',
  templateUrl: './validate-identity.component.html',
  styleUrls: ['./validate-identity.component.scss'],
})
export class ValidateIdentityComponent implements OnInit {

  public did: any;
  public answers: any;
  public credentialIssued = false;
  public verificationPostponed = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public programsService: ProgramsServiceApiService,
    public storage: Storage
  ) {
    this.route.queryParams.subscribe(params => {
      if (params && params.did) {
        this.did = JSON.parse(params.did);
      }
    });
  }

  ngOnInit() {
    this.storage.set('scannedDid', this.did);
  }

  public getPrefilledAnswersIdentity(did: string) {
    this.programsService.getPrefilledAnswers(did, null).subscribe(response => {
      this.answers = response;
      this.verificationPostponed = false;
    });
  }

  public postponeVerification() {
    this.verificationPostponed = true;
  }

  public issueIdentityCredential(did: string) {
    // DUMMY fix later
    // const credentialJson = {};
    // this.programsService.issueCredential(did, null, credentialJson).subscribe(response => {
    //   console.log('response: ', response);
    //   this.credentialIssued = true;
    // });
    this.programsService.deletePrefilledAnswers(did, null).subscribe(response => {
      console.log('response: ', response);
      console.log('Identity credential issued');
      this.credentialIssued = true;
      this.answers = null;
    });
  }
}
