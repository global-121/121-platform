import { Injectable } from '@angular/core';
import { InstanceInformation } from 'src/app/models/instance.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';

@Injectable({
  providedIn: 'root',
})
export class InstanceService {
  private instanceInformation: InstanceInformation;

  constructor(
    private programsService: ProgramsServiceApiService,
    private translatableString: TranslatableStringService,
  ) {}

  public async getInstanceInformation(): Promise<InstanceInformation> {
    // If not already available, fall back to get it from the server
    if (!this.instanceInformation) {
      const instanceData = await this.programsService.getInstanceInformation();

      this.instanceInformation = {
        name: instanceData.name,
        displayName: this.translatableString.get(instanceData.displayName),
        dataPolicy: this.translatableString.get(instanceData.dataPolicy),
      };
    }

    return this.instanceInformation;
  }
}
