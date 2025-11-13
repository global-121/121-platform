import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardIframeComponent } from '~/pages/program-monitoring-powerbi/components/monitoring-iframe/monitoring-iframe.component';

@Component({
  selector: 'app-monitoring-iframe-test-host',
  imports: [DashboardIframeComponent],
  template: '<app-monitoring-iframe [url]="testUrl"></app-monitoring-iframe>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestHostComponent {
  public testUrl: string;
}

const safeFallbackUrl = 'about:blank';

describe('DashboardIframeComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let testHost: TestHostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashboardIframeComponent, TestHostComponent],
    });

    fixture = TestBed.createComponent(TestHostComponent);
    testHost = fixture.componentInstance;
  });

  it('should create', () => {
    expect(testHost).toBeTruthy();
  });

  it('should allow Power BI dasboard', () => {
    // Arrange
    const testUrl = 'https://app.powerbi.com/view?id=example123';

    // Act
    testHost.testUrl = testUrl;
    fixture.detectChanges();

    // Assert
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- actually safe
    expect(fixture.nativeElement.querySelector('iframe').src).toBe(testUrl);
  });

  it('should NOT allow malicous URLs', () => {
    // Arrange
    const testUrls = [
      'http://app.powerbi.com/view?id=example123insecure',
      'https://evil.example.com/phishing/attack.exe',
      'javascript:window.alert("XSS")',
    ];

    // Act
    testUrls.forEach((url) => {
      testHost.testUrl = url;
      fixture.detectChanges();

      // Assert
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- actually safe
      expect(fixture.nativeElement.querySelector('iframe').src).toBe(
        safeFallbackUrl,
      );
    });
  });
});
