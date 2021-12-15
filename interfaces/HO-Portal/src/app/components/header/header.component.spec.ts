import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from 'src/app/auth/auth.service';
import apiProgramsMock from 'src/app/mocks/api.programs.mock';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  let mockAuthService: jasmine.SpyObj<any>;
  let mockProgramsApi: jasmine.SpyObj<any>;

  const mockProgramId = 1;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HeaderComponent],
      imports: [TranslateModule.forRoot(), RouterTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                id: mockProgramId,
              },
            },
          },
        },
        provideMagicalMock(AuthService),
        provideMagicalMock(ProgramsServiceApiService),
        provideMagicalMock(TranslatableStringService),
      ],
    }).compileComponents();

    mockAuthService = TestBed.inject(AuthService);
    mockAuthService.hasUserRole.and.returnValue(true);

    mockProgramsApi = TestBed.inject(ProgramsServiceApiService);
    mockProgramsApi.getProgramById.and.returnValue(
      new Promise((r) => r(apiProgramsMock.programs[mockProgramId])),
    );

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', async () => {
    expect(component).toBeTruthy();
  });
});
