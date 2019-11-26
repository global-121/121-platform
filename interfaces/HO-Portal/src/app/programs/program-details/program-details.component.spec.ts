import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalController, NavParams } from '@ionic/angular';

import { ProgramDetailsComponent } from './program-details.component';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';

const modalSpy = jasmine.createSpyObj('Modal', ['present']);
const modalCtrlSpy = jasmine.createSpyObj('ModalController', ['create']);
modalCtrlSpy.create.and.callFake(() => {
  return modalSpy;
});

describe('ProgramDetailsComponent', () => {
  let component: ProgramDetailsComponent;
  let fixture: ComponentFixture<ProgramDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ProgramDetailsComponent,
      ],
      imports: [
        TranslateModule.forRoot(),
        RouterModule.forRoot([]),
        HttpClientTestingModule
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: ModalController,
          useValue: modalCtrlSpy
        },
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
