import { Component, OnInit } from '@angular/core';
import { CustomTranslateService } from 'src/app/services/custom-translate.service';

@Component({
  selector: 'app-get-info',
  templateUrl: './get-info.component.html',
  styleUrls: ['./get-info.component.scss'],
})
export class GetInfoComponent implements OnInit {

  public infoOptions: any;

  constructor(
    public customTranslateService: CustomTranslateService
  ) { }

  ngOnInit() {
    this.infoOptions = [
      { id: 1, option: this.customTranslateService.translate('personal.get-info.option1') },
      { id: 2, option: this.customTranslateService.translate('personal.get-info.option2') },
      { id: 3, option: this.customTranslateService.translate('personal.get-info.option3') }
    ];
  }



}
