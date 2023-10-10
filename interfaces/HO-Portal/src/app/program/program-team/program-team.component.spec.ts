import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ProgramTeamPage } from './program-team.component';

describe('ProgramTeamComponent', () => {
  let component: ProgramTeamPage;
  let fixture: ComponentFixture<ProgramTeamPage>;

  beforeEach(waitForAsync(() => {
    const modalSpy = jasmine.createSpyObj('Modal', ['present']);
    const modalCtrlSpy = jasmine.createSpyObj('ModalController', ['create']);
    modalCtrlSpy.create.and.callFake(() => modalSpy);

    TestBed.configureTestingModule({
      declarations: [ProgramTeamPage],
      imports: [
        TranslateModule.forRoot(),
        RouterTestingModule,
        HttpClientTestingModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: ModalController,
          useValue: modalCtrlSpy,
        },
      ],
    }).compileComponents;
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramTeamPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
