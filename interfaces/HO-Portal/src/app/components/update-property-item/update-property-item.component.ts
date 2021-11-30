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
  public showSubmit = true;

  @Output()
  updated: EventEmitter<string> = new EventEmitter<string>();

  public propertyModel: any | NgModel;

  constructor() {}

  ngOnInit() {
    this.propertyModel = this.value;
  }

  public doUpdate() {
    if (this.type === 'number' && !isNaN(Number(this.propertyModel)))
      this.propertyModel = Number(this.propertyModel);
    this.updated.emit(this.propertyModel);
  }
}
