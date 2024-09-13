import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CardModule } from 'primeng/card';

import { FooterComponent } from '~/components/page-layout/components/footer/footer.component';
import { HeaderComponent } from '~/components/page-layout/components/header/header.component';
import { ProjectMenuComponent } from '~/components/page-layout/components/project-menu/project-menu.component';
import { RegistrationHeaderComponent } from '~/components/page-layout/components/registration-header/registration-header.component';
import { RegistrationMenuComponent } from '~/components/page-layout/components/registration-menu/registration-menu.component';

@Component({
  selector: 'app-page-layout',
  standalone: true,
  imports: [
    HeaderComponent,
    ProjectMenuComponent,
    FooterComponent,
    RegistrationHeaderComponent,
    RegistrationMenuComponent,
    CardModule,
  ],
  templateUrl: './page-layout.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageLayoutComponent {
  pageTitle = input<string>();
  projectId = input<number>();
  registrationId = input<number>();
}
