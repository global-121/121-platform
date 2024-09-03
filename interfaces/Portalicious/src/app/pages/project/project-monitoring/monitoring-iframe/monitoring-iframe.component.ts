import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-monitoring-iframe',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './monitoring-iframe.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardIframeComponent {
  private ALLOWED_HOSTNAMES = ['app.powerbi.com'];
  private domSanitizer = inject(DomSanitizer);

  url = input.required<string>();

  safeUrl = computed(() =>
    this.domSanitizer.bypassSecurityTrustResourceUrl(
      this.sanitizeUrl(this.url()),
    ),
  );

  private sanitizeUrl(url: string): string {
    const safeFallbackUrl = 'about:blank';
    const currentOrigin = window.location.origin;

    let urlObject: URL;

    try {
      urlObject = new URL(url);
    } catch {
      return safeFallbackUrl;
    }

    if (
      urlObject.protocol === 'https:' &&
      (urlObject.hostname === currentOrigin ||
        this.ALLOWED_HOSTNAMES.includes(urlObject.hostname))
    ) {
      return url;
    } else {
      return safeFallbackUrl;
    }
  }
}
