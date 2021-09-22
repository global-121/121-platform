import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgModel } from '@angular/forms';

@Component({
  selector: 'app-update-property-item',
  templateUrl: './update-property-item.component.html',
  styleUrls: ['./update-property-item.component.scss'],
})
export class UpdatePropertyItemComponent implements OnInit {
  @Input()
  public label: string;

  @Input()
  public explanation: string;

  @Input()
  public type: string;

  @Input()
  public value: string;

  @Input()
  public placeholder: string;

  @Input()
  public isDisabled: boolean;

  @Input()
  public inProgress: boolean;

  @Input()
  public fspList: any[];

  @Output()
  updated: EventEmitter<string> = new EventEmitter<string>();

  public propertyModel: any | NgModel;
  public fspAttributes: any[] = [];

  constructor() {}

  ngOnInit() {
    this.propertyModel = this.value;
    if (this.type == 'fsp') this.getFspAttributes(this.value);
  }

  public doUpdate() {
    this.updated.emit(this.propertyModel);
  }

  onFspChange({ detail }) {
    this.getFspAttributes(detail.value);
  }

  public getFspAttributes(fspString: string) {
    const selectedFsp = this.fspList.find(
      (fspItem) => fspItem.fsp == fspString,
    );

    if (selectedFsp) this.fspAttributes = selectedFsp.attributes;
  }
}
