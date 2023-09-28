import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { ExportListComponent } from './export-list.component';

describe('ExportListComponent', () => {
  let component: ExportListComponent;
  let fixture: ComponentFixture<ExportListComponent>;

  const mockProgramId = 1;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ExportListComponent],
      imports: [
        TranslateModule.forRoot(),
        SharedModule,
        HttpClientTestingModule,
      ],
      providers: [
        provideMagicalMock(AuthService),
        provideMagicalMock(ProgramsServiceApiService),
      ],
    }).compileComponents();
  }));

  let mockProgramsApi: jasmine.SpyObj<any>;

  beforeEach(() => {
    mockProgramsApi = TestBed.inject(ProgramsServiceApiService);
    mockProgramsApi.retrieveLatestActions.and.returnValue(
      new Promise((r) => r(null)),
    );

    fixture = TestBed.createComponent(ExportListComponent);
    component = fixture.componentInstance;

    component.programId = mockProgramId;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
