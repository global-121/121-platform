import { Component, OnInit } from '@angular/core';
import { CustomTranslateService } from 'src/app/services/custom-translate.service';

@Component({
  selector: 'app-tell-needs',
  templateUrl: './tell-needs.component.html',
  styleUrls: ['./tell-needs.component.scss'],
})
export class TellNeedsComponent implements OnInit {

  public inputPlaceholder: any;
  public needs: any;

  constructor(
    public customTranslateService: CustomTranslateService
  ) { }

  ngOnInit() {
    this.inputPlaceholder = this.customTranslateService.translate('personal.tell-needs.input-placeholder');
  }

  public submitNeeds(needsInput) {
    console.log('needs-input: ', needsInput);
  }

}
