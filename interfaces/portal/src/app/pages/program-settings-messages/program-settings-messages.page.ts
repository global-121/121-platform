import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';

import { PageLayoutProgramSettingsComponent } from '~/components/page-layout-program-settings/page-layout-program-settings.component';
import { NotificationApiService } from '~/domains/notification/notification.api.service';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { MessageTemplateCardComponent } from '~/pages/program-settings-messages/components/message-template-card/message-template-card.component';

@Component({
  selector: 'app-program-settings-messages',
  imports: [
    PageLayoutProgramSettingsComponent,
    CardModule,
    SkeletonModule,
    MessageTemplateCardComponent,
  ],
  templateUrl: './program-settings-messages.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramSettingsMessagesPageComponent {
  readonly programId = input.required<string>();

  private readonly notificationApiService = inject(NotificationApiService);
  private readonly programApiService = inject(ProgramApiService);

  readonly messageTemplates = injectQuery(
    this.notificationApiService.getAllMessageTemplates(this.programId),
  );

  readonly program = injectQuery(
    this.programApiService.getProgram(this.programId),
  );

  readonly programLanguages = computed(
    () => this.program.data()?.languages ?? [],
  );

  readonly templatesByType = computed(() => {
    const templates = this.messageTemplates.data() ?? [];
    const grouped = new Map<string, (typeof templates)[number][]>();

    for (const template of templates) {
      const group = grouped.get(template.type) ?? [];
      group.push(template);
      grouped.set(template.type, group);
    }

    return grouped;
  });
}
