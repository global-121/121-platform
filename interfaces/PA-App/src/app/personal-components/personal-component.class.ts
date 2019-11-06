import { ViewChildren, QueryList, OnInit, AfterViewInit, AfterContentInit, Input } from '@angular/core';

import { environment } from 'src/environments/environment';

import { DialogueTurnComponent } from '../shared/dialogue-turn/dialogue-turn.component';

export abstract class PersonalComponent implements OnInit, AfterViewInit, AfterContentInit {
  /**
   * The data required to 'reinstate' the component from history
   */
  @Input()
  data: any;

  @ViewChildren(DialogueTurnComponent)
  private turns: QueryList<DialogueTurnComponent>;

  private turnSpeed = (environment.useAnimation) ? 300 : 1;

  /**
   * The state of the whole component.
   * When there is no interaction possible anymore.
   */
  isDisabled: boolean;

  constructor() { }

  /**
   * Angular default component initialisation
   */
  ngOnInit() { }

  ngAfterViewInit() {
    this.setupTurns();
  }

  ngAfterContentInit() { }

  /**
   * Initialize the component for the first time
   */
  initNew(): void { }

  /**
   * Initialize the component from history
   */
  initHistory(): void { }


  private setupTurns() {
    this.turns.forEach((turn: DialogueTurnComponent, index: number) => {
      this.setTurnDateTime(turn);
      this.animateTurn(turn, this.turnSpeed * (index + 1));
    });
  }

  /**
   * Set the 'spoken' date/time to recorded date/time
   */
  private setTurnDateTime(turn: DialogueTurnComponent) {
    if (this.data && this.data.moment) {
      turn.moment = new Date(this.data.moment);
    }
  }

  /**
   * Delay appearance of each turn so it feels more like a 'natural' conversation
   */
  private animateTurn(turn: DialogueTurnComponent, delay: number) {
    window.setTimeout(() => {
      turn.isSpoken = true;
    }, delay);
  }

  /**
   * Show a specific, previously hidden, Dialogue-Turn
   */
  showTurn(index: number) {
    const turn = this.turns.toArray()[index];

    if (turn) {
      turn.isSpoken = true;
    }
  }

  /**
   * Provide the name of the next section to be loaded/shown.
   * This can contain logic to base the decision on user input, etc.
   */
  abstract getNextSection(): string;

  /**
   * Mark the component as 'done'.
   * This should include a call to `this.conversationService.onSectionCompleted()`
   */
  abstract complete(): void;
}
