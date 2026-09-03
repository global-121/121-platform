import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
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
import { MessagingService } from '~/services/messaging.service';
import { InfoTooltipTrackingName } from '~/services/tracking/tracking.enums';

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
  styles: ``,
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

  updateActiveMention() {
    const { value, selectionStart } = this.textarea().nativeElement;
    const activeMention = findActiveMention({
      text: value,
      caretPosition: selectionStart,
    });

    this.activeMention.set(activeMention);
    this.highlightedOptionIndex.set(0);
  }

  closeMentionOptions() {
    this.activeMention.set(undefined);
  }

  onTextareaKeydown(event: KeyboardEvent) {
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
        return;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightedOptionIndex.update(
          (index) => (index - 1 + options.length) % options.length,
        );
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

  selectPlaceholder({ name }: { name: string }) {
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
