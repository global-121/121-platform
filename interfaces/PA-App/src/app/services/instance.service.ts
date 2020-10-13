import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { InstanceInformation } from '../models/instance.model';

@Injectable({
  providedIn: 'root',
})
export class InstanceService {
  private cachedInstanceInformation = new Subject<InstanceInformation>();
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
      aboutProgram: this.translatableString.get(instanceData.aboutProgram),
    });
  }
}
