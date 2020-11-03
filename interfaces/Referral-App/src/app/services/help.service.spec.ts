import { TestBed } from '@angular/core/testing';
import { HelpService } from './help.service';
import { SpreadsheetService } from './spreadsheet.service';

describe('HelpService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SpreadsheetService,
        },
      ],
    }),
  );

  it('should be created', () => {
    const service: HelpService = TestBed.get(HelpService);
    expect(service).toBeTruthy();
  });
});
