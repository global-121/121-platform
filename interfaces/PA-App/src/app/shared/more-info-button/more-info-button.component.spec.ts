import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular';

import { MoreInfoButtonComponent } from './more-info-button.component';
import { TranslateModule } from '@ngx-translate/core';

describe('MoreInfoButtonComponent', () => {
  let component: MoreInfoButtonComponent;
  let fixture: ComponentFixture<MoreInfoButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MoreInfoButtonComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [TranslateModule.forRoot()],
      providers: [
        {
          provide: ModalController,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MoreInfoButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
