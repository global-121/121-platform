import { Component, Input } from '@angular/core';
import RegistrationStatus from '../../enums/registration-status.enum';
import { ProgramPhase } from '../../models/program.model';
import { FilterService } from '../../services/filter.service';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';

@Component({
  selector: 'app-status-table-filter',
  templateUrl: './status-table-filter.component.html',
  styleUrls: ['./status-table-filter.component.scss'],
})
export class StatusTableFilterComponent {
  @Input()
  public programId: number;

  @Input()
  public thisPhase: ProgramPhase;

  public isStatusPopoverOpen = false;

  public totalCount = 0;

  public options: {
    [key: string]: {
      statusCount: number;
      selected: boolean;
    };
  };

  public selectAll: boolean;

  public paStatusDefaultsPerPhase = {
    [ProgramPhase.registrationValidation]: [
      RegistrationStatus.imported,
      RegistrationStatus.invited,
      RegistrationStatus.startedRegistration,
      RegistrationStatus.selectedForValidation,
      RegistrationStatus.registered,
      RegistrationStatus.noLongerEligible,
      RegistrationStatus.registeredWhileNoLongerEligible,
    ],
    [ProgramPhase.inclusion]: [
      RegistrationStatus.validated,
      RegistrationStatus.registered,
      RegistrationStatus.selectedForValidation,
      RegistrationStatus.rejected,
      RegistrationStatus.inclusionEnded,
      RegistrationStatus.paused,
    ],
    [ProgramPhase.payment]: [
      RegistrationStatus.included,
      RegistrationStatus.completed,
    ],
  };

  constructor(
    private programsService: ProgramsServiceApiService,
    private filterService: FilterService,
  ) {}

  async initComponent() {
    const activeStatuses: {
      status: RegistrationStatus;
      statusCount: number;
    }[] = await this.programsService.getRegistrationStatusCount(this.programId);

    if (!activeStatuses) {
      return;
    }

    this.totalCount = activeStatuses.reduce((total, option) => {
      return (total = total + Number(option.statusCount));
    }, 0);

    this.options = activeStatuses.reduce((obj, s) => {
      const selected = this.paStatusDefaultsPerPhase[this.thisPhase]?.includes(
        s.status,
      );

      return (obj = {
        ...obj,
        [s.status]: {
          statusCount: s.statusCount,
          selected,
        },
      });
    }, {});

    this.applyFilter();
  }

  public onSelectAll(e: Event) {
    const checkbox = e.target as HTMLInputElement;
    const isChecked = checkbox.checked;
    this.selectAll = isChecked;
    for (const key of this.getOptionsArray()) {
      this.options[key].selected = isChecked;
    }
  }

  public getOptionsArray = (): RegistrationStatus[] => {
    if (!this.options) {
      return [];
    }

    return Object.keys(this.options).map(
      (option) => RegistrationStatus[option],
    );
  };

  public onOptionClick(option: RegistrationStatus) {
    this.options[option].selected = !this.options[option].selected;
    if (Object.values(this.options).some((o) => !o.selected)) {
      this.selectAll = false;
      return;
    }
    this.selectAll = true;
  }

  private getSelectedOptions(): RegistrationStatus[] {
    return this.getOptionsArray().filter(
      (option) => this.options[option].selected,
    );
  }

  public applyFilter() {
    this.filterService.updateStatusFilter(this.getSelectedOptions());
    this.isStatusPopoverOpen = false;
  }

  public toggleStatusPopover() {
    this.isStatusPopoverOpen = !this.isStatusPopoverOpen;
  }

  public cancelClick() {
    this.isStatusPopoverOpen = false;
  }
}
