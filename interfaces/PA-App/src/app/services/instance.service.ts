import { Injectable } from '@angular/core';
import { InstanceInfo } from 'src/app/models/instance.model';
import { ProgramsServiceApiService } from './programs-service-api.service';

@Injectable({
  providedIn: 'root',
})
export class InstanceService {
  private instanceInformation: InstanceInfo;

  constructor(private programsService: ProgramsServiceApiService) {}

  public async getInstanceInformation(): Promise<InstanceInfo> {
    // If not already available, fall back to get it from the server
    if (!this.instanceInformation) {
      this.instanceInformation = await this.programsService.getInstanceInformation();
    }

    return this.instanceInformation;
  }
}
