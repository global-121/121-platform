import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { Platform } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { AppComponent } from './app.component';
import { LoggingService } from './services/logging.service';

describe('AppComponent', () => {
  let platformReadySpy, platformSpy;

  beforeEach(
    waitForAsync(() => {
      platformReadySpy = Promise.resolve();
      platformSpy = jasmine.createSpyObj('Platform', {
        ready: platformReadySpy,
      });

      TestBed.configureTestingModule({
        declarations: [AppComponent],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        providers: [
          LoggingService,
          { provide: Platform, useValue: platformSpy },
        ],
        imports: [TranslateModule.forRoot()],
      }).compileComponents();
    }),
  );

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should initialize the app', async () => {
    TestBed.createComponent(AppComponent);
    expect(platformSpy.ready).toHaveBeenCalled();
    await platformReadySpy;
  });

  // TODO: add more tests!
});
