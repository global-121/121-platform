import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Program } from 'src/app/models/program.model';

@Component({
  selector: 'app-program-json',
  templateUrl: './program-json.component.html',
  styleUrls: ['./program-json.component.scss'],
})
export class ProgramJsonComponent implements OnInit {
  program: Program;

  constructor(private modalController: ModalController) {}

  ngOnInit() {}

  public closeModal() {
    this.modalController.dismiss();
  }
}
