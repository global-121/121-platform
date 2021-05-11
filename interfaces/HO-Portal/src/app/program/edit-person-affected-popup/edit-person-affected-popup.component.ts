import { Component, OnInit, ViewChild } from '@angular/core';
import { NgModel } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-edit-person-affected-popup',
  templateUrl: './edit-person-affected-popup.component.html',
  styleUrls: ['./edit-person-affected-popup.component.scss'],
})
export class EditPersonAffectedPopupComponent implements OnInit {
  public title: string;
  public notes: boolean;
  public content: any;

  @ViewChild('input')
  public input: any;
  public inputModel: NgModel;

  constructor(
    private modalController: ModalController,
    private translate: TranslateService,
  ) {}

  async ngOnInit() {}

  public getTitle() {
    return this.translate.instant(
      'page.program.program-people-affected.edit-person-affected-popup.popup-title',
      {
        pa: this.content.pa,
      },
    );
  }

  public closeModal() {
    this.modalController.dismiss();
  }
}
