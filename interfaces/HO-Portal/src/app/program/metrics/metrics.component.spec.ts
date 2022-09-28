import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { Program } from 'src/app/models/program.model';
import { TranslatableStringService } from 'src/app/services/translatable-string.service';
import { MetricsComponent } from './metrics.component';

@Component({
  template: `<app-metrics [program]="program"></app-metrics>`,
})
class TestHostComponent {
  program: Program | any;
}

describe('MetricsComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let testHost: TestHostComponent;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [MetricsComponent, TestHostComponent],
        imports: [TranslateModule.forRoot()],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        providers: [provideMagicalMock(TranslatableStringService)],
      }).compileComponents();
    }),
  );

  let mockTranslatableStringService: jasmine.SpyObj<any>;

  beforeEach(() => {
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
