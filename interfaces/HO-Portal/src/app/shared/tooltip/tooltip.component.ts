import { Component, Input, ViewChild, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-tooltip',
  templateUrl: './tooltip.component.html',
  styleUrls: ['./tooltip.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class TooltipComponent {
  @Input()
  public value: string;

  @ViewChild('button')
  private button: any;

  constructor() {}

  public toggle() {
    this.button.el.click();
  }
}
