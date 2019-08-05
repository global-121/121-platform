import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'dialogue-turn',
  templateUrl: './dialogue-turn.component.html',
  styleUrls: ['./dialogue-turn.component.scss'],
})
export class DialogueTurnComponent implements OnInit {

  @Input()
  actor = 'system';

  @Input()
  isConnected = false;

  isSelf = false;

  constructor() {
  }

  ngOnInit() {
    this.isSelf = (this.actor === 'self');
  }

}
