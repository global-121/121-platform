import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ButtonModule } from 'primeng/button';

import { CardGridComponent } from '~/components/card-grid/card-grid.component';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { CreateProgramDialogComponent } from '~/pages/programs-overview/components/create-program-dialog/create-program-dialog.component';
import { ProgramSummaryCardComponent } from '~/pages/programs-overview/components/program-summary-card/program-summary-card.component';
import { AuthService } from '~/services/auth.service';
import { RtlHelperService } from '~/services/rtl-helper.service';

@Component({
  selector: 'app-programs-overview',
  imports: [
    ButtonModule,
    PageLayoutComponent,
    ProgramSummaryCardComponent,
    CreateProgramDialogComponent,
    CardGridComponent,
  ],
  templateUrl: './programs-overview.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramsOverviewPageComponent {
  readonly rtlHelper = inject(RtlHelperService);
  private authService = inject(AuthService);

  public canCreatePrograms = this.authService.isAdmin;

  public assignedPrograms = this.authService.getAssignedProgramIds();
}
