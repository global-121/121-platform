import { Component, Input, OnInit, Optional } from '@angular/core';
import { InstanceService } from 'src/app/services/instance.service';
import { environment } from 'src/environments/environment';

enum Actor {
  system = 'system',
  self = 'self',
}

@Component({
  selector: 'dialogue-turn',
  templateUrl: './dialogue-turn.component.html',
  styleUrls: ['./dialogue-turn.component.scss'],
})
export class DialogueTurnComponent implements OnInit {
  @Input()
  isSpoken = false;

  @Input()
  actor: Actor | string = Actor.system;

  @Input()
  moment: Date;

  @Input()
  isConnected = false;

  isSelf: boolean;
  isSystem: boolean;

  public allActors = Actor;

  animate = environment.useAnimation;

  constructor(@Optional() private instanceService: InstanceService) {}

  ngOnInit() {
    this.isSelf = this.actor === Actor.self;
    this.isSystem = this.actor === Actor.system;
    this.moment = new Date();
    this.getInstanceInformation();
  }

  private getInstanceInformation(): void {
    if (!this.instanceService) {
      return;
    }
    this.instanceService.instanceInformation.subscribe((instanceInfo) => {
      this.updateActor(instanceInfo.name);
    });
  }

  private updateActor(newActor: Actor | string): void {
    if (this.actor === Actor.system) {
      this.actor = newActor;
    }
    this.isSelf = this.actor === Actor.self;
    this.isSystem = this.actor === Actor.system;
  }

  public show(): void {
    this.isSpoken = true;
  }
}
