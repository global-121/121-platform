import { ProgramsServiceApiService } from './../../services/programs-service-api.service';
import { Component } from '@angular/core';
import { Storage } from '@ionic/storage';
import { ConversationService } from 'src/app/services/conversation.service';
import { ValidationComponent } from '../validation-components.interface';
import { ValidationComponents } from '../validation-components.enum';
import { IonicStorageTypes } from 'src/app/services/iconic-storage-types.enum';

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

  public ionicStorageTypes = IonicStorageTypes;

  constructor(
    public programsService: ProgramsServiceApiService,
    public conversationService: ConversationService,
    private storage: Storage,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.uploadData();
  }

  public async uploadData(): Promise<void> {
    const credentials = await this.storage.get(
      this.ionicStorageTypes.credentials,
    );
    if (credentials && credentials.length > 0) {
      this.uploadDataStored = true;
      this.nrStored = credentials.length;
      for (const credential of credentials) {
        await this.issueCredential(credential);
        if (this.uploadAborted) {
          break;
        }
        await this.updateFsp(credential);
        if (this.uploadAborted) {
          break;
        }
        await this.removeCredentialByDid(credential.did);
      }
      this.uploadReady = true;
    } else {
      this.uploadDataStored = false;
    }
    this.complete();
  }

  public async issueCredential(credential: any): Promise<void> {
    if (credential.attributes) {
      await this.programsService
        .issueCredential(
          credential.did,
          credential.programId,
          credential.attributes,
        )
        .then(
          async () => {
            console.log('Upload credential succes for : ' + credential.did);
          },
          () => {
            this.uploadAborted = true;
          },
        );
    }
  }

  public async updateFsp(credential: any): Promise<void> {
    if (credential.fspanswers) {
      for (const answer of credential.fspanswers) {
        try {
          await this.programsService.postConnectionCustomAttribute(
            answer.did,
            answer.code,
            answer.value,
          );
          console.log(
            'Upload fsp succes for : ' + credential.did + ' for ' + answer.code,
          );
        } catch (error) {
          this.uploadAborted = true;
          return;
        }
      }
    }
  }

  public async removeCredentialByDid(did: string): Promise<void> {
    const currentCredentials = await this.storage.get(
      this.ionicStorageTypes.credentials,
    );
    currentCredentials.splice(
      currentCredentials.findIndex((item) => item.did === did),
      1,
    );
    await this.storage.set(
      this.ionicStorageTypes.credentials,
      currentCredentials,
    );
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
