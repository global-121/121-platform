import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';

import {
  provideTanStackQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental';

import { AppComponent } from '~/app.component';
import { getAppConfig } from '~/app.config';
import { Locale } from '~/utils/locale';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      ...getAppConfig(Locale.en),
      imports: [AppComponent, RouterModule.forRoot([])],
      providers: [
        provideHttpClient(),
        provideTanStackQuery(
          new QueryClient({
            defaultOptions: {
              queries: {
                staleTime: 1000 * 60 * 5, // 5 minutes
              },
            },
          }),
        ),
      ],
      teardown: { destroyAfterEach: false },
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
