import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReplaySubject } from 'rxjs';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import {
  InstanceData,
  InstanceInformation,
  MonitoringData,
  MonitoringInfo,
} from '../models/instance.model';

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

  private createMonitoringInfo(
    monitoringQuestion: MonitoringData,
  ): MonitoringInfo | null {
    if (!monitoringQuestion) {
      return null;
    }

    return {
      intro: this.translatableString.get(monitoringQuestion.intro),
      conclusion: this.translatableString.get(monitoringQuestion.conclusion),
      options: monitoringQuestion.options.map((option) => {
        return {
          option: option.option,
          label: this.translatableString.get(option.label),
        };
      }),
    };
  }

  private getTranslations(instanceData: InstanceData): InstanceInformation {
    return {
      name: instanceData.name,
      displayName: this.translatableString.get(instanceData.displayName),
      logoUrl: this.translatableString.get(instanceData.logoUrl),
      dataPolicy: this.translatableString.get(instanceData.dataPolicy),
      contactDetails: this.translatableString.get(instanceData.contactDetails),
      aboutProgram: this.translatableString.get(instanceData.aboutProgram),
      monitoringQuestion: this.createMonitoringInfo(
        instanceData.monitoringQuestion,
      ),
    };
  }
}
