import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalController, NavParams } from '@ionic/angular';

import { ProgramModalPage } from './program-modal.page';
import { TranslateModule } from '@ngx-translate/core';

describe('ProgramModalPage', () => {
  let component: ProgramModalPage;
  let fixture: ComponentFixture<ProgramModalPage>;

  const modalSpy = jasmine.createSpyObj('Modal', ['present']);
  let modalCtrlSpy = jasmine.createSpyObj('ModalController', ['create']);
  modalCtrlSpy.create.and.callFake(function () {
      return modalSpy;
  });

  const navParamsMock = new NavParams({data: 'foo'});

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ProgramModalPage],
      imports: [
        TranslateModule.forRoot(),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: ModalController,
          useValue: modalCtrlSpy
        },
        {
          provide: NavParams,
          useValue: navParamsMock
        }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramModalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
