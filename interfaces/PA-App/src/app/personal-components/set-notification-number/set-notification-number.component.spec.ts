import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslateModule } from '@ngx-translate/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PaDataService } from 'src/app/services/padata.service';
import { MockPaDataService } from 'src/app/mocks/padata.service.mock';

import { SetNotificationNumberComponent } from './set-notification-number.component';

describe('SetNotificationNumberComponent', () => {
  let component: SetNotificationNumberComponent;
  let fixture: ComponentFixture<SetNotificationNumberComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SetNotificationNumberComponent],
      imports: [TranslateModule.forRoot(), HttpClientTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: PaDataService,
          useValue: MockPaDataService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetNotificationNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
