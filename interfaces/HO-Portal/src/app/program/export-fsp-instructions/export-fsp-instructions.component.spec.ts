import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { ExportFspInstructionsComponent } from './export-fsp-instructions.component';

describe('ExportFspInstructionsComponent', () => {
  let component: ExportFspInstructionsComponent;
  let fixture: ComponentFixture<ExportFspInstructionsComponent>;

  const mockProgramId = 1;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ExportFspInstructionsComponent],
      imports: [
        IonicModule,
        TranslateModule.forRoot(),
        HttpClientTestingModule,
        RouterTestingModule,
        SharedModule,
      ],
      providers: [provideMagicalMock(ProgramsServiceApiService)],
    }).compileComponents();
  }));

  let mockProgramsApi: jasmine.SpyObj<any>;

  beforeEach(() => {
    mockProgramsApi = TestBed.inject(ProgramsServiceApiService);
    mockProgramsApi.retrieveLatestActions.and.returnValue(
      new Promise((r) => r(null)),
    );

    fixture = TestBed.createComponent(ExportFspInstructionsComponent);
    component = fixture.componentInstance;

    component.programId = mockProgramId;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
