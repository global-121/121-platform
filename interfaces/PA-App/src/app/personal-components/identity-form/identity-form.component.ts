import { Component, OnInit } from '@angular/core';
import { CustomTranslateService } from 'src/app/services/custom-translate.service';

@Component({
  selector: 'app-identity-form',
  templateUrl: './identity-form.component.html',
  styleUrls: ['./identity-form.component.scss'],
})
export class IdentityFormComponent implements OnInit {

  public namePlaceholder: any;
  public dobPlaceholder: any;
  public name: any;
  public dob: any;
  public identitySubmitted: boolean;

  constructor(
    public customTranslateService: CustomTranslateService
  ) { }

  ngOnInit() {
    this.namePlaceholder = this.customTranslateService.translate('personal.identity-form.name-placeholder');
    this.dobPlaceholder = this.customTranslateService.translate('personal.identity-form.dob-placeholder');
  }

  public submitIdentityForm(name, dob) {
    this.identitySubmitted = true;
    console.log(name, dob);
  }


}
