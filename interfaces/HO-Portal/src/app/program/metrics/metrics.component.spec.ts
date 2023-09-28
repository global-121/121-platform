import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';
import { TranslatableStringService } from '../../services/translatable-string.service';
import { SharedModule } from '../../shared/shared.module';
import { MetricsComponent } from './metrics.component';

describe('MetricsComponent', () => {
  let component: MetricsComponent;
  let fixture: ComponentFixture<MetricsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MetricsComponent],
      imports: [
        TranslateModule.forRoot(),
        SharedModule,
        HttpClientTestingModule,
      ],
      providers: [TranslatableStringService, ProgramsServiceApiService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MetricsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
