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

  customMessageInternalModel = model<string>('');
  customMessageDisabled = model<boolean>(false);

  writeValue(value: string | undefined) {
    this.customMessageInternalModel.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void) {
    this.customMessageInternalModel.subscribe(fn);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  registerOnTouched() {}

  setDisabledState(setDisabledState: boolean) {
    this.customMessageDisabled.set(setDisabledState);
  }

  placeholders = injectQuery(
    this.messagingService.getMessagePlaceholders(this.projectId),
  );

  messagePlaceholders = computed<{ label: string }[]>(() => {
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
  });

  mentionConfig = computed(() => ({
    items: this.messagePlaceholders(),
    triggerChar: '@',
    labelKey: 'label',
    mentionSelect: (item: AttributeWithTranslatedLabel) => `{{${item.name}}} `,
  }));
}
