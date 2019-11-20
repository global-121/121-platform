import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Program } from 'src/app/models/program.model';
import { ModalController } from '@ionic/angular';
import { ProgramModalPage } from '../program-modal/program-modal.page';
import { OverlayEventDetail } from '@ionic/core';

@Component({
  selector: 'app-program-details',
  templateUrl: './program-details.component.html',
  styleUrls: ['./program-details.component.scss'],
})
export class ProgramDetailsComponent implements OnInit {
  public program: any;

  public program: Program;
  public programTitle: string;
  public programArray: any;
  constructor(
    private route: ActivatedRoute,
    public modalController: ModalController,

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.programsService.getProgramById(id).subscribe((response) => {
      this.program = response;
      this.programTitle = this.mapLabelByLanguageCode(this.program.title);
      this.programArray = this.generateArray(this.program);
    });
  }

  public generateArray(obj) {
  async openModal() {
    const modal: HTMLIonModalElement =
      await this.modalController.create({
        component: ProgramModalPage,
        componentProps: {
          program: this.program,
        }
      });

    modal.onDidDismiss().then((detail: OverlayEventDetail) => {
      if (detail !== null) {
        console.log('The result:', detail.data);
      }
    });

    await modal.present();
  }

}
