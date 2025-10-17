import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { MentionModule } from 'angular-mentions';
import { TextareaModule } from 'primeng/textarea';

import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { InfoTooltipComponent } from '~/components/info-tooltip/info-tooltip.component';
import { ManualLinkComponent } from '~/components/manual-link/manual-link.component';
import { AttributeWithTranslatedLabel } from '~/domains/project/project.model';
import { MessagingService } from '~/services/messaging.service';

@Component({
  selector: 'app-custom-message-control',
  imports: [
    FormsModule,
    InfoTooltipComponent,
    TextareaModule,
    NgClass,
    FormErrorComponent,
    MentionModule,
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
  readonly projectId = input.required<string>();
  readonly error = input<string>();

  private messagingService = inject(MessagingService);

  readonly customMessageInternalModel = model<string>('');
  readonly customMessageDisabled = model<boolean>(false);

  placeholders = injectQuery(
    this.messagingService.getMessagePlaceholders(this.projectId),
  );
  readonly messagePlaceholders = computed<{ translatedLabel: string }[]>(() => {
    if (this.placeholders.isSuccess()) {
      return this.placeholders.data();
    }

    if (this.placeholders.isError()) {
      return [
        {
          translatedLabel: $localize`Failed to load options`,
        },
      ];
    }

    return [
      {
        translatedLabel: $localize`:@@generic-loading:Loading...`,
      },
    ];
  });

  readonly mentionConfig = computed(() => ({
    items: this.messagePlaceholders(),
    triggerChar: '@',
    labelKey: 'translatedLabel',
    mentionSelect: (item: AttributeWithTranslatedLabel) => `{{${item.name}}} `,
  }));

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
