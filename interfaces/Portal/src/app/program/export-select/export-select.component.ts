import { AfterViewChecked, Component, Input, ViewChild } from '@angular/core';
import { IonPopover } from '@ionic/angular';
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

  @ViewChild(IonPopover) popover: IonPopover;

  public options = [
    ExportType.filteredTable,
    ExportType.allPeopleAffected,
    ExportType.duplicates,
    ExportType.paDataChanges,
  ];

  constructor() {}

  ngAfterViewChecked(): void {
    if (!this.thisPhase) {
      return;
    }
  }

  public togglePopover() {
    this.isPopoverOpen = !this.isPopoverOpen;
  }

  public closePopover() {
    if (this.popover) {
      this.popover.dismiss();
    }
  }
}
