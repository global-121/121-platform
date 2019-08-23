import { Component, OnInit } from '@angular/core';
import { CustomTranslateService } from 'src/app/services/custom-translate.service';

@Component({
  selector: 'app-create-password',
  templateUrl: './create-password.component.html',
  styleUrls: ['./create-password.component.scss'],
})
export class CreatePasswordComponent implements OnInit {

  public createPasswordPlaceholder: any;
  public confirmPasswordPlaceholder: any;
  public create: any;
  public confirm: any;
  public passwordCreated: boolean;

  constructor(
    public customTranslateService: CustomTranslateService
  ) { }

  ngOnInit() {
    this.createPasswordPlaceholder = this.customTranslateService.translate('personal.create-password.create-password');
    this.confirmPasswordPlaceholder = this.customTranslateService.translate('personal.create-password.confirm-password');
  }

  public submitPassword(create, confirm) {
    this.passwordCreated = true;
    console.log(create, confirm);
  }

}
