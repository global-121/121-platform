import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { AppComponent } from '~/app.component';
import { getAppConfig } from '~/app.config';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      ...getAppConfig,
      imports: [AppComponent, RouterModule.forRoot([])],
      teardown: { destroyAfterEach: false },
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
