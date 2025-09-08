import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  model,
  output,
  Renderer2,
  viewChild,
} from '@angular/core';

import { AutoFocus } from 'primeng/autofocus';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

import { RtlHelperService } from '~/services/rtl-helper.service';
import {
  TrackingAction,
  TrackingCategory,
  TrackingService,
} from '~/services/tracking.service';

@Component({
  selector: 'app-query-table-global-search',
  imports: [
    IconFieldModule,
    InputIconModule,
    ButtonModule,
    InputTextModule,
    AutoFocus,
  ],
  templateUrl: './query-table-global-search.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryTableGlobalSearchComponent {
  private renderer = inject(Renderer2);
  readonly rtlHelper = inject(RtlHelperService);
  readonly trackingService = inject(TrackingService);

  readonly globalFilterValue = input<string | undefined>();
  readonly globalFilterVisible = model<boolean>(false);
  readonly filterChange = output<string | undefined>();

  readonly globalFilterContainer = viewChild.required<
    ElementRef<HTMLDivElement>
  >('globalFilterContainer');
  readonly globalFilterInput =
    viewChild<ElementRef<HTMLInputElement>>('globalFilterInput');

  constructor() {
    this.renderer.listen('window', 'click', (e: Event) => {
      const globalFilterValue = this.globalFilterValue();

      const isNoGlobalFilterApplied =
        globalFilterValue === undefined || globalFilterValue === '';

      const globalFilterContainer = this.globalFilterContainer();
      const hasCickedOutsideGlobalFilterContainer =
        e.target !== globalFilterContainer.nativeElement &&
        !globalFilterContainer.nativeElement.contains(e.target as Node);

      if (isNoGlobalFilterApplied && hasCickedOutsideGlobalFilterContainer) {
        this.globalFilterVisible.set(false);
      }
    });
  }

  clearFilterValue(): void {
    this.filterChange.emit(undefined);

    this.trackingService.trackEvent({
      category: TrackingCategory.manageTableSettings,
      action: TrackingAction.clickGlobalFilterClearButton,
    });
  }

  showGlobalFilterInput(): void {
    this.globalFilterVisible.set(true);

    this.trackingService.trackEvent({
      category: TrackingCategory.manageTableSettings,
      action: TrackingAction.clickGlobalFilterButton,
    });
  }
}
