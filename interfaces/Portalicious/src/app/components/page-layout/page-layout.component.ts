import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { FooterComponent } from '~/components/page-layout/components/footer/footer.component';
import { HeaderComponent } from '~/components/page-layout/components/header/header.component';
import { ProgramHeaderComponent } from '~/components/page-layout/components/project-header/project-header.component';

@Component({
  selector: 'app-page-layout',
  standalone: true,
  imports: [HeaderComponent, ProgramHeaderComponent, FooterComponent],
  templateUrl: './page-layout.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageLayoutComponent {
  programId = input<string>();
  programTitle = computed(() => {
    // XXX: fetch the right title based on program id
    switch (this.programId()) {
      case '1':
        return 'NLRC';
      case '2':
        return 'OCW';
      default:
        return undefined;
    }
  });
}
