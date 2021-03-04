import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReplaySubject } from 'rxjs';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { InstanceData, InstanceInformation } from '../models/instance.model';

@Injectable({
  providedIn: 'root',
})
export class InstanceService {
  private instanceData: InstanceData;

  private instanceInformationSource = new ReplaySubject<InstanceInformation>();
  public instanceInformation = this.instanceInformationSource.asObservable();

  constructor(
    private programsService: ProgramsServiceApiService,
    private translatableString: TranslatableStringService,
    private translate: TranslateService,
  ) {
    this.getInstanceData();

    this.translate.onLangChange.subscribe(() => {
      if (!this.instanceData) {
        return;
      }

      this.updateInstanceInformation();
    });
  }

  private async getInstanceData() {
    this.instanceData = await this.programsService.getInstanceInformation();

    this.updateInstanceInformation();
  }

  private updateInstanceInformation() {
    const instanceInfo = this.getTranslations(this.instanceData);
    this.instanceInformationSource.next(instanceInfo);
  }

  private getTranslations(instanceData: InstanceData): InstanceInformation {
    return {
      name: instanceData.name,
      displayName: this.translatableString.get(instanceData.displayName),
      logoUrl: this.translatableString.get(instanceData.logoUrl),
    };
  }
}
