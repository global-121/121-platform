import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { InstanceInformation } from '../models/instance.model';

@Injectable({
  providedIn: 'root',
})
export class InstanceService {
  private cachedInstanceInformation = new ReplaySubject<InstanceInformation>();
  public instanceInformation = this.cachedInstanceInformation.asObservable();

  constructor(
    private programsService: ProgramsServiceApiService,
    private translatableString: TranslatableStringService,
  ) {
    this.getInstanceInformation();
  }

  private async getInstanceInformation() {
    const instanceData = await this.programsService.getInstanceInformation();

    this.cachedInstanceInformation.next({
      name: instanceData.name,
      displayName: this.translatableString.get(instanceData.displayName),
      dataPolicy: this.translatableString.get(instanceData.dataPolicy),
      contactDetails: this.translatableString.get(instanceData.contactDetails),
      aboutProgram: this.translatableString.get(instanceData.aboutProgram),
    });
  }
}
