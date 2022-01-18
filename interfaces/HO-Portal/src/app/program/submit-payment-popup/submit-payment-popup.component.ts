import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Program } from '../../models/program.model';
import { PastPaymentsService } from '../../services/past-payments.service';
import { SubmitPaymentProps } from '../../shared/confirm-prompt/confirm-prompt.component';

@Component({
  selector: 'app-submit-payment-popup',
  templateUrl: './submit-payment-popup.component.html',
  styleUrls: ['./submit-payment-popup.component.scss'],
})
export class SubmitPaymentPopupComponent implements OnInit {
  @Input()
  public submitPaymentProps: SubmitPaymentProps;

  public program: Program;

  public lastPaymentId: number;
  public nextPaymentId: number;

  constructor(
    private modalController: ModalController,
    private programsService: ProgramsServiceApiService,
    private pastPaymentsService: PastPaymentsService,
  ) {}

  async ngOnInit() {
    const programId = this.submitPaymentProps.programId;
    this.program = await this.programsService.getProgramById(programId);

    this.lastPaymentId = await this.pastPaymentsService.getLastPaymentId(
      programId,
    );
    this.nextPaymentId = this.pastPaymentsService.getNextPaymentId(
      this.lastPaymentId,
      this.program,
    );
  }

  public closeModal() {
    this.modalController.dismiss();
  }
}
