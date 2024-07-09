import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { AppComponent } from '~/app.component';
import { appConfig } from '~/app.config';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      ...appConfig,
      imports: [AppComponent, RouterModule.forRoot([])],
      teardown: { destroyAfterEach: false },
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain(
      ' 121 Portal | NLRC',
    );
  });
});
