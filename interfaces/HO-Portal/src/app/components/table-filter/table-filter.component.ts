import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PopoverController } from '@ionic/angular';
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
  public filterProps: {};

  @Output()
  public filter: EventEmitter<any> = new EventEmitter<any>();

  constructor(public popoverController: PopoverController) {}

  ngOnInit() {}

  public async openPopover(e: any) {
    const popover = await this.popoverController.create({
      component: TableFilterPopoverComponent,
      componentProps: {
        type: this.type,
        filterProps: this.filterProps,
      },
      event: e,
    });
    await popover.present();

    popover.onDidDismiss().then((data) => this.filter.emit(data));
  }
}
