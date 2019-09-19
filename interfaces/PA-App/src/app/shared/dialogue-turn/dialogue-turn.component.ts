import { Component, OnInit, Input } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'dialogue-turn',
  templateUrl: './dialogue-turn.component.html',
  styleUrls: ['./dialogue-turn.component.scss'],
})
export class DialogueTurnComponent implements OnInit {
  @Input()
  isSpoken = false;

  @Input()
  actor = 'system';

  @Input()
  moment: Date;

  @Input()
  isConnected = false;

  isSelf = false;
  animate = environment.useAnimation;

  constructor() {
  }

  ngOnInit() {
    this.isSelf = (this.actor === 'self');
    this.moment = new Date();
  }
}
