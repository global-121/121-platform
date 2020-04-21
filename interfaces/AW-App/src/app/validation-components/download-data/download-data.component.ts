import { Component } from '@angular/core';
import { ValidationComponent } from '../validation-components.interface';
import { ConversationService } from 'src/app/services/conversation.service';
import { ValidationComponents } from '../validation-components.enum';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

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
  ) { }

  async ngOnInit() {
    await this.downloadData();
  }

  public async downloadData() {
    const data = await this.programsService.downloadData();
    this.nrDownloaded = this.uniqueDids(data);
    this.downloadReady = true;
  }

  public uniqueDids(array) {
    const dids = [];
    for (const record of array) {
      if (!dids.includes(record.did)) {
        dids.push(record.did);
      }
    }
    return dids.length;
  }

  public backMainMenu() {
    this.complete();
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
