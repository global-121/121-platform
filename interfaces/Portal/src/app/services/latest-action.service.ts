import { formatDate } from '@angular/common';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../environments/environment';
import { DateFormat } from '../enums/date-format.enum';
import { ActionType } from '../models/actions.model';
import { ExportType } from '../models/export-type.model';
import { ProgramsServiceApiService } from './programs-service-api.service';

@Injectable({
  providedIn: 'root',
})
export class LatestActionService {
  private locale: string;
  constructor(
    private programsService: ProgramsServiceApiService,
    private translate: TranslateService,
  ) {
    this.locale = this.translate.currentLang || environment.defaultLocale;
  }

  public async getLatestActionTime(
    actionType: ActionType | ExportType,
    programId: number,
  ): Promise<string | null> {
    const latestAction = await this.programsService.retrieveLatestActions(
      actionType,
      programId,
    );
    if (!latestAction) {
      return null;
    }
    return formatDate(
      new Date(latestAction.created),
      DateFormat.dayAndTime,
      this.locale,
    );
  }
}
