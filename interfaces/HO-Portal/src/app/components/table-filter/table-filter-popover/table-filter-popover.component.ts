import { Component, Input, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import {
  TableFilterMultipleChoiceOutput,
  TableFilterMultipleChoiceProps,
  TableFilterMultipleChoiceState,
  TableFilterType,
} from 'src/app/models/table-filter.model';

@Component({
  selector: 'app-table-filter-popover',
  templateUrl: './table-filter-popover.component.html',
  styleUrls: ['./table-filter-popover.component.scss'],
})
export class TableFilterPopoverComponent implements OnInit {
  @Input()
  public type: string;

  @Input()
  public filterProps: TableFilterMultipleChoiceProps;

  public state: { [filterType: string]: TableFilterMultipleChoiceState };

  public selectAll = false;

  public tableFilterType = TableFilterType;

  private dataToReturn: {
    [TableFilterType.multipleChoice]: TableFilterMultipleChoiceOutput;
  };

  constructor(private popoverController: PopoverController) {}

  ngOnInit() {
    this.state = {
      [this.tableFilterType.multipleChoice]: this.getMultipleChoiceState(),
    };

    this.dataToReturn = {
      [this.tableFilterType.multipleChoice]: this.filterProps.currentSelection,
    };

    if (
      this.filterProps.currentSelection.length ===
      this.filterProps.allOptions.length
    ) {
      this.selectAll = true;
    }
  }

  private getMultipleChoiceState(): TableFilterMultipleChoiceState {
    return this.filterProps.allOptions.reduce(
      (optionsObject, currentOption) => {
        return (optionsObject = {
          ...optionsObject,
          [currentOption.name]: this.filterProps.currentSelection.includes(
            currentOption.name,
          ),
        });
      },
      {},
    );
  }

  public applyFilter() {
    this.dataToReturn[this.tableFilterType.multipleChoice] = Object.keys(
      this.state[this.tableFilterType.multipleChoice],
    ).filter(
      (key) => this.state[this.tableFilterType.multipleChoice][key] === true,
    );

    this.popoverController.dismiss(this.dataToReturn[this.type], 'apply');
  }

  public cancel() {
    this.dataToReturn[this.tableFilterType.multipleChoice] =
      this.filterProps.currentSelection;

    this.popoverController.dismiss(this.dataToReturn[this.type], 'cancel');
  }

  public onSelectAll() {
    const stateObject = this.state[this.tableFilterType.multipleChoice];

    for (const key of Object.keys(stateObject)) {
      stateObject[key] = this.selectAll;
    }
  }
}
