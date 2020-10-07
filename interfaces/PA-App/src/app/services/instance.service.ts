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
  ) {
    this.getInstanceInformation();
  }

  public async getInstanceInformation(): Promise<InstanceInformation> {
    // If not already available, fall back to get it from the server
    if (!this.instanceInformation) {
      this.instanceInformation = await this.programsService.getInstanceInformation();

      this.instanceInformation.displayName = this.translatableString.get(
        this.instanceInformation.displayName,
      );

      this.instanceInformation.dataPolicy = this.translatableString.get(
        this.instanceInformation.dataPolicy,
      );
    }

    return this.instanceInformation;
  }
}
