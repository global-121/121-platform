import { Component, OnInit, Input } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'dialogue-turn',
  templateUrl: './dialogue-turn.component.html',
  styleUrls: ['./dialogue-turn.component.scss'],
})
export class DialogueTurnComponent implements OnInit {
  public imgPath121: string;
  public imgPathSelf: string;

  @Input()
  actor = 'system';

  @Input()
  moment: Date;

  @Input()
  isConnected = false;

  isSelf = false;

  constructor() {
  }

  ngOnInit() {
    this.imgPath121 = '../../..' + environment.subDirPath + '/assets/avatar--121.svg';
    this.imgPathSelf = '../../..' + environment.subDirPath + '/assets/avatar.svg';
    this.isSelf = (this.actor === 'self');
    this.moment = new Date();
  }

}
