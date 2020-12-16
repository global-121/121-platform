import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { InstanceService } from 'src/app/services/instance.service';
import { Actor } from 'src/app/shared/actor.enum';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'dialogue-turn',
  templateUrl: './dialogue-turn.component.html',
  styleUrls: ['./dialogue-turn.component.scss'],
  encapsulation: ViewEncapsulation.None, // Disabled to use the 'host-context'-level for `[dir='rtl']`-selector
})
export class DialogueTurnComponent implements OnInit {
  @Input()
  isSpoken = false;

  @Input()
  actor = Actor.system;

  @Input()
  moment: Date;

  @Input()
  isConnected = false;

  @Input()
  animate = environment.useAnimation;

  isSelf: boolean;
  isSystem: boolean;

  public allActors = Actor;

  constructor(private instanceService: InstanceService) {}

  ngOnInit() {
    this.moment = new Date();
    this.isSelf = this.actor === Actor.self;
    this.isSystem = this.actor === Actor.system;
    this.getInstanceInformation();
  }

  private async getInstanceInformation() {
    this.instanceService.instanceInformation.subscribe(
      (instanceInformation) => {
        this.updateActor(instanceInformation.name);
      },
    );
  }

  updateActor(newActor: Actor) {
    if (this.actor === Actor.system) {
      this.actor = newActor;
    }
    this.isSelf = this.actor === Actor.self;
    this.isSystem = this.actor === Actor.system;
  }

  show() {
    this.isSpoken = true;
  }
}
