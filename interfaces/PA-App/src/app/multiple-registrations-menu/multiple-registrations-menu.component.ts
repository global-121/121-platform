import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { RegistrationModeService } from '../services/registration-mode.service';

@Component({
  selector: 'app-multiple-registrations-menu',
  templateUrl: './multiple-registrations-menu.component.html',
  styleUrls: ['./multiple-registrations-menu.component.scss'],
})
export class MultipleRegistrationsMenuComponent {
  constructor(
    private modalController: ModalController,
    public registrationMode: RegistrationModeService,
  ) {}

  close() {
    this.modalController.dismiss();
  }

  public storeMode() {
    this.registrationMode.storeMode();
  }
}
