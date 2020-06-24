import { Storage } from '@ionic/storage';
import { Component } from '@angular/core';
import { ValidationComponent } from '../validation-components.interface';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { ConversationService } from 'src/app/services/conversation.service';
import { SessionStorageService } from 'src/app/services/session-storage.service';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { ValidationComponents } from '../validation-components.enum';
import { PaDataAttribute } from 'src/app/models/pa-data.model';

@Component({
  selector: 'app-validate-fsp',
  templateUrl: './validate-fsp.component.html',
  styleUrls: ['./validate-fsp.component.scss'],
})
export class ValidateFspComponent implements ValidationComponent {
  public did: string;
  public programId: number;


  constructor(
    public translatableString: TranslatableStringService,
    public programsService: ProgramsServiceApiService,
    public conversationService: ConversationService,
    public sessionStorageService: SessionStorageService,
    public router: Router,
    public ionContent: IonContent,
    private storage: Storage,
  ) { }

  async ngOnInit() {
    const paData = await this.getPaData();
    this.did = paData[0].did;
    this.programId = paData[0].programId;

  }

  private async getPaData(): Promise<PaDataAttribute[]> {
    const paDataRaw = await this.sessionStorageService.retrieve(
      this.sessionStorageService.type.paData,
    );
    return JSON.parse(paDataRaw);
  }


  getNextSection() {
    return ValidationComponents.mainMenu;
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: ValidationComponents.validateProgram,
      data: {},
      next: this.getNextSection(),
    });
  }

}
