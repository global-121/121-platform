import {
  computed,
  DOCUMENT,
  effect,
  inject,
  Injectable,
  Signal,
  signal,
} from '@angular/core';

type LogicalPosition = 'end' | 'start';
type PhysicalPosition = 'left' | 'right';
type Direction = 'ltr' | 'rtl';
type ReadingDirection = 'backward' | 'forward';

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

const READING_DIRECTION_VALUE_TO_PHYSICAL_VALUE_MAP: Record<
  Direction,
  Record<ReadingDirection, PhysicalPosition>
> = {
  ltr: {
    backward: 'left',
    forward: 'right',
  },
  rtl: {
    backward: 'right',
    forward: 'left',
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
    chevronDirection: ReadingDirection,
  ): Signal<string> {
    return computed(
      () =>
        `pi pi-chevron-${
          READING_DIRECTION_VALUE_TO_PHYSICAL_VALUE_MAP[this.direction()][
            chevronDirection
          ]
        }`,
    );
  }
}
