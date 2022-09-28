import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { provideMagicalMock } from '../mocks/helpers';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import { ProgramsListComponent } from './programs-list.component';

describe('ProgramListComponent', () => {
  let component: ProgramsListComponent;
  let fixture: ComponentFixture<ProgramsListComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [ProgramsListComponent],
        imports: [TranslateModule.forRoot()],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        providers: [provideMagicalMock(ProgramsServiceApiService)],
      }).compileComponents();
    }),
  );

  let mockProgramsApi: jasmine.SpyObj<any>;

  beforeEach(() => {
    mockProgramsApi = TestBed.inject(ProgramsServiceApiService);
    mockProgramsApi.getAllPrograms.and.returnValue(
      new Promise((r) => r(apiProgramsMock.programs)),
    );

    fixture = TestBed.createComponent(ProgramsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
