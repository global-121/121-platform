import { Component, Input } from '@angular/core';
import { ExportType } from '../../models/export-type.model';
import { ProgramPhase } from '../../models/program.model';

@Component({
  selector: 'app-export-select',
  templateUrl: './export-select.component.html',
  styleUrls: ['./export-select.component.css'],
})
export class ExportSelectComponent {
  @Input()
  public programId: number;

  @Input()
  public thisPhase: ProgramPhase;

  public isPopoverOpen = false;

  public options = [
    ExportType.filteredTable,
    ExportType.allPeopleAffected,
    ExportType.duplicates,
    ExportType.selectedForValidation,
    ExportType.paDataChanges,
  ];

  constructor() {}

  public togglePopover() {
    this.isPopoverOpen = !this.isPopoverOpen;
  }
}
