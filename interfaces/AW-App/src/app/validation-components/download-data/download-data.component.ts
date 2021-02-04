import { Component } from '@angular/core';
import { Storage } from '@ionic/storage';
import { ConversationService } from 'src/app/services/conversation.service';
import { IonicStorageTypes } from 'src/app/services/iconic-storage-types.enum';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { ValidationComponents } from '../validation-components.enum';
import { ValidationComponent } from '../validation-components.interface';

class ValidationAnswer {
  id: number;
  did: string;
  programId: number;
  attributeId: number;
  attribute: string;
  answer: string | number;
}

class QrDidMap {
  did: string;
  qrIdentifier: string;
}

@Component({
  selector: 'app-download-data',
  templateUrl: './download-data.component.html',
  styleUrls: ['./download-data.component.scss'],
})
export class DownloadDataComponent implements ValidationComponent {
  public downloadReady = false;
  public downloadAborted = false;
  public nrDownloaded: number;

  public validationData: ValidationAnswer[];
  public qrDidMapping: QrDidMap[];
  public fspData: any;

  public ionicStorageTypes = IonicStorageTypes;

  constructor(
    public programsService: ProgramsServiceApiService,
    public conversationService: ConversationService,
    private storage: Storage,
  ) {}

  async ngOnInit() {
    await this.downloadData();
  }

  public async downloadData() {
    await this.programsService.downloadData().then(
      (response) => {
        this.validationData = response.answers;
        this.qrDidMapping = response.didQrMapping;
        this.fspData = response.fspData;
      },
      () => {
        this.downloadAborted = true;
        this.complete();
      },
    );

    // If no data is available, stop.
    if (!this.validationData) {
      this.downloadAborted = true;
      this.complete();
      return;
    }

    await this.storage.set(
      this.ionicStorageTypes.validationProgramData,
      this.validationData,
    );
    await this.storage.set(
      this.ionicStorageTypes.qrDidMapping,
      this.qrDidMapping,
    );
    await this.storage.set(
      this.ionicStorageTypes.validationFspData,
      this.fspData,
    );

    const myPrograms = await this.getProgramData(this.validationData);
    await this.storage.set(this.ionicStorageTypes.myPrograms, myPrograms);

    this.nrDownloaded = this.countUniqueDids(this.validationData);
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
          .then((programData) => myPrograms.push(programData)),
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
      name: ValidationComponents.downloadData,
      data: {},
      next: this.getNextSection(),
    });
  }
}
