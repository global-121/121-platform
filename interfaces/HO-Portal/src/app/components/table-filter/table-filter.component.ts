import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import {
  TableFilterMultipleChoiceProps,
  TableFilterType,
} from 'src/app/models/table-filter.model';
import { TableFilterPopoverComponent } from './table-filter-popover/table-filter-popover.component';

@Component({
  selector: 'app-table-filter',
  templateUrl: './table-filter.component.html',
  styleUrls: ['./table-filter.component.scss'],
})
export class TableFilterComponent implements OnInit {
  @Input()
  public buttonLabel: string;

  @Input()
  public type: string;

  @Input()
  public filterProps: TableFilterMultipleChoiceProps;

  @Output()
  public filter: EventEmitter<string[]> = new EventEmitter<string[]>();

  public popoverOpen: boolean;

  constructor(public popoverController: PopoverController) {}

  ngOnInit() {
    this.popoverOpen = false;
  }

  public async openPopover(e: any) {
    const cssTypeClass = {
      [TableFilterType.multipleChoice]: 'table-filter-popover--multiple-choice',
    };

    const popover = await this.popoverController.create({
      component: TableFilterPopoverComponent,
      componentProps: {
        type: this.type,
        filterProps: this.filterProps,
      },
      event: e,
      cssClass: `table-filter-popover ${cssTypeClass[this.type]}`,
    });
    await popover.present();
    this.popoverOpen = true;

    popover.onDidDismiss().then((payload) => {
      this.popoverOpen = false;
      if (!payload || payload.role === 'backdrop') {
        return;
      }

      this.filter.emit(payload.data);
    });
  }
}
