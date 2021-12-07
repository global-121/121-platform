import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { IonicStorageTypes } from './iconic-storage-types.enum';

export class ValidationAnswer {
  id: number;
  referenceId: string;
  programId: number;
  attributeId: number;
  attribute: string;
  answer: string | number;
}

export class QrRegistrationMap {
  referenceId: string;
  qrIdentifier: string;
}

@Injectable({
  providedIn: 'root',
})
export class DownloadService {
  constructor(
    private programsService: ProgramsServiceApiService,
    private storage: Storage,
  ) {}

  public async downloadData(): Promise<ValidationAnswer[]> {
    return await this.programsService.downloadData().then(
      async (response) => {
        const validationData: ValidationAnswer[] = response.answers;
        const qrRegistrationMapping: QrRegistrationMap[] =
          response.qrRegistrationMapping;
        const fspData = response.fspData;

        await this.storage.set(
          IonicStorageTypes.validationProgramData,
          validationData,
        );
        await this.storage.set(
          IonicStorageTypes.qrRegistrationMapping,
          qrRegistrationMapping,
        );
        await this.storage.set(IonicStorageTypes.validationFspData, fspData);

        const myPrograms = await this.getProgramData(response.programIds);
        await this.storage.set(IonicStorageTypes.myPrograms, myPrograms);

        return validationData;
      },
      () => {
        return [];
      },
    );
  }

  private async getProgramData(programIds: number[]) {
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
}
