import { Injectable } from '@angular/core';
import { Help } from 'src/app/models/help.model';
import { SpreadsheetService } from './spreadsheet.service';

@Injectable({
  providedIn: 'root',
})
export class HelpService {
  constructor(private spreadsheetService: SpreadsheetService) {}

  getHelp(): Promise<Help> {
    return this.spreadsheetService.getHelp();
  }
}
