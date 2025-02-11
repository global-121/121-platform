import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  model,
  SecurityContext,
  viewChild,
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
  imports: [ButtonModule, DialogModule, ScrollPanelModule, SkeletonModule],
  templateUrl: './activity-log-voucher-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityLogVoucherDialogComponent {
  readonly projectId = input.required<string>();
  readonly paymentId = input.required<number>();
  readonly totalTransfers = input.required<number>();
  readonly voucherReferenceId = input.required<string>();

  private readonly projectApiService = inject(ProjectApiService);
  private readonly domSanitizer = inject(DomSanitizer);

  readonly voucherIframe =
    viewChild<ElementRef<HTMLIFrameElement>>('voucherIframe');

  readonly dialogVisible = model(false);

  readonly dialogHeader = computed(
    () =>
      $localize`Voucher - payment ${this.paymentId()} of ${this.totalTransfers()}`,
  );

  voucher = injectQuery(() => ({
    ...this.projectApiService.getIntersolveVoucher({
      projectId: this.projectId,
      voucherReferenceId: this.voucherReferenceId(),
      paymentId: this.paymentId(),
    })(),
    enabled: !!this.dialogVisible(),
  }));

  readonly sanitizedVoucherUrl = computed(() => {
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

  readonly voucherFileName = computed(
    () =>
      `voucher-project-${this.projectId().toString()}-payment-${this.paymentId().toString()}-voucher-${this.voucherReferenceId()}.png`,
  );

  printVoucher() {
    const contentWindow = this.voucherIframe()?.nativeElement.contentWindow;
    contentWindow?.focus(); // Required for IE
    contentWindow?.print();
  }
}
