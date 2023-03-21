import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { Program } from 'src/app/models/program.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { MetricsComponent } from './metrics.component';

@Component({
  template: '<app-metrics [program]="program"></app-metrics>',
})
class TestHostComponent {
  program: Program | any;
}

describe('MetricsComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let testHost: TestHostComponent;

  const mockProgramId = 1;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MetricsComponent, TestHostComponent],
      imports: [TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideMagicalMock(TranslatableStringService),
        provideMagicalMock(ProgramsServiceApiService),
      ],
    }).compileComponents();
  }));

  let mockTranslatableStringService: jasmine.SpyObj<any>;
  let mockProgramsApi: jasmine.SpyObj<any>;

  beforeEach(() => {
    mockProgramsApi = TestBed.inject(ProgramsServiceApiService);
    mockProgramsApi.getProgramById.and.returnValue(
      new Promise((r) => r(apiProgramsMock.programs[mockProgramId])),
    );
    mockTranslatableStringService = TestBed.inject(TranslatableStringService);
    mockTranslatableStringService.get.and.returnValue('');

    fixture = TestBed.createComponent(TestHostComponent);
    testHost = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(testHost).toBeTruthy();
  });
});
