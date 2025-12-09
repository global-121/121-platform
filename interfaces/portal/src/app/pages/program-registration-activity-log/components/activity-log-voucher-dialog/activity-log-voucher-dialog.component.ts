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

import { Fsps } from '@121-service/src/fsp-management/enums/fsp-name.enum';

import { ProgramApiService } from '~/domains/program/program.api.service';
import { RtlHelperService } from '~/services/rtl-helper.service';

@Component({
  selector: 'app-activity-log-voucher-dialog',
  imports: [ButtonModule, DialogModule, ScrollPanelModule, SkeletonModule],
  templateUrl: './activity-log-voucher-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityLogVoucherDialogComponent {
  readonly rtlHelper = inject(RtlHelperService);
  readonly programId = input.required<string>();
  readonly paymentId = input.required<number>();
  readonly paymentDate = input.required<string>();
  readonly referenceId = input.required<string>();
  readonly fsp = input.required<Fsps>();

  private readonly programApiService = inject(ProgramApiService);
  private readonly domSanitizer = inject(DomSanitizer);

  readonly voucherIframe =
    viewChild<ElementRef<HTMLIFrameElement>>('voucherIframe');

  readonly dialogVisible = model(false);

  readonly dialogHeader = computed(
    () => $localize`Voucher ${this.paymentId()} on ${this.paymentDate()}`,
  );

  private readonly voucherType = computed(() => {
    if (this.fsp() === Fsps.intersolveVoucherPaper) {
      return 'paper';
    }

    return 'whatsapp';
  });

  voucher = injectQuery(() => ({
    ...this.programApiService.getIntersolveVoucher({
      programId: this.programId,
      referenceId: this.referenceId(),
      paymentId: this.paymentId(),
      voucherType: this.voucherType(),
    })(),
    enabled: this.dialogVisible(),
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
      `voucher-program-${this.programId()}-payment-${this.paymentId().toString()}-voucher-${this.referenceId()}.png`,
  );

  printVoucher() {
    const contentWindow = this.voucherIframe()?.nativeElement.contentWindow;
    contentWindow?.focus(); // Required for IE
    contentWindow?.print();
  }
}
