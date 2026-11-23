import { NgClass } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

import { TextareaModule } from '@openng/optimus-ui/textarea';
import { injectQuery } from '@tanstack/angular-query-experimental';

import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { InfoTooltipComponent } from '~/components/info-tooltip/info-tooltip.component';
import { ManualLinkComponent } from '~/components/manual-link/manual-link.component';
import {
  ActiveMention,
  filterMentionItems,
  findActiveMention,
  formatPlaceholder,
} from '~/pages/program-registrations/components/custom-message-control/custom-message-mention.helper';
import { getTextareaCaretPosition } from '~/pages/program-registrations/components/custom-message-control/textarea-caret-position.helper';
import { MessagingService } from '~/services/messaging.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { InfoTooltipTrackingName } from '~/services/tracking/tracking.enums';

const CARET_MOVEMENT_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'PageUp',
  'PageDown',
]);

@Component({
  selector: 'app-custom-message-control',
  imports: [
    FormsModule,
    InfoTooltipComponent,
    TextareaModule,
    NgClass,
    FormErrorComponent,
    ManualLinkComponent,
  ],
  templateUrl: './custom-message-control.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: CustomMessageControlComponent,
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomMessageControlComponent implements ControlValueAccessor {
  readonly programId = input.required<string>();
  readonly error = input<string>();

  private messagingService = inject(MessagingService);
  private rtlHelper = inject(RtlHelperService);
  private injector = inject(Injector);

  readonly customMessageDisabled = model(false);
  readonly customMessageInternalModel = model('');

  placeholders = injectQuery(
    this.messagingService.getMessagePlaceholders(this.programId),
  );

  readonly messagePlaceholders = computed<{ label: string; name?: string }[]>(
    () => {
      if (this.placeholders.isSuccess()) {
        return this.placeholders.data();
      }

      if (this.placeholders.isError()) {
        return [
          {
            label: $localize`Failed to load options`,
          },
        ];
      }

      return [
        {
          label: $localize`:@@generic-loading:Loading...`,
        },
      ];
    },
  );

  readonly textarea =
    viewChild.required<ElementRef<HTMLTextAreaElement>>('messageTextarea');

  private readonly activeMention = signal<ActiveMention | undefined>(undefined);
  readonly highlightedOptionIndex = signal(0);
  readonly mentionMenuPosition = signal<{
    blockStart: number;
    inlineStart?: number;
    inlineEnd?: number;
  }>({ blockStart: 0, inlineStart: 0 });

  readonly mentionOptions = computed(() => {
    const activeMention = this.activeMention();
    if (!activeMention) {
      return [];
    }

    return filterMentionItems({
      items: this.messagePlaceholders(),
      query: activeMention.query,
    });
  });

  readonly customMessageInfoTooltipData = {
    message: $localize`Note that if you go over 160 characters the Person affected may receive the message as multiple texts, if they have a feature-(non-smart-)phone.`,
    trackingName: InfoTooltipTrackingName.customMessageCharacterLimit,
  };

  readonly mentionListboxId = 'customMessageMentionListbox';

  getMentionOptionId({ index }: { index: number }) {
    return `${this.mentionListboxId}-option-${index.toString()}`;
  }

  private findMentionAtCaret(): ActiveMention | undefined {
    const { value, selectionStart, selectionEnd } =
      this.textarea().nativeElement;
    if (selectionStart !== selectionEnd) {
      return;
    }
    return findActiveMention({ text: value, caretPosition: selectionStart });
  }

  private isActiveMentionCurrent() {
    const current = this.findMentionAtCaret();
    const stored = this.activeMention();
    return (
      !!current &&
      !!stored &&
      current.startIndex === stored.startIndex &&
      current.query === stored.query
    );
  }

  updateActiveMention() {
    const activeMention = this.findMentionAtCaret();

    this.activeMention.set(activeMention);
    this.highlightedOptionIndex.set(0);

    if (activeMention) {
      this.updateMentionMenuPosition({ startIndex: activeMention.startIndex });
    }
  }

  private updateMentionMenuPosition({ startIndex }: { startIndex: number }) {
    const textarea = this.textarea().nativeElement;
    const { left, top, lineHeight } = getTextareaCaretPosition({
      textarea,
      caretPosition: startIndex,
    });
    const containerWidth = textarea.offsetLeft + textarea.offsetWidth;
    const inlineOffset = this.rtlHelper.isRtl() ? containerWidth - left : left;
    const isInStartHalf = inlineOffset < containerWidth / 2;
    const blockStart = top + lineHeight;

    // Anchor to the opposite edge in the second half, so the menu doesn't overflow
    this.mentionMenuPosition.set(
      isInStartHalf
        ? { blockStart, inlineStart: inlineOffset }
        : { blockStart, inlineEnd: containerWidth - inlineOffset },
    );
  }

  closeMentionOptions() {
    this.activeMention.set(undefined);
  }

  onTextareaKeyup(event: KeyboardEvent) {
    if (CARET_MOVEMENT_KEYS.has(event.key)) {
      this.updateActiveMention();
    }
  }

  onTextareaKeydown(event: KeyboardEvent) {
    if (this.activeMention() && !this.isActiveMentionCurrent()) {
      this.updateActiveMention();
    }

    const options = this.mentionOptions();
    if (options.length === 0) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedOptionIndex.update(
          (index) => (index + 1) % options.length,
        );
        this.scrollHighlightedOptionIntoView();
        return;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightedOptionIndex.update(
          (index) => (index - 1 + options.length) % options.length,
        );
        this.scrollHighlightedOptionIntoView();
        return;
      case 'Enter':
      case 'Tab': {
        const highlightedOption = options[this.highlightedOptionIndex()];
        if (!highlightedOption.name) {
          return;
        }
        event.preventDefault();
        this.selectPlaceholder({ name: highlightedOption.name });
        return;
      }
      case 'Escape':
        event.preventDefault();
        this.closeMentionOptions();
        return;
    }
  }

  private scrollHighlightedOptionIntoView() {
    const optionId = this.getMentionOptionId({
      index: this.highlightedOptionIndex(),
    });
    // Wait for the highlight to render before scrolling
    afterNextRender(
      () => {
        document.getElementById(optionId)?.scrollIntoView({ block: 'nearest' });
      },
      { injector: this.injector },
    );
  }

  selectPlaceholder({ name }: { name: string }) {
    if (!this.isActiveMentionCurrent()) {
      this.updateActiveMention();
      return;
    }
    const activeMention = this.activeMention();
    if (!activeMention) {
      return;
    }

    const textarea = this.textarea().nativeElement;
    textarea.setRangeText(
      formatPlaceholder({ name }),
      activeMention.startIndex,
      textarea.selectionStart,
      'end',
    );
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.focus();
    this.closeMentionOptions();
  }

  writeValue(value: string | undefined) {
    this.customMessageInternalModel.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void) {
    this.customMessageInternalModel.subscribe(fn);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function -- Required by ControlValueAccessor, needs to be implemented but can be empty
  registerOnTouched() {}

  setDisabledState(setDisabledState: boolean) {
    this.customMessageDisabled.set(setDisabledState);
  }
}
