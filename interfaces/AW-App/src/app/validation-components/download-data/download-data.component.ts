import { Component } from '@angular/core';
import { ConversationService } from 'src/app/services/conversation.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import {
  DownloadService,
  ValidationAnswer,
} from '../../services/download.service';
import { ValidationComponents } from '../validation-components.enum';
import { ValidationComponent } from '../validation-components.interface';

@Component({
  selector: 'app-download-data',
  templateUrl: './download-data.component.html',
  styleUrls: ['./download-data.component.scss'],
})
export class DownloadDataComponent implements ValidationComponent {
  public downloadReady = false;
  public downloadAborted = false;
  public nrDownloaded: number;

  constructor(
    public programsService: ProgramsServiceApiService,
    public conversationService: ConversationService,
    private downloadService: DownloadService,
  ) {}

  async ngOnInit() {
    await this.downloadData();
  }

  private async downloadData() {
    const downloadResult = await this.downloadService.downloadData();
    if (!downloadResult || downloadResult.length === 0) {
      this.downloadAborted = true;
      this.complete();
      return;
    }

    this.nrDownloaded = this.countUniqueRegistrations(downloadResult);
    this.downloadReady = true;
    this.complete();
  }

  public countUniqueRegistrations(validationData: ValidationAnswer[]): number {
    const referenceIds = [];
    validationData.forEach((item) => {
      if (!referenceIds.includes(item.referenceId)) {
        referenceIds.push(item.referenceId);
      }
    });
    return referenceIds.length;
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
