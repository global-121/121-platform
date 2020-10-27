import { TestBed } from '@angular/core/testing';
import { LoggingService } from './logging.service';
import { SpreadsheetService } from './spreadsheet.service';

describe('SpreadsheetService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        {
          provide: LoggingService,
        },
      ],
    }),
  );

  it('should be created', () => {
    const service: SpreadsheetService = TestBed.get(SpreadsheetService);
    expect(service).toBeTruthy();
  });
});
