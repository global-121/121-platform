import { Injectable } from '@angular/core';
import { ReferralPageData } from 'src/app/models/referral-page-data';
import { SpreadsheetService } from './spreadsheet.service';

@Injectable({
  providedIn: 'root',
})
export class ReferralPageDataService {
  constructor(private spreadsheetService: SpreadsheetService) {}

  getReferralPageData(region): Promise<ReferralPageData> {
    return this.spreadsheetService.getReferralPageData(region);
  }
}
