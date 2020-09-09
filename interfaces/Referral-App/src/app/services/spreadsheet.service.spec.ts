import { TestBed } from '@angular/core/testing';

import { SpreadsheetService } from './spreadsheet.service';

describe('SpreadsheetService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SpreadsheetService = TestBed.get(SpreadsheetService);
    expect(service).toBeTruthy();
  });
});
