import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-dashboard-iframe',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-iframe.component.html',
  styleUrls: ['./dashboard-iframe.component.css'],
})
export class DashboardIframeComponent implements OnChanges {
  private ALLOWED_HOSTNAMES = ['app.powerbi.com'];

  @Input()
  public url: string;

  public safeUrl: SafeResourceUrl;

  constructor(private domSanitizer: DomSanitizer) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (
      changes.url &&
      changes.url.currentValue !== '' &&
      changes.url.previousValue !== changes.url.currentValue
    ) {
      this.safeUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(
        this.sanitizeUrl(changes.url.currentValue),
      );
    }
  }

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
