import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import mockAppointmentsResponse from '../../mocks/api.appointments.mock';
import { ViewAppointmentsComponent } from './view-appointments.component';

describe('ViewAppointmentsComponent', () => {
  let component: ViewAppointmentsComponent;
  let fixture: ComponentFixture<ViewAppointmentsComponent>;

  beforeEach(async(() => {
    // Mock the used service:
    const programsServiceApiService = jasmine.createSpyObj(
      'ProgramsServiceApiService',
      ['getAppointments'],
    );
    programsServiceApiService.getAppointments.and.returnValue(
      of(mockAppointmentsResponse.appointments),
    );

    TestBed.configureTestingModule({
      declarations: [ViewAppointmentsComponent],
      imports: [TranslateModule.forRoot(), HttpClientTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: ProgramsServiceApiService,
          useValue: programsServiceApiService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewAppointmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
