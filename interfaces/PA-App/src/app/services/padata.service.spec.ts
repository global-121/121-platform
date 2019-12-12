import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { Storage } from '@ionic/storage';
import { MockIonicStorage } from '../mocks/ionic.storage.mock';
import { PaAccountApiService } from './pa-account-api.service';
import { ProgramsServiceApiService } from './programs-service-api.service';
import { SovrinService } from './sovrin.service';
import { JwtService } from './jwt.service';
import { UiService } from './ui.service';

import { PaDataService } from './padata.service';

describe('PaDataService', () => {
  const mockJwtService = jasmine.createSpyObj('JwtService', {
    getToken: () => '',
  });
  const mockUiService = jasmine.createSpyObj('UiService', {
    showUserMenu: () => { },
  });

  beforeEach(() => TestBed.configureTestingModule({
    imports: [
      HttpClientTestingModule,
    ],
    providers: [
      {
        provide: Storage,
        useValue: MockIonicStorage,
      },
      {
        provide: PaAccountApiService,
      },
      {
        provide: ProgramsServiceApiService,
      },
      {
        provide: SovrinService,
      },
      {
        provide: JwtService,
        useValue: mockJwtService,
      },
      {
        provide: UiService,
        useValue: mockUiService,
      },
    ],
  }));

  it('should create', () => {
    const service: PaDataService = TestBed.get(PaDataService);
    expect(service).toBeTruthy();
  });
});
