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
  public ionicStorageTypes = IonicStorageTypes;

  constructor(
    public programsService: ProgramsServiceApiService,
    public conversationService: ConversationService,
    private storage: Storage
  ) { }

  async ngOnInit(): Promise<void> {
    await this.uploadData();
  }

  public async uploadData(): Promise<void> {
    const credentials = await this.storage.get(this.ionicStorageTypes.credentials)
    for (const credential of credentials) {
      await this.issueDeleteCredential(credential)
    }

  }

  public async issueDeleteCredential(credential: any) {
    await this.programsService.issueCredential(
      credential.did,
      credential.programId,
      credential.attributes
    );
    await this.removeCredentialByDid(credential.did);
  }

  public async removeCredentialByDid(did: string) {
    const currentCredentials = await this.storage.get(this.ionicStorageTypes.credentials);
    currentCredentials.splice(currentCredentials.findIndex(item => item.did === did), 1);
    await this.storage.set(this.ionicStorageTypes.credentials, currentCredentials);
  }


  getNextSection() {
    return ValidationComponents.mainMenu;
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: ValidationComponents.uploadData,
      data: {},
      next: this.getNextSection(),
    });
  }

}
