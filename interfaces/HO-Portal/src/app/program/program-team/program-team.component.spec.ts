import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ProgramTeamTableComponent } from './program-team-table/program-team-table.component';
import { ProgramTeamComponent } from './program-team.component';
import { TeamMemberService } from '../../services/team-member.service';

describe('ProgramTeamComponent', () => {
  let component: ProgramTeamComponent;
  let fixture: ComponentFixture<ProgramTeamComponent>;

  beforeEach(waitForAsync(() => {
    const modalSpy = jasmine.createSpyObj('Modal', ['present']);
    const modalCtrlSpy = jasmine.createSpyObj('ModalController', ['create']);
    modalCtrlSpy.create.and.callFake(() => modalSpy);

    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        IonicModule,
        TranslateModule.forRoot(),
        RouterTestingModule,
        HttpClientTestingModule,
        ProgramTeamTableComponent,
      ],
      providers: [
        {
          provide: ModalController,
          useValue: modalCtrlSpy,
        },
        TeamMemberService,
      ],
    }).compileComponents;
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramTeamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
