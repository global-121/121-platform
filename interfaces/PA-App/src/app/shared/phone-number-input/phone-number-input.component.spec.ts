import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PhoneNumberInputComponent } from './phone-number-input.component';

describe('PhoneNumberInputComponent', () => {
  let component: PhoneNumberInputComponent;
  let fixture: ComponentFixture<PhoneNumberInputComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [PhoneNumberInputComponent],
        imports: [HttpClientTestingModule],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        providers: [
          {
            provide: ProgramsServiceApiService,
          },
        ],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(PhoneNumberInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
