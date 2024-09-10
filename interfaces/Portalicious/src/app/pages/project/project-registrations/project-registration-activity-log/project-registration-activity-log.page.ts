import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TabMenuModule } from 'primeng/tabmenu';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';

@Component({
  selector: 'app-project-registration-activity-log',
  standalone: true,
  imports: [
    PageLayoutComponent,
    CardModule,
    TabMenuModule,
    CommonModule,
    FormsModule,
    SelectButtonModule,
  ],
  templateUrl: './project-registration-activity-log.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectRegistrationActivityLogPageComponent {
  // this is injected by the router
  projectId = input.required<number>();
  registrationId = input.required<number>();

  stateOptions = [
    { label: 'Show all', value: 'all' },
    { label: 'Transfers', value: 'transfers' },
    { label: 'Messages', value: 'messages' },
    { label: 'Notes', value: 'notes' },
    { label: 'Status updates', value: 'status-updates' },
    { label: 'Data changes', value: 'data-changes' },
  ];
  value = 'all';
}
