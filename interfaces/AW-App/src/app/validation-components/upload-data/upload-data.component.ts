import { Component } from '@angular/core';
import { Storage } from '@ionic/storage';
import { FspAnswer, ValidatedPaData } from 'src/app/models/pa-data.model';
import { ConversationService } from 'src/app/services/conversation.service';
import { IonicStorageTypes } from 'src/app/services/iconic-storage-types.enum';
import { DownloadService } from '../../services/download.service';
import { ValidationComponents } from '../validation-components.enum';
import { ValidationComponent } from '../validation-components.interface';
import { ProgramsServiceApiService } from './../../services/programs-service-api.service';

@Component({
  selector: 'app-upload-data',
  templateUrl: './upload-data.component.html',
  styleUrls: ['./upload-data.component.scss'],
})
export class UploadDataComponent implements ValidationComponent {
  public uploadReady = false;
  public uploadAborted = false;
  public uploadDataStored: boolean;
  public nrStored: number;

  constructor(
    public programsService: ProgramsServiceApiService,
    public conversationService: ConversationService,
    private storage: Storage,
    private downloadService: DownloadService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.uploadData();
  }

  public async uploadData(): Promise<void> {
    const validatedData: ValidatedPaData[] = await this.storage.get(
      IonicStorageTypes.validatedData,
    );
    if (validatedData && validatedData.length > 0) {
      this.uploadDataStored = true;
      this.nrStored = validatedData.length;
      for (const paAnswers of validatedData) {
        await this.validateProgramAnswers(paAnswers);
        if (this.uploadAborted) {
          break;
        }
        await this.validateFspAnswers(
          paAnswers.programId,
          paAnswers.fspanswers,
        );
        if (this.uploadAborted) {
          break;
        }
        await this.removeLocalStorageData(
          paAnswers.referenceId,
          IonicStorageTypes.validatedData,
        );
      }
      this.uploadReady = true;
      await this.downloadService.downloadData();
    } else {
      this.uploadDataStored = false;
    }
    this.complete();
  }

  public async validateProgramAnswers(paData: ValidatedPaData): Promise<void> {
    if (!paData.programAnswers) {
      console.log('UploadData: No attributes validated, nothing to upload.');
      return;
    }
    await this.programsService
      .postValidationData(
        paData.programId,
        paData.referenceId,
        paData.programAnswers,
      )
      .then(
        () => {
          console.log(
            `UploadData: Upload ${paData.programAnswers.length} validated answers succesful for : ${paData.referenceId}`,
          );
        },
        (e) => {
          console.log('e: ', e);
          console.warn(
            `UploadData: Upload ${paData.programAnswers.length} validated answers failed for : ${paData.referenceId}`,
          );
          this.uploadAborted = true;
        },
      );
  }

  public async validateFspAnswers(
    programId: number,
    validatedFspAnswers: FspAnswer[],
  ): Promise<void> {
    if (!validatedFspAnswers) {
      console.log('UploadData: No FSP-answers validated, nothing to upload.');
      return;
    }
    for (const answer of validatedFspAnswers) {
      try {
        await this.programsService.postRegistrationCustomAttribute(
          programId,
          answer.referenceId,
          answer.code,
          answer.value,
        );
        console.log(
          `UploadData: Upload validated answer "${answer.code}" succesful for : ${answer.referenceId}`,
        );
      } catch (error) {
        console.warn(
          `UploadData: Upload validated answer "${answer.code}" failed for : ${answer.referenceId}`,
          error,
        );
        this.uploadAborted = true;
        return;
      }
    }
  }

  public async removeLocalStorageData(
    referenceId: string,
    type: IonicStorageTypes,
  ): Promise<void> {
    let data = await this.storage.get(type);
    if (data) {
      data = data.filter((item) => item.referenceId !== referenceId);
      await this.storage.set(type, data);
    }
  }

  getNextSection(): string {
    return ValidationComponents.mainMenu;
  }

  complete(): void {
    this.conversationService.onSectionCompleted({
      name: ValidationComponents.uploadData,
      data: {},
      next: this.getNextSection(),
    });
  }
}
