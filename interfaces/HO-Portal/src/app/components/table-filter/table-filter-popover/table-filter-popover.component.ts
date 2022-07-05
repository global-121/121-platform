import { Component, Input, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import {
  TableFilterMultipleChoiceProps,
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

  public state;

  public selectAll: boolean = false;

  public tableFilterType = TableFilterType;

  constructor(private popoverController: PopoverController) {}

  ngOnInit() {
    this.state = {
      [this.tableFilterType.multipleChoice]: this.getMultipleChoiceState(),
    };

    if (
      this.filterProps.currentSelection.length ===
      this.filterProps.allOptions.length
    ) {
      this.selectAll = true;
    }
  }

  private getMultipleChoiceState() {
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

  public onCheckboxClick(optionName) {
    this.state[this.tableFilterType.multipleChoice][optionName] =
      !this.state[this.tableFilterType.multipleChoice][optionName];
  }

  public applyFilter() {
    const dataToReturn = {
      [this.tableFilterType.multipleChoice]: Object.keys(
        this.state[this.tableFilterType.multipleChoice],
      ).filter(
        (key) => this.state[this.tableFilterType.multipleChoice][key] === true,
      ),
    };

    this.popoverController.dismiss({ data: dataToReturn[this.type] });
  }

  public cancel() {
    const dataToReturn = {
      [this.tableFilterType.multipleChoice]: this.filterProps.currentSelection,
    };

    this.popoverController.dismiss({ data: dataToReturn[this.type] });
  }

  public onSelectAll() {
    this.selectAll = !this.selectAll;

    const stateObject = this.state[this.tableFilterType.multipleChoice];

    for (const key of Object.keys(stateObject)) {
      if (stateObject[key] !== this.selectAll) {
        this.onCheckboxClick(key);
      }
    }
  }
}
