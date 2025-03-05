import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, Signal, signal } from '@angular/core';
import { computed } from '@angular/core';

export type LogicalPosition = 'end' | 'start';
export type PhysicalPosition = 'left' | 'right';
export type Direction = 'ltr' | 'rtl';

const LOGICAL_VALUE_TO_PHYSICAL_VALUE_MAP: Record<
  Direction,
  Record<LogicalPosition, PhysicalPosition>
> = {
  ltr: {
    start: 'left',
    end: 'right',
  },
  rtl: {
    start: 'right',
    end: 'left',
  },
};

const LTR_VALUE_TO_RTL_VALUE_MAP: Record<
  Direction,
  Record<PhysicalPosition, PhysicalPosition>
> = {
  ltr: {
    left: 'left',
    right: 'right',
  },
  rtl: {
    left: 'right',
    right: 'left',
  },
};

@Injectable({
  providedIn: 'root',
})
export class RtlHelperService {
  private readonly document = inject(DOCUMENT);
  readonly isRtl = signal(this.document.documentElement.dir === 'rtl');
  readonly direction = computed(() => (this.isRtl() ? 'rtl' : 'ltr'));

  constructor() {
    // Set up a MutationObserver to watch for changes to the dir attribute
    const observer = new MutationObserver(() => {
      this.isRtl.set(this.document.documentElement.dir === 'rtl');
    });

    observer.observe(this.document.documentElement, {
      attributes: true,
      attributeFilter: ['dir'],
    });

    // Clean up when service is destroyed
    effect((onCleanup) => {
      onCleanup(() => {
        observer.disconnect();
      });
    });
  }

  /**
   * Creates a computed signal that converts a logical property to a physical property in RTL mode
   * Ideally would be done in primeng, but this is a workaround for now due to https://github.com/orgs/primefaces/discussions/3649
   */
  createPosition(logicalValue: LogicalPosition): Signal<PhysicalPosition> {
    return computed(
      () => LOGICAL_VALUE_TO_PHYSICAL_VALUE_MAP[this.direction()][logicalValue],
    );
  }

  createRtlFriendlyChevronIcon(
    chevronDirection: PhysicalPosition,
  ): Signal<string> {
    return computed(
      () =>
        `pi pi-chevron-${
          LTR_VALUE_TO_RTL_VALUE_MAP[this.direction()][chevronDirection]
        }`,
    );
  }
}
