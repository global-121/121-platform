import { Component } from '@angular/core';
import { ValidationComponent } from '../validation-components.interface';
import { ConversationService } from 'src/app/services/conversation.service';
import { ValidationComponents } from '../validation-components.enum';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Storage } from '@ionic/storage';

class ValidationAnswer {
  id: number;
  did: string;
  programId: number;
  attributeId: number;
  attribute: string;
  answer: string | number;
}

@Component({
  selector: 'app-download-data',
  templateUrl: './download-data.component.html',
  styleUrls: ['./download-data.component.scss'],
})
export class DownloadDataComponent implements ValidationComponent {
  public downloadReady = false;
  public nrDownloaded: number;

  constructor(
    public programsService: ProgramsServiceApiService,
    public conversationService: ConversationService,
    private storage: Storage
  ) {}

  async ngOnInit() {
    await this.downloadData();
  }

  public async downloadData() {
    const validationData: ValidationAnswer[] = await this.programsService.downloadData();
    await this.storage.set('validationData', validationData);

    const myPrograms = await this.getProgramData(validationData);
    await this.storage.set('myPrograms', myPrograms);

    this.nrDownloaded = this.countUniqueDids(validationData);
    this.downloadReady = true;
    this.complete();
  }

  private async getProgramData(validationData: ValidationAnswer[]) {
    const programIds = this.getUniqueProgramIds(validationData);
    const programRequests = [];
    const myPrograms = [];

    programIds.forEach(async (programId) => {
      programRequests.push(
        this.programsService
          .getProgramById(programId)
          .then((programData) => myPrograms.push(programData))
      );
    });
    await Promise.all(programRequests);

    return myPrograms;
  }

  private getUniqueProgramIds(validationData: ValidationAnswer[]) {
    const programIds = [];
    validationData.forEach((item) => {
      if (!programIds.includes(item.programId)) {
        programIds.push(item.programId);
      }
    });

    return programIds;
  }

  public countUniqueDids(validationData: ValidationAnswer[]): number {
    const dids = [];
    validationData.forEach((item) => {
      if (!dids.includes(item.did)) {
        dids.push(item.did);
      }
    });
    return dids.length;
  }

  getNextSection() {
    return ValidationComponents.mainMenu;
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: ValidationComponents.viewAppointments,
      data: {},
      next: this.getNextSection(),
    });
  }
}
