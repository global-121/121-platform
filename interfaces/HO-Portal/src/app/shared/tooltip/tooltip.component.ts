import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';

@Component({
  selector: 'tooltip',
  templateUrl: './tooltip.component.html',
  styleUrls: ['./tooltip.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class TooltipComponent implements OnInit {
  @Input()
  public value: string;

  @ViewChild('button', { static: true })
  private button: any;

  constructor() {}

  ngOnInit() {}

  public toggle() {
    this.button.el.click();
  }
}
