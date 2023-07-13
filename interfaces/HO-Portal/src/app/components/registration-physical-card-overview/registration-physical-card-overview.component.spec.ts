import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { RegistrationPhysicalCardOverviewComponent } from './registration-physical-card-overview.component';

describe('RegistrationPhysicalCardOverviewComponent', () => {
  let component: RegistrationPhysicalCardOverviewComponent;
  let fixture: ComponentFixture<RegistrationPhysicalCardOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(
      RegistrationPhysicalCardOverviewComponent,
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
