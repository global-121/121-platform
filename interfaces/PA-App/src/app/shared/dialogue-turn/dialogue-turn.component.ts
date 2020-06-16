import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { environment } from 'src/environments/environment';

enum Actor {
  system = 'system',
  self = 'self',
  ngoDorcas = 'Dorcas',
  ngoEagles = 'Eagles',
}

@Component({
  selector: 'dialogue-turn',
  templateUrl: './dialogue-turn.component.html',
  styleUrls: ['./dialogue-turn.component.scss'],
})
export class DialogueTurnComponent implements OnChanges {
  @Input()
  isSpoken = false;

  @Input()
  actor = Actor.system;

  @Input()
  moment: Date;

  @Input()
  isConnected = false;

  isSelf: boolean;
  isSystem: boolean;

  // Hard-coded initial HOs:
  isNgoDorcas: boolean;
  isNgoEagles: boolean;

  animate = environment.useAnimation;

  constructor() {}

  ngOnInit() {
    this.isSelf = this.actor === Actor.self;
    this.isSystem = this.actor === Actor.system;
    this.updateNgos();
    this.moment = new Date();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.actor && typeof changes.actor.currentValue === 'string') {
      this.updateNgos();
    }
  }

  updateNgos() {
    this.isNgoDorcas = this.actor === Actor.ngoDorcas;
    this.isNgoEagles = this.actor === Actor.ngoEagles;
  }

  show() {
    this.isSpoken = true;
  }
}
