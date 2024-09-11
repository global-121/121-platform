import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TabMenuModule } from 'primeng/tabmenu';

import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';

@Component({
  selector: 'app-project-registration-debit-cards',
  standalone: true,
  imports: [
    PageLayoutComponent,
    CardModule,
    TabMenuModule,
    CommonModule,
    FormsModule,
    SelectButtonModule,
  ],
  templateUrl: './project-registration-debit-cards.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectRegistrationDebitCardsPageComponent {
  // this is injected by the router
  projectId = input.required<number>();
  registrationId = input.required<number>();
}
