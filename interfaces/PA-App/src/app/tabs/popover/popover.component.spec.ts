import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PopoverComponent } from './popover.component';
import { TranslateModule } from '@ngx-translate/core';
import { PaDataService } from 'src/app/services/padata.service';
import { MockPaDataService } from 'src/app/mocks/padata.service.mock';

describe('PopoverComponent', () => {
  let component: PopoverComponent;
  let fixture: ComponentFixture<PopoverComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PopoverComponent],
      imports: [
        TranslateModule.forRoot()
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: PaDataService,
          useValue: MockPaDataService,
        }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopoverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
