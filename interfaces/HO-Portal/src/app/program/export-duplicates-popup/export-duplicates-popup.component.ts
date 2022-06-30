import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { DuplicateAttributesProps } from '../../shared/confirm-prompt/confirm-prompt.component';

@Component({
  selector: 'app-export-duplicates-popup',
  templateUrl: './export-duplicates-popup.component.html',
  styleUrls: ['./export-duplicates-popup.component.scss'],
})
export class ExportDuplicatesPopupComponent implements OnInit {
  @Input()
  public duplicateAttributesProps: DuplicateAttributesProps;

  constructor(private modalController: ModalController) {}

  ngOnInit() {}

  public submitConfirm() {
    this.modalController.dismiss(null, null);
  }

  public closeModal() {
    this.modalController.dismiss(null, 'cancel');
  }
}
