import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FooterComponent } from '~/components/page-layout/components/footer/footer.component';
import { HeaderComponent } from '~/components/page-layout/components/header/header.component';
import { ProjectHeaderComponent } from '~/components/page-layout/components/project-header/project-header.component';
import { RegistrationHeaderComponent } from '~/components/page-layout/components/registration-header/registration-header.component';

@Component({
  selector: 'app-page-layout',
  standalone: true,
  imports: [
    HeaderComponent,
    ProjectHeaderComponent,
    FooterComponent,
    RegistrationHeaderComponent,
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
