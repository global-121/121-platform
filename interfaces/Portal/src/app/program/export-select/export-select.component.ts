import { AfterViewChecked, Component, Input } from '@angular/core';
import { ExportType } from '../../models/export-type.model';
import { ProgramPhase } from '../../models/program.model';

@Component({
  selector: 'app-export-select',
  templateUrl: './export-select.component.html',
  styleUrls: ['./export-select.component.css'],
})
export class ExportSelectComponent implements AfterViewChecked {
  @Input()
  public programId: number;

  @Input()
  public thisPhase: ProgramPhase;

  @Input()
  public showValidation: boolean;

  public isPopoverOpen = false;

  private optionsPerPhase = {
    [ProgramPhase.registrationValidation]: [
      ExportType.filteredTable,
      ExportType.allPeopleAffected,
      ExportType.duplicates,
      ExportType.selectedForValidation,
      ExportType.paDataChanges,
    ],
    [ProgramPhase.inclusion]: [ExportType.filteredTable],
    [ProgramPhase.payment]: [ExportType.filteredTable],
  };

  public options = [];

  constructor() {}

  ngAfterViewChecked(): void {
    if (!this.thisPhase) {
      return;
    }

    this.options = this.optionsPerPhase[this.thisPhase];

    if (!this.showValidation) {
      this.options = this.options.filter(
        (o) => o !== ExportType.selectedForValidation,
      );
    }
  }

  public togglePopover() {
    this.isPopoverOpen = !this.isPopoverOpen;
  }
}
