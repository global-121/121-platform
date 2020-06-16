import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslateModule } from '@ngx-translate/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterModule } from '@angular/router';
import { PaDataService } from 'src/app/services/padata.service';
import { MockPaDataService } from 'src/app/mocks/padata.service.mock';
import { UpdateService } from 'src/app/services/update.service';

import { StoreCredentialComponent } from './store-credential.component';

describe('StoreCredentialComponent', () => {
  let component: StoreCredentialComponent;
  let fixture: ComponentFixture<StoreCredentialComponent>;
  let mockUpdateService: UpdateService;

  beforeEach(async(() => {
    mockUpdateService = jasmine.createSpyObj('UpdateService', {
      checkCredential: jasmine.createSpy(),
    });

    TestBed.configureTestingModule({
      declarations: [StoreCredentialComponent],
      imports: [
        TranslateModule.forRoot(),
        RouterModule.forRoot([]),
        HttpClientTestingModule,
      ],
      providers: [
        {
          provide: PaDataService,
          useValue: MockPaDataService,
        },
        {
          provide: UpdateService,
          useValue: mockUpdateService,
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StoreCredentialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
