import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  model,
  output,
  Renderer2,
  ViewChild,
} from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-query-table-global-search',
  standalone: true,
  imports: [IconFieldModule, InputIconModule, ButtonModule, InputTextModule],
  templateUrl: './query-table-global-search.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryTableGlobalSearchComponent {
  globalFilterValue = input<string | undefined>();
  globalFilterVisible = model<boolean>(false);
  readonly filterChange = output<string | undefined>();

  @ViewChild('globalFilterContainer')
  globalFilterContainer: ElementRef<HTMLDivElement>;
  @ViewChild('globalFilterInput')
  globalFilterInput: ElementRef<HTMLInputElement>;

  constructor(private renderer: Renderer2) {
    this.renderer.listen('window', 'click', (e: Event) => {
      const globalFilterValue = this.globalFilterValue();

      const isNoGlobalFilterApplied =
        globalFilterValue === undefined || globalFilterValue === '';

      const hasCickedOutsideGlobalFilterContainer =
        e.target !== this.globalFilterContainer.nativeElement &&
        !this.globalFilterContainer.nativeElement.contains(e.target as Node);

      if (isNoGlobalFilterApplied && hasCickedOutsideGlobalFilterContainer) {
        this.globalFilterVisible.set(false);
      }
    });
  }
}
