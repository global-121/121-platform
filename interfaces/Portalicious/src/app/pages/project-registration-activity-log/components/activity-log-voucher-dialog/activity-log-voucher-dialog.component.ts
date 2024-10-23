import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  model,
  SecurityContext,
  ViewChild,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { SkeletonModule } from 'primeng/skeleton';

import { ProjectApiService } from '~/domains/project/project.api.service';

@Component({
  selector: 'app-activity-log-voucher-dialog',
  standalone: true,
  imports: [ButtonModule, DialogModule, ScrollPanelModule, SkeletonModule],
  templateUrl: './activity-log-voucher-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityLogVoucherDialogComponent {
  projectId = input.required<number>();
  paymentId = input.required<number>();
  totalTransfers = input.required<number>();
  voucherReferenceId = input.required<string>();

  private readonly projectApiService = inject(ProjectApiService);
  private readonly domSanitizer = inject(DomSanitizer);

  @ViewChild('voucherIframe') voucherIframe: ElementRef<HTMLIFrameElement>;

  dialogVisible = model(false);

  dialogHeader = computed(() => {
    return $localize`Voucher - payment ${this.paymentId()} of ${this.totalTransfers()}`;
  });

  voucher = injectQuery(() => ({
    ...this.projectApiService.getIntersolveVoucher({
      projectId: this.projectId,
      voucherReferenceId: this.voucherReferenceId(),
      paymentId: this.paymentId(),
    })(),
    enabled: !!this.dialogVisible(),
  }));

  sanitizedVoucherUrl = computed(() => {
    const voucherBlob = this.voucher.data();

    if (!voucherBlob) {
      return;
    }

    const voucherUrl = window.URL.createObjectURL(voucherBlob);
    const sanitizedUrl = this.domSanitizer.sanitize(
      SecurityContext.URL,
      voucherUrl,
    );

    if (!sanitizedUrl) {
      return;
    }

    return this.domSanitizer.bypassSecurityTrustResourceUrl(sanitizedUrl);
  });

  voucherFileName = computed(
    () =>
      `voucher-project-${this.projectId().toString()}-payment-${this.paymentId().toString()}-voucher-${this.voucherReferenceId()}.png`,
  );

  printVoucher() {
    const contentWindow = this.voucherIframe.nativeElement.contentWindow;
    contentWindow?.focus(); // Required for IE
    contentWindow?.print();
  }
}
