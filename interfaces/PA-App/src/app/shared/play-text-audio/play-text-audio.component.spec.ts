import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { MockLoggingService } from 'src/app/mocks/logging.service.mock';
import { LoggingService } from 'src/app/services/logging.service';
import { PlayTextAudioComponent } from './play-text-audio.component';

describe('PlayTextAudioComponent', () => {
  let component: PlayTextAudioComponent;
  let fixture: ComponentFixture<PlayTextAudioComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [PlayTextAudioComponent],
        imports: [TranslateModule.forRoot()],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        providers: [
          {
            provide: LoggingService,
            useValue: MockLoggingService,
          },
        ],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayTextAudioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
